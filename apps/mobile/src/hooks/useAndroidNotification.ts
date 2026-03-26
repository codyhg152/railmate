/**
 * Hook for Android persistent notifications (Live Activity alternative)
 */
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { TrainJourney } from '../lib/types';

// Mock implementation - would use expo-notifications in production
export function useAndroidNotification() {
  const isAndroid = Platform.OS === 'android';

  const showPersistentNotification = useCallback(
    async (journey: TrainJourney): Promise<string | null> => {
      if (!isAndroid) return null;

      // In production, use Notifications.scheduleNotificationAsync
      console.log('Showing Android notification for journey:', journey.id);
      return `journey-${journey.id}`;
    },
    [isAndroid]
  );

  const updateNotification = useCallback(
    async (journey: TrainJourney): Promise<void> => {
      if (!isAndroid) return;

      console.log('Updating Android notification for journey:', journey.id);
    },
    [isAndroid]
  );

  const dismissNotification = useCallback(
    async (notificationId: string): Promise<void> => {
      if (!isAndroid) return;

      console.log('Dismissing Android notification:', notificationId);
    },
    [isAndroid]
  );

  return {
    isAndroid,
    showPersistentNotification,
    updateNotification,
    dismissNotification,
  };
}
