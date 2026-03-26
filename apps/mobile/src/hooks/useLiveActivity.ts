/**
 * Hook for iOS Live Activities
 */
import { useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

interface JourneyData {
  trainNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  platform: string;
}

interface ActivityUpdate {
  departureTime?: string;
  platform?: string;
  status?: 'onTime' | 'delayed' | 'cancelled' | 'boarding';
  progress?: number;
}

export function useLiveActivity() {
  const isSupported = Platform.OS === 'ios' && parseFloat(Platform.Version as string) >= 16.1;

  const startActivity = useCallback(
    async (data: JourneyData): Promise<string | null> => {
      if (!isSupported || !LiveActivityModule) return null;

      try {
        const result = await LiveActivityModule.startActivity(data);
        return result.activityId;
      } catch (error) {
        console.error('Failed to start Live Activity:', error);
        return null;
      }
    },
    [isSupported]
  );

  const updateActivity = useCallback(
    async (activityId: string, data: ActivityUpdate): Promise<void> => {
      if (!isSupported || !LiveActivityModule) return;

      try {
        await LiveActivityModule.updateActivity(activityId, data);
      } catch (error) {
        console.error('Failed to update Live Activity:', error);
      }
    },
    [isSupported]
  );

  const endActivity = useCallback(
    async (activityId: string): Promise<void> => {
      if (!isSupported || !LiveActivityModule) return;

      try {
        await LiveActivityModule.endActivity(activityId);
      } catch (error) {
        console.error('Failed to end Live Activity:', error);
      }
    },
    [isSupported]
  );

  return {
    isSupported,
    startActivity,
    updateActivity,
    endActivity,
  };
}
