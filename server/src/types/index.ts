export interface Station {
  id: string;
  name: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  products?: {
    nationalExpress?: boolean;
    national?: boolean;
    regionalExp?: boolean;
    regional?: boolean;
    suburban?: boolean;
    bus?: boolean;
    ferry?: boolean;
    subway?: boolean;
    tram?: boolean;
    taxi?: boolean;
  };
}

export interface Departure {
  tripId: string;
  stop: Station;
  when: string;
  plannedWhen: string;
  delay: number;
  platform: string;
  plannedPlatform: string;
  direction: string;
  line: {
    id: string;
    name: string;
    product: string;
    productName: string;
    mode: string;
    public: boolean;
  };
  remarks: Remark[];
  cancelled: boolean;
}

export interface Remark {
  type: string;
  code: string;
  text: string;
}

export interface Stopover {
  stop: Station;
  arrival: string | null;
  plannedArrival: string | null;
  departure: string | null;
  plannedDeparture: string | null;
  arrivalDelay?: number;
  departureDelay?: number;
  platform?: string;
}

export interface JourneyLeg {
  origin: {
    id: string;
    name: string;
    departure: string;
    departurePlatform: string;
  };
  destination: {
    id: string;
    name: string;
    arrival: string;
    arrivalPlatform: string;
  };
  line: {
    name: string;
    product: string;
  };
  departureDelay?: number;
  arrivalDelay?: number;
  distance?: number;
  remarks: Remark[];
  stopovers?: Stopover[];
}

export interface Journey {
  id: string;
  type: string;
  legs: JourneyLeg[];
  price?: {
    amount: number;
    currency: string;
  };
}

export interface TrainJourney {
  id: string;
  operator: string;
  trainNumber: string;
  trainType: string;
  origin: Station;
  destination: Station;
  scheduledDeparture: string;
  actualDeparture: string;
  departureDelay: number;
  departurePlatform: string;
  scheduledArrival: string;
  actualArrival: string;
  arrivalDelay: number;
  arrivalPlatform: string;
  status: JourneyStatus;
  delayReason?: string;
  stops: Stopover[];
  amenities: string[];
  cancelled: boolean;
}

export enum JourneyStatus {
  SCHEDULED = 'SCHEDULED',
  ON_TIME = 'ON_TIME',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
  BOARDING = 'BOARDING',
  DEPARTED = 'DEPARTED',
  ARRIVED = 'ARRIVED',
}

export interface User {
  id: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
