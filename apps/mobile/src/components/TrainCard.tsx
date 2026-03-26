/**
 * TrainCard - Smart state-aware Flighty-style minimal row
 * Shows contextually relevant info based on journey phase
 * Now with Live Activity support on press
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { format, isToday, isTomorrow } from 'date-fns';
import { TrainJourney } from '../lib/types';
import { COLORS } from '../lib/constants';
import { StatusText } from './StatusText';
import { useSmartState } from '../hooks/useSmartState';
import { useLiveActivity } from '../hooks/useLiveActivity';
import { JourneyState } from '../utils/smartState';
import { Ionicons } from '@expo/vector-icons';

interface TrainCardProps {
  journey: TrainJourney;
  index?: number;
  onStartLiveActivity?: (journey: TrainJourney) => void;
}

const ACCENT_COLOR: Record<string, string> = {
  danger: COLORS.danger,
  warning: COLORS.warning,
  success: COLORS.success,
  primary: COLORS.primary,
  info: COLORS.info,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
};

export function TrainCard({ journey, index = 0, onStartLiveActivity }: TrainCardProps) {
  const router = useRouter();
  const smartState = useSmartState(journey);
  const { isSupported, startActivity, isLoading } = useLiveActivity();

  const departureTime = new Date(journey.scheduledDeparture);
  const timeStr = format(departureTime, 'HH:mm');

  let dateLabel = format(departureTime, 'EEE');
  if (isToday(departureTime)) dateLabel = 'Today';
  if (isTomorrow(departureTime)) dateLabel = 'Tomorrow';

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/journey/${journey.id}`);
  }, [router, journey.id]);

  const handleLongPress = useCallback(async () => {
    if (!isSupported) {
      Alert.alert(
        'Live Activities Not Available',
        'Live Activities require iOS 16.1 or later.'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Calculate time remaining
    const now = new Date();
    const departure = new Date(journey.scheduledDeparture);
    const arrival = new Date(journey.scheduledArrival);
    const totalDuration = arrival.getTime() - departure.getTime();
    const remaining = arrival.getTime() - now.getTime();
    const progress = Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100));

    const activityId = await startActivity({
      trainNumber: journey.trainNumber,
      origin: journey.origin.name,
      destination: journey.destination.name,
      departureTime: format(departure, 'HH:mm'),
      platform: journey.platform,
      status: journey.status,
      progress: progress,
      delayMinutes: journey.delayMinutes || 0,
      arrivalTime: format(arrival, 'HH:mm'),
      timeRemaining: remaining > 0 ? `${Math.ceil(remaining / 60000)} min left` : 'Arrived',
    });

    if (activityId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onStartLiveActivity) {
        onStartLiveActivity(journey);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isSupported, journey, startActivity, onStartLiveActivity]);

  // Active states get a colored left border accent
  const isActiveState = smartState && [
    JourneyState.boarding,
    JourneyState.atPlatform,
    JourneyState.taxiing,
    JourneyState.inTransit,
    JourneyState.arriving,
    JourneyState.onBoard,
  ].includes(smartState.state);

  const accentColor = smartState?.content.accent
    ? ACCENT_COLOR[smartState.content.accent] ?? COLORS.text
    : COLORS.text;

  // Show Live Activity indicator if supported
  const showLiveActivityIndicator = isSupported && isActiveState;

  return (
    <TouchableOpacity
      style={[styles.container, isActiveState && styles.containerActive]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      delayLongPress={500}
    >
      {/* Active state indicator */}
      {isActiveState && <View style={[styles.activePill, { backgroundColor: accentColor }]} />}

      {/* Time - Most prominent (Flighty style) */}
      <Text style={styles.time}>{timeStr}</Text>

      {/* Middle section - Smart state content */}
      <View style={styles.middle}>
        {smartState ? (
          <>
            <Text style={[styles.headline, { color: accentColor }]} numberOfLines={1}>
              {smartState.content.headline}
            </Text>
            <Text style={styles.primary} numberOfLines={1}>
              {smartState.content.primary}
            </Text>
            {smartState.content.secondary && (
              <Text style={styles.secondary} numberOfLines={1}>
                {smartState.content.secondary}
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.headline}>{journey.trainNumber}</Text>
            <Text style={styles.primary}>
              {journey.origin.name.split(' ')[0]} → {journey.destination.name.split(' ')[0]}
            </Text>
          </>
        )}
      </View>

      {/* Right - Status + date */}
      <View style={styles.right}>
        <StatusText
          status={journey.status}
          delayMinutes={journey.delayMinutes}
          style={styles.status}
        />
        <View style={styles.dateRow}>
          {showLiveActivityIndicator && (
            <Ionicons
              name="lock-closed"
              size={10}
              color={COLORS.primary}
              style={styles.liveActivityIcon}
            />
          )}
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#3A3A3C',
    backgroundColor: 'transparent',
  },
  containerActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.04)',
  },
  activePill: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  time: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
    width: 64,
  },
  middle: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headline: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  primary: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 1,
  },
  secondary: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveActivityIcon: {
    marginRight: 4,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
