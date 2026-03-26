/**
 * Hook for iOS Live Activities
 * Provides a React-friendly interface for managing Live Activities
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  isLiveActivitiesSupported,
  startLiveActivity,
  updateLiveActivity,
  endLiveActivity,
  getActiveLiveActivities,
  endAllLiveActivities,
  onLiveActivityPushToken,
  JourneyData,
  ActivityUpdate,
  ActivityInfo,
} from '../modules/LiveActivity';

interface UseLiveActivityReturn {
  isSupported: boolean;
  isLoading: boolean;
  activeActivities: ActivityInfo[];
  startActivity: (data: JourneyData) => Promise<string | null>;
  updateActivity: (activityId: string, data: ActivityUpdate) => Promise<boolean>;
  endActivity: (activityId: string) => Promise<boolean>;
  endAllActivities: () => Promise<boolean>;
  refreshActivities: () => Promise<void>;
}

export function useLiveActivity(): UseLiveActivityReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [activeActivities, setActiveActivities] = useState<ActivityInfo[]>([]);
  const isSupported = isLiveActivitiesSupported();
  const pushTokenCallbacksRef = useRef<((activityId: string, pushToken: string) => void)[]>([]);

  // Subscribe to push token updates
  useEffect(() => {
    if (!isSupported) return;

    const unsubscribe = onLiveActivityPushToken((activityId, pushToken) => {
      console.log(`Live Activity ${activityId} push token: ${pushToken}`);
      // Notify all registered callbacks
      pushTokenCallbacksRef.current.forEach((callback) => {
        callback(activityId, pushToken);
      });
    });

    // Load initial activities
    refreshActivities();

    return unsubscribe;
  }, [isSupported]);

  // Refresh the list of active activities
  const refreshActivities = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    try {
      const activities = await getActiveLiveActivities();
      setActiveActivities(activities);
    } catch (error) {
      console.error('Failed to refresh activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Start a new Live Activity
  const startActivity = useCallback(
    async (data: JourneyData): Promise<string | null> => {
      if (!isSupported) return null;

      setIsLoading(true);
      try {
        const activityId = await startLiveActivity(data);
        if (activityId) {
          await refreshActivities();
        }
        return activityId;
      } catch (error) {
        console.error('Failed to start Live Activity:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, refreshActivities]
  );

  // Update an existing Live Activity
  const updateActivity = useCallback(
    async (activityId: string, data: ActivityUpdate): Promise<boolean> => {
      if (!isSupported) return false;

      setIsLoading(true);
      try {
        const success = await updateLiveActivity(activityId, data);
        if (success) {
          await refreshActivities();
        }
        return success;
      } catch (error) {
        console.error('Failed to update Live Activity:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, refreshActivities]
  );

  // End a Live Activity
  const endActivity = useCallback(
    async (activityId: string): Promise<boolean> => {
      if (!isSupported) return false;

      setIsLoading(true);
      try {
        const success = await endLiveActivity(activityId);
        if (success) {
          await refreshActivities();
        }
        return success;
      } catch (error) {
        console.error('Failed to end Live Activity:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported, refreshActivities]
  );

  // End all Live Activities
  const endAllActivities = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const success = await endAllLiveActivities();
      if (success) {
        await refreshActivities();
      }
      return success;
    } catch (error) {
      console.error('Failed to end all Live Activities:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, refreshActivities]);

  return {
    isSupported,
    isLoading,
    activeActivities,
    startActivity,
    updateActivity,
    endActivity,
    endAllActivities,
    refreshActivities,
  };
}

// Hook to track push token for a specific activity
export function useLiveActivityPushToken(
  activityId: string | null,
  onTokenReceived: (token: string) => void
) {
  useEffect(() => {
    if (!activityId || !isLiveActivitiesSupported()) return;

    const unsubscribe = onLiveActivityPushToken((id, token) => {
      if (id === activityId) {
        onTokenReceived(token);
      }
    });

    return unsubscribe;
  }, [activityId, onTokenReceived]);
}

// Hook to auto-update Live Activity based on journey progress
export function useLiveActivityUpdater(
  activityId: string | null,
  journeyData: {
    status: string;
    progress: number;
    delayMinutes?: number;
    currentStation?: string;
  }
) {
  const previousStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activityId || !isLiveActivitiesSupported()) return;

    // Only update if status changed
    if (previousStatusRef.current !== journeyData.status) {
      previousStatusRef.current = journeyData.status;

      updateLiveActivity(activityId, {
        status: journeyData.status,
        progress: journeyData.progress,
        delayMinutes: journeyData.delayMinutes,
        currentStation: journeyData.currentStation,
      });
    }
  }, [activityId, journeyData]);
}
