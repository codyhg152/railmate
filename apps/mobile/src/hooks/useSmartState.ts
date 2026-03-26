/**
 * useSmartState - Hook to compute and track journey smart state
 * Fires haptic feedback on significant state transitions
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { TrainJourney } from '../lib/types';
import {
  JourneyState,
  SmartStateResult,
  computeSmartState,
  isSignificantTransition,
} from '../utils/smartState';
import { APP_CONFIG } from '../lib/constants';

export function useSmartState(journey: TrainJourney | null): SmartStateResult | null {
  const [result, setResult] = useState<SmartStateResult | null>(
    journey ? computeSmartState(journey) : null
  );
  const prevStateRef = useRef<JourneyState | null>(null);

  const update = useCallback(() => {
    if (!journey) {
      setResult(null);
      return;
    }
    const next = computeSmartState(journey);
    const prevState = prevStateRef.current;

    if (isSignificantTransition(prevState, next.state)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    prevStateRef.current = next.state;
    setResult(next);
  }, [journey]);

  useEffect(() => {
    update();
    const interval = setInterval(update, APP_CONFIG.REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [update]);

  return result;
}

/**
 * useSmartStates - Hook to compute smart states for a list of journeys
 */
export function useSmartStates(journeys: TrainJourney[]): SmartStateResult[] {
  const [results, setResults] = useState<SmartStateResult[]>(() =>
    journeys.map((j) => computeSmartState(j))
  );
  const prevStatesRef = useRef<Map<string, JourneyState>>(new Map());

  const update = useCallback(() => {
    const nextResults = journeys.map((j) => computeSmartState(j));

    // Fire haptics for any significant transition
    let hasFiredHaptic = false;
    nextResults.forEach((r, i) => {
      const journey = journeys[i];
      const prev = prevStatesRef.current.get(journey.id) ?? null;
      if (!hasFiredHaptic && isSignificantTransition(prev, r.state)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        hasFiredHaptic = true;
      }
      prevStatesRef.current.set(journey.id, r.state);
    });

    setResults(nextResults);
  }, [journeys]);

  useEffect(() => {
    update();
    const interval = setInterval(update, APP_CONFIG.REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [update]);

  return results;
}
