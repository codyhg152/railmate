import axios, { AxiosInstance, AxiosError } from 'axios';
import { redis } from '../utils/database';
import { Station, Departure, Journey, TrainJourney, JourneyStatus } from '../types';

/**
 * Base adapter class for train API integrations
 * Provides common functionality for rate limiting, caching, and error handling
 * 
 * Rate Limits (default): 100 requests per minute
 * Caching: Redis-based with configurable TTL
 */
export abstract class BaseTrainAdapter {
  protected client: AxiosInstance;
  public name: string;
  protected baseURL: string;
  protected rateLimitPerMinute: number;
  protected requestTimestamps: number[] = [];
  protected apiVersion: string = '1.0';

  constructor(name: string, baseURL: string, rateLimitPerMinute: number = 100) {
    this.name = name;
    this.baseURL = baseURL;
    this.rateLimitPerMinute = rateLimitPerMinute;
    
    this.client = axios.create({
      baseURL,
      timeout: 15000, // Increased timeout for reliability
      headers: {
        'User-Agent': 'Railmate/1.0',
        'Accept': 'application/json',
      },
    });

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      await this.enforceRateLimit();
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error(`[${this.name}] API Error:`, error.message);
        throw this.normalizeError(error);
      }
    );
  }

  /**
   * Enforce rate limiting to avoid API throttling
   * Tracks requests per minute and waits if limit is exceeded
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);
    
    if (this.requestTimestamps.length >= this.rateLimitPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestTimestamp) + 100;
      console.log(`[${this.name}] Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requestTimestamps.push(now);
  }

  /**
   * Get cached data from Redis
   * @param key Cache key
   * @returns Cached data or null
   */
  protected async getCached<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      console.error(`[${this.name}] Cache get error:`, error);
    }
    return null;
  }

  /**
   * Set cached data in Redis
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds Time to live in seconds
   */
  protected async setCached<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.error(`[${this.name}] Cache set error:`, error);
    }
  }

  /**
   * Normalize API errors to standard error types
   * @param error Axios error
   * @returns Standardized Error
   */
  protected normalizeError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      if (status === 404) {
        return new Error('STATION_NOT_FOUND');
      } else if (status === 429) {
        return new Error('RATE_LIMITED');
      } else if (status === 401 || status === 403) {
        return new Error('AUTHENTICATION_ERROR');
      } else if (status === 400) {
        return new Error(`BAD_REQUEST: ${data?.message || 'Invalid request'}`);
      } else if (status >= 500) {
        return new Error('SERVICE_UNAVAILABLE');
      }
    } else if (error.code === 'ECONNABORTED') {
      return new Error('TIMEOUT');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error('NETWORK_ERROR');
    }
    return new Error('SERVICE_UNAVAILABLE');
  }

  /**
   * Check if the API is accessible
   * @returns true if API is healthy
   */
  abstract healthCheck(): Promise<boolean>;

  abstract searchStations(query: string, limit?: number): Promise<Station[]>;
  abstract getDepartures(stationId: string, duration?: number): Promise<Departure[]>;
  abstract searchJourneys(from: string, to: string, date?: string): Promise<Journey[]>;
  abstract getJourneyDetails(journeyId: string): Promise<TrainJourney | null>;
}
