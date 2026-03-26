/**
 * Core types for the Railmate app
 */

export interface Station {
  id: string;
  name: string;
  code?: string;
  country?: string;
}

export interface TrainJourney {
  id: string;
  trainNumber: string;
  trainName?: string;
  operator?: string;
  origin: Station;
  destination: Station;
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  platform: string;
  status: JourneyStatus;
  delayMinutes?: number;
  stops?: Stop[];
  progress?: number;
  distance?: number; // in meters
}

export type JourneyStatus =
  | 'ON_TIME'
  | 'DELAYED'
  | 'CANCELLED'
  | 'BOARDING'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'UNKNOWN'
  | 'SCHEDULED';

export interface Stop {
  station: Station;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival?: string;
  actualDeparture?: string;
  platform?: string;
  status: JourneyStatus;
}

export interface Departure {
  id: string;
  trainNumber: string;
  trainName?: string;
  destination: Station;
  scheduledTime: string;
  actualTime?: string;
  platform: string;
  status: JourneyStatus;
  delayMinutes?: number;
  via?: string[];
}

export interface JourneyStats {
  totalJourneys: number;
  totalDistance: number;
  totalDuration: number;
  favoriteRoute?: {
    origin: string;
    destination: string;
    count: number;
  };
  onTimePercentage: number;
}

export interface SearchResult {
  journeys: TrainJourney[];
  from: Station;
  to: Station;
  date: string;
}
