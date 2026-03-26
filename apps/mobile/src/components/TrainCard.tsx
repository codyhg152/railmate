/**
 * TrainCard - Smart state-aware Flighty-style minimal row
 * Shows contextually relevant info based on journey phase
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { format, isToday, isTomorrow } from 'date-fns';
import { TrainJourney } from '../lib/types';
import { COLORS } from '../lib/constants';
import { StatusText } from './StatusText';
import { useSmartState } from '../hooks/useSmartState';
import { JourneyState } from '../utils/smartState';

interface TrainCardProps {
  journey: TrainJourney;
  index?: number;
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

export function TrainCard({ journey, index = 0 }: TrainCardProps) {
  const router = useRouter();
  const smartState = useSmartState(journey);

  const departureTime = new Date(journey.scheduledDeparture);
  const timeStr = format(departureTime, 'HH:mm');

  let dateLabel = format(departureTime, 'EEE');
  if (isToday(departureTime)) dateLabel = 'Today';
  if (isTomorrow(departureTime)) dateLabel = 'Tomorrow';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/journey/${journey.id}`);
  };

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

  return (
    <TouchableOpacity
      style={[styles.container, isActiveState && styles.containerActive]}
      onPress={handlePress}
      activeOpacity={0.7}
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
        <Text style={styles.date}>{dateLabel}</Text>
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
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
