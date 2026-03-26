import { BaseTrainAdapter } from './base';
import { Station, Departure, Journey, TrainJourney, JourneyStatus } from '../types';

/**
 * National Rail UK Adapter
 * Uses Darwin SOAP API via OpenLDBWS
 * 
 * API Documentation: https://www.nationalrail.co.uk/developers/
 * Darwin SOAP API: https://lite.realtime.nationalrail.co.uk/OpenLDBWS
 * 
 * Note: National Rail uses CRS (Computer Reservation System) codes for stations
 * not searchable names. A static mapping of station names to CRS codes is needed.
 * 
 * Rate Limit: 100 requests/minute (default)
 * 
 * Endpoints (SOAP):
 * - GetDepartureBoard - Get departures for a station
 * - GetArrivalBoard - Get arrivals for a station
 * - GetServiceDetails - Get detailed information about a specific service
 * 
 * New: Rail Data Marketplace (RDM) https://raildata.org.uk/ - Modern REST APIs
 * 
 * Caching Strategy:
 * - Stations: 24 hours (static data)
 * - Departures: 30 seconds
 * - Journey Details: 10 seconds
 */

// Common UK station CRS codes mapping
// In production, this should be loaded from a database or external file
const UK_STATIONS: Record<string, string> = {
  'London Euston': 'EUS',
  'London Kings Cross': 'KGX',
  'London Paddington': 'PAD',
  'London Victoria': 'VIC',
  'London Waterloo': 'WAT',
  'London Liverpool Street': 'LST',
  'London Bridge': 'LBG',
  'London St Pancras': 'STP',
  'Birmingham New Street': 'BHM',
  'Manchester Piccadilly': 'MAN',
  'Edinburgh Waverley': 'EDB',
  'Glasgow Central': 'GLC',
  'Leeds': 'LDS',
  'Liverpool Lime Street': 'LIV',
  'Bristol Temple Meads': 'BRI',
  'Cardiff Central': 'CDF',
  'Newcastle': 'NCL',
  'York': 'YRK',
  'Nottingham': 'NOT',
  'Sheffield': 'SHF',
  'Reading': 'RDG',
  'Oxford': 'OXF',
  'Cambridge': 'CBG',
  'Brighton': 'BTN',
  'Southampton Central': 'SOU',
  'Portsmouth Harbour': 'PMH',
  'Bournemouth': 'BMH',
  'Plymouth': 'PLY',
  'Exeter St Davids': 'EXD',
  'Norwich': 'NRW',
  'Ipswich': 'IPS',
};

interface DarwinDeparture {
  service: {
    serviceID: string;
    sta?: string; // Scheduled time of arrival
    eta?: string; // Estimated time of arrival
    std?: string; // Scheduled time of departure
    etd?: string; // Estimated time of departure
    platform?: string;
    operator?: string;
    operatorCode?: string;
    length?: number;
    cancelReason?: string;
    delayReason?: string;
    isCancelled?: boolean;
    destination: Array<{
      locationName: string;
      crs: string;
    }>;
    origin: Array<{
      locationName: string;
      crs: string;
    }>;
  };
}

export class NationalRailAdapter extends BaseTrainAdapter {
  private apiToken: string;

  constructor(apiToken: string = '') {
    super('NationalRail', 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS', 100);
    this.apiVersion = '2024';
    this.apiToken = apiToken;
  }

  /**
   * Build SOAP envelope for Darwin API requests
   */
  private buildSOAPEnvelope(body: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope/" 
               xmlns:typ="http://thalesgroup.com/RTTI/2013-11-28/Token/types"
               xmlns:ldb="http://thalesgroup.com/RTTI/2017-10-01/ldb/">
  <soap:Header>
    <typ:AccessToken>
      <typ:TokenValue>${this.apiToken}</typ:TokenValue>
    </typ:AccessToken>
  </soap:Header>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Parse SOAP response to JSON
   */
  private parseSOAPResponse(xml: string): any {
    // Simple XML parsing - in production, use a proper XML parser like fast-xml-parser
    const parseTag = (tag: string, content: string): string | null => {
      const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
      const match = content.match(regex);
      return match ? match[1] : null;
    };

    const parseBoolTag = (tag: string, content: string): boolean => {
      const value = parseTag(tag, content);
      return value === 'true';
    };

    return { xml, parseTag, parseBoolTag };
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiToken) return false;
    
    try {
      // Try to get departures for a major station
      const response = await this.client.post('', 
        this.buildSOAPEnvelope(`
          <ldb:GetDepartureBoardRequest>
            <ldb:numRows>1</ldb:numRows>
            <ldb:crs>EUS</ldb:crs>
          </ldb:GetDepartureBoardRequest>
        `),
        {
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': 'http://thalesgroup.com/RTTI/2017-10-01/ldb/GetDepartureBoard',
          },
          timeout: 5000,
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('[NationalRail] Health check failed:', error);
      return false;
    }
  }

  async searchStations(query: string, limit: number = 10): Promise<Station[]> {
    // National Rail uses CRS codes, not a searchable API
    // Search our static mapping
    const normalizedQuery = query.toLowerCase();
    const matches = Object.entries(UK_STATIONS)
      .filter(([name]) => name.toLowerCase().includes(normalizedQuery))
      .slice(0, limit)
      .map(([name, crs]) => ({
        id: crs,
        name,
        country: 'GB',
        coordinates: { latitude: 0, longitude: 0 }, // Would need geocoding
        timezone: 'Europe/London',
      }));

    return matches;
  }

  async getDepartures(stationId: string, duration: number = 60): Promise<Departure[]> {
    if (!this.apiToken) {
      console.warn('[NationalRail] No API token provided');
      return [];
    }
    
    const cacheKey = `nr:departures:${stationId}:${duration}`;
    const cached = await this.getCached<Departure[]>(cacheKey);
    if (cached) return cached;

    try {
      // SOAP request to GetDepartureBoard
      const soapBody = this.buildSOAPEnvelope(`
        <ldb:GetDepartureBoardRequest>
          <ldb:numRows>20</ldb:numRows>
          <ldb:crs>${stationId}</ldb:crs>
          <ldb:timeWindow>${duration}</ldb:timeWindow>
        </ldb:GetDepartureBoardRequest>
      `);

      const response = await this.client.post('', soapBody, {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://thalesgroup.com/RTTI/2017-10-01/ldb/GetDepartureBoard',
        },
      });

      // Parse SOAP response
      // Note: In production, use a proper XML parser
      const parser = this.parseSOAPResponse(response.data);
      
      // Extract service information from XML
      // This is a simplified parsing - proper implementation needed
      const services: Departure[] = [];
      const serviceMatches = response.data.match(/<lt5:service>/g);
      
      if (serviceMatches) {
        for (let i = 0; i < serviceMatches.length; i++) {
          const serviceXml = response.data.split('<lt5:service>')[i + 1];
          if (!serviceXml) continue;

          const std = parser.parseTag('lt4:std', serviceXml) || '';
          const etd = parser.parseTag('lt4:etd', serviceXml) || std;
          const platform = parser.parseTag('lt4:platform', serviceXml) || '';
          const operator = parser.parseTag('lt4:operator', serviceXml) || '';
          const isCancelled = parser.parseBoolTag('lt4:isCancelled', serviceXml);
          
          // Extract destination
          const destinationMatch = serviceXml.match(/<lt4:destination>([\s\S]*?)<\/lt4:destination>/);
          const destinationName = destinationMatch 
            ? parser.parseTag('lt4:locationName', destinationMatch[1]) || 'Unknown'
            : 'Unknown';

          // Calculate delay
          let delay = 0;
          if (etd !== 'On time' && etd !== 'Cancelled' && etd !== std) {
            // Parse delay from ETD (format: "HH:MM" or "HH:MM:SS")
            const stdMinutes = this.timeToMinutes(std);
            const etdMinutes = this.timeToMinutes(etd);
            if (stdMinutes !== null && etdMinutes !== null) {
              delay = Math.max(0, etdMinutes - stdMinutes);
            }
          }

          services.push({
            tripId: parser.parseTag('lt4:serviceID', serviceXml) || '',
            stop: {
              id: stationId,
              name: UK_STATIONS[stationId] || stationId,
              country: 'GB',
              coordinates: { latitude: 0, longitude: 0 },
              timezone: 'Europe/London',
            },
            when: etd === 'Cancelled' ? std : etd,
            plannedWhen: std,
            delay,
            platform,
            plannedPlatform: platform,
            direction: destinationName,
            line: {
              id: operator,
              name: operator,
              product: 'train',
              productName: operator,
              mode: 'train',
              public: true,
            },
            remarks: isCancelled ? [{ type: 'cancellation', code: 'CANCELLED', text: 'Service cancelled' }] : [],
            cancelled: isCancelled,
          });
        }
      }

      await this.setCached(cacheKey, services, 30); // 30 seconds
      return services;
    } catch (error) {
      console.error('[NationalRail] Error getting departures:', error);
      return [];
    }
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number | null {
    if (!time || time === 'On time' || time === 'Cancelled' || time === 'Delayed') {
      return null;
    }
    const parts = time.split(':');
    if (parts.length < 2) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  }

  async searchJourneys(from: string, to: string, date?: string): Promise<Journey[]> {
    if (!this.apiToken) {
      console.warn('[NationalRail] No API token provided');
      return [];
    }
    
    // National Rail Darwin doesn't have a direct journey planner
    // Would need to use Online Journey Planner (OJP) API or external service
    // For now, return empty array
    console.warn('[NationalRail] Journey planning not implemented - requires OJP API');
    return [];
  }

  async getJourneyDetails(journeyId: string): Promise<TrainJourney | null> {
    if (!this.apiToken) {
      console.warn('[NationalRail] No API token provided');
      return null;
    }
    
    const cacheKey = `nr:journey:${journeyId}`;
    const cached = await this.getCached<TrainJourney>(cacheKey);
    if (cached) return cached;

    try {
      // SOAP request to GetServiceDetails
      const soapBody = this.buildSOAPEnvelope(`
        <ldb:GetServiceDetailsRequest>
          <ldb:serviceID>${journeyId}</ldb:serviceID>
        </ldb:GetServiceDetailsRequest>
      `);

      const response = await this.client.post('', soapBody, {
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'SOAPAction': 'http://thalesgroup.com/RTTI/2017-10-01/ldb/GetServiceDetails',
        },
      });

      // Parse SOAP response
      const parser = this.parseSOAPResponse(response.data);
      const xml = response.data;

      const std = parser.parseTag('lt4:std', xml) || '';
      const sta = parser.parseTag('lt4:sta', xml) || '';
      const etd = parser.parseTag('lt4:etd', xml) || std;
      const eta = parser.parseTag('lt4:eta', xml) || sta;
      const platform = parser.parseTag('lt4:platform', xml) || '';
      const isCancelled = parser.parseBoolTag('lt4:isCancelled', xml);
      
      // Extract origin and destination
      const originName = parser.parseTag('lt4:locationName', xml.split('<lt4:origin>')[1] || '') || '';
      const destinationName = parser.parseTag('lt4:locationName', xml.split('<lt4:destination>')[1] || '') || '';

      // Calculate delays
      const departureDelay = this.calculateDelay(std, etd);
      const arrivalDelay = this.calculateDelay(sta, eta);

      let status = JourneyStatus.SCHEDULED;
      if (isCancelled) {
        status = JourneyStatus.CANCELLED;
      } else if (departureDelay > 0 || arrivalDelay > 0) {
        status = JourneyStatus.DELAYED;
      }

      const trainJourney: TrainJourney = {
        id: journeyId,
        operator: parser.parseTag('lt4:operator', xml) || 'Unknown',
        trainNumber: parser.parseTag('lt4:serviceID', xml) || '',
        trainType: 'train',
        origin: {
          id: '',
          name: originName,
          country: 'GB',
          coordinates: { latitude: 0, longitude: 0 },
          timezone: 'Europe/London',
        },
        destination: {
          id: '',
          name: destinationName,
          country: 'GB',
          coordinates: { latitude: 0, longitude: 0 },
          timezone: 'Europe/London',
        },
        scheduledDeparture: std,
        actualDeparture: etd === 'Cancelled' ? std : etd,
        departureDelay,
        departurePlatform: platform,
        scheduledArrival: sta,
        actualArrival: eta === 'Cancelled' ? sta : eta,
        arrivalDelay,
        arrivalPlatform: platform,
        status,
        stops: [], // Would need to parse calling points
        amenities: [],
        cancelled: isCancelled,
      };

      await this.setCached(cacheKey, trainJourney, 10); // 10 seconds
      return trainJourney;
    } catch (error) {
      console.error('[NationalRail] Error getting journey details:', error);
      return null;
    }
  }

  /**
   * Calculate delay in minutes between scheduled and actual times
   */
  private calculateDelay(scheduled: string, actual: string): number {
    if (!scheduled || !actual || actual === 'On time' || actual === 'Cancelled') {
      return 0;
    }
    const scheduledMinutes = this.timeToMinutes(scheduled);
    const actualMinutes = this.timeToMinutes(actual);
    if (scheduledMinutes === null || actualMinutes === null) {
      return 0;
    }
    return Math.max(0, actualMinutes - scheduledMinutes);
  }

  /**
   * Get all available UK stations
   * Returns the static station list
   */
  getAvailableStations(): Station[] {
    return Object.entries(UK_STATIONS).map(([name, crs]) => ({
      id: crs,
      name,
      country: 'GB',
      coordinates: { latitude: 0, longitude: 0 },
      timezone: 'Europe/London',
    }));
  }
}
