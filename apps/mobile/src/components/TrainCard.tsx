/**
 * TrainCard - Flighty-style minimal row
 * One line per train, airport board aesthetic
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

interface TrainCardProps {
  journey: TrainJourney;
  index?: number;
}

export function TrainCard({ journey, index = 0 }: TrainCardProps) {
  const router = useRouter();
  
  const departureTime = new Date(journey.scheduledDeparture);
  
  // Format time with tabular nums (Flighty style)
  const timeStr = format(departureTime, 'HH:mm');
  
  // Date label
  let dateLabel = format(departureTime, 'EEE');
  if (isToday(departureTime)) dateLabel = 'Today';
  if (isTomorrow(departureTime)) dateLabel = 'Tomorrow';
  
  // Train number display
  const trainNumber = journey.trainNumber;
  
  // Route display - abbreviated
  const originShort = journey.origin.name.split(' ')[0];
  const destShort = journey.destination.name.split(' ')[0];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/journey/${journey.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Time - Most prominent (Flighty style) */}
      <Text style={styles.time}>{timeStr}</Text>
      
      {/* Middle section - Train info */}
      <View style={styles.middle}>
        <Text style={styles.trainNumber}>{trainNumber}</Text>
        <Text style={styles.route}>
          {originShort} → {destShort}
        </Text>
      </View>
      
      {/* Status - Color only, no badge */}
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#3A3A3C',
    backgroundColor: 'transparent',
  },
  time: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
    width: 70,
  },
  middle: {
    flex: 1,
    paddingHorizontal: 12,
  },
  trainNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  route: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 15,
    fontWeight: '500',
  },
  date: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
