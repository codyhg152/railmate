import axios, { AxiosInstance, AxiosError } from 'axios';
import { redis } from './database';
import { Station, Departure, Journey, TrainJourney, JourneyStatus } from '../types';

export abstract class BaseTrainAdapter {
  protected client: AxiosInstance;
  protected name: string;
  protected baseURL: string;
  protected rateLimitPerMinute: number;
  private requestTimestamps: number[] = [];

  constructor(name: string, baseURL: string, rateLimitPerMinute: number = 100) {
    this.name = name;
    this.baseURL = baseURL;
    this.rateLimitPerMinute = rateLimitPerMinute;
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'User-Agent': 'Railmate/1.0',
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

  protected async getCached<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  }

  protected async setCached<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  protected normalizeError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        return new Error('STATION_NOT_FOUND');
      } else if (status === 429) {
        return new Error('RATE_LIMITED');
      } else if (status >= 500) {
        return new Error('SERVICE_UNAVAILABLE');
      }
    }
    return new Error('SERVICE_UNAVAILABLE');
  }

  abstract searchStations(query: string, limit?: number): Promise<Station[]>;
  abstract getDepartures(stationId: string, duration?: number): Promise<Departure[]>;
  abstract searchJourneys(from: string, to: string, date?: string): Promise<Journey[]>;
  abstract getJourneyDetails(journeyId: string): Promise<TrainJourney | null>;
}