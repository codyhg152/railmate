/**
 * Smart State Engine - Flighty-style contextual journey states
 * Determines the appropriate UI state based on time, location, and train status
 */
import { differenceInMinutes, parseISO } from 'date-fns';
import { TrainJourney, JourneyStatus } from '../lib/types';

export enum JourneyState {
  farOut = 'farOut',               // >24h: Confirmation, terminal info
  dayBefore = 'dayBefore',         // 3-24h: Platform, departure time
  headToStation = 'headToStation', // 1-3h: 'Leave by' time
  atStation = 'atStation',         // 10-60 min: Station context
  atPlatform = 'atPlatform',       // <10 min: Boarding countdown
  boarding = 'boarding',           // Status=BOARDING: Seat info
  onBoard = 'onBoard',             // Just departed, low progress: Seated status
  taxiing = 'taxiing',             // Departed, progress 1-5%: Moving
  inTransit = 'inTransit',         // Progress 5-85%: Offline progress
  arriving = 'arriving',           // Progress 85-100%: Approaching
  arrived = 'arrived',             // Status=ARRIVED: At destination
  atPlatformDest = 'atPlatformDest', // Just arrived at platform
  connection = 'connection',       // Has connecting train
  completed = 'completed',         // Trip fully done
  delayed = 'delayed',             // Any delay state
}

export interface StateContent {
  headline: string;
  primary: string;
  secondary?: string;
  action?: string;
  accent?: string; // color key from COLORS
}

export interface SmartStateResult {
  state: JourneyState;
  content: StateContent;
  minutesUntilDeparture: number;
  minutesUntilArrival: number;
  isActive: boolean;
  isComplete: boolean;
}

export function computeSmartState(
  journey: TrainJourney,
  now: Date = new Date()
): SmartStateResult {
  const departure = parseISO(journey.scheduledDeparture);
  const arrival = parseISO(journey.scheduledArrival);
  const minutesUntilDeparture = differenceInMinutes(departure, now);
  const minutesUntilArrival = differenceInMinutes(arrival, now);
  const progress = journey.progress ?? 0;
  const status: JourneyStatus = journey.status;
  const delay = journey.delayMinutes ?? 0;
  const platform = journey.platform || '—';

  const isActive = status === 'DEPARTED' || status === 'BOARDING';
  const isComplete = status === 'ARRIVED' || minutesUntilArrival < -15;

  let state: JourneyState;
  let content: StateContent;

  if (status === 'CANCELLED') {
    state = JourneyState.delayed;
    content = {
      headline: 'Cancelled',
      primary: `${journey.trainNumber} has been cancelled`,
      secondary: 'Check for alternative trains',
      accent: 'danger',
    };
  } else if (minutesUntilArrival < -120) {
    state = JourneyState.completed;
    content = {
      headline: 'Journey Complete',
      primary: `${journey.origin.name} → ${journey.destination.name}`,
      secondary: delay > 0 ? `Arrived ${delay} min late` : 'Arrived on time',
      accent: 'success',
    };
  } else if (status === 'ARRIVED' || (minutesUntilArrival < -5 && minutesUntilArrival > -120)) {
    state = JourneyState.atPlatformDest;
    content = {
      headline: 'Arrived',
      primary: journey.destination.name,
      secondary: delay > 0 ? `${delay} min late` : 'On time',
      accent: delay > 0 ? 'warning' : 'success',
    };
  } else if (status === 'DEPARTED' && progress >= 85) {
    state = JourneyState.arriving;
    content = {
      headline: 'Approaching',
      primary: journey.destination.name,
      secondary: `Arriving in ~${Math.max(1, minutesUntilArrival)} min`,
      accent: 'info',
    };
  } else if (status === 'DEPARTED' && progress > 5) {
    const hasConnection = (journey.stops?.length ?? 0) > 0;
    if (hasConnection && progress >= 70) {
      state = JourneyState.connection;
      const nextStop = journey.stops![journey.stops!.length - 1];
      content = {
        headline: 'Connection',
        primary: nextStop.station.name,
        secondary: `Platform ${nextStop.platform ?? '—'}`,
        accent: 'primary',
      };
    } else {
      state = JourneyState.inTransit;
      const etaMin = Math.max(1, minutesUntilArrival);
      content = {
        headline: 'In Transit',
        primary: `${Math.round(progress)}% complete`,
        secondary: `${etaMin} min to ${journey.destination.name}`,
        accent: 'primary',
      };
    }
  } else if (status === 'DEPARTED' && progress <= 5) {
    state = JourneyState.taxiing;
    content = {
      headline: 'Departed',
      primary: journey.trainNumber,
      secondary: `En route to ${journey.destination.name}`,
      accent: 'info',
    };
  } else if (minutesUntilDeparture < 0 && minutesUntilDeparture > -15) {
    // Just departed, status not yet updated from API
    state = JourneyState.onBoard;
    content = {
      headline: 'Departed',
      primary: journey.trainNumber,
      secondary: `Heading to ${journey.destination.name}`,
      accent: 'info',
    };
  } else if (status === 'BOARDING') {
    if (delay > 0) {
      state = JourneyState.delayed;
      content = {
        headline: `+${delay} min`,
        primary: 'Delayed departure',
        secondary: `Now boarding • Platform ${platform}`,
        accent: 'warning',
      };
    } else {
      state = JourneyState.boarding;
      content = {
        headline: 'Boarding',
        primary: `Platform ${platform}`,
        secondary: 'Now boarding',
        action: 'Show ticket',
        accent: 'success',
      };
    }
  } else if (delay > 5 && minutesUntilDeparture >= 0 && minutesUntilDeparture < 180) {
    state = JourneyState.delayed;
    const newDeparture = minutesUntilDeparture + delay;
    content = {
      headline: `+${delay} min`,
      primary: `Delayed • Platform ${platform}`,
      secondary: `Departing in ~${newDeparture} min`,
      accent: 'warning',
    };
  } else if (minutesUntilDeparture <= 10 && minutesUntilDeparture >= 0) {
    state = JourneyState.atPlatform;
    content = {
      headline: minutesUntilDeparture <= 1 ? 'Boarding now' : `${minutesUntilDeparture} min`,
      primary: `Platform ${platform}`,
      secondary: 'Board train',
      action: 'Show ticket',
      accent: minutesUntilDeparture <= 3 ? 'warning' : 'primary',
    };
  } else if (minutesUntilDeparture <= 60) {
    state = JourneyState.atStation;
    content = {
      headline: `${minutesUntilDeparture} min`,
      primary: `Platform ${platform}`,
      secondary: journey.origin.name,
      accent: 'text',
    };
  } else if (minutesUntilDeparture <= 180) {
    state = JourneyState.headToStation;
    const leaveIn = Math.max(0, minutesUntilDeparture - 30);
    content = {
      headline: leaveIn === 0 ? 'Leave now' : `Leave in ${leaveIn} min`,
      primary: `Departs in ${minutesUntilDeparture} min`,
      secondary: `Platform ${platform} • ${journey.origin.name}`,
      accent: leaveIn < 15 ? 'warning' : 'text',
    };
  } else if (minutesUntilDeparture <= 1440) {
    state = JourneyState.dayBefore;
    const hoursUntil = Math.round(minutesUntilDeparture / 60);
    content = {
      headline: `${hoursUntil}h away`,
      primary: `Platform ${platform}`,
      secondary: `${journey.origin.name} → ${journey.destination.name}`,
      accent: 'textSecondary',
    };
  } else {
    state = JourneyState.farOut;
    const daysUntil = Math.floor(minutesUntilDeparture / 1440);
    content = {
      headline: `In ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      primary: `${journey.origin.name} → ${journey.destination.name}`,
      secondary: journey.trainNumber,
      accent: 'textSecondary',
    };
  }

  return {
    state,
    content,
    minutesUntilDeparture,
    minutesUntilArrival,
    isActive,
    isComplete,
  };
}

/**
 * Returns true if transitioning to `next` warrants a haptic notification
 */
export function isSignificantTransition(
  prev: JourneyState | null,
  next: JourneyState
): boolean {
  if (prev === null || prev === next) return false;
  const significant = new Set<JourneyState>([
    JourneyState.atPlatform,
    JourneyState.boarding,
    JourneyState.taxiing,
    JourneyState.arriving,
    JourneyState.atPlatformDest,
    JourneyState.delayed,
  ]);
  return significant.has(next);
}
