/**
 * StationRow component - Airport departure board style
 * Inspired by Flighty and airport FIDS displays
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { format } from 'date-fns';
import { Departure } from '../lib/types';
import { COLORS, STATUS_COLORS } from '../lib/constants';
import { Ionicons } from '@expo/vector-icons';

interface StationRowProps {
  departure: Departure;
  onPress?: () => void;
  index?: number;
}

export function StationRow({ departure, onPress, index = 0 }: StationRowProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const scheduledTime = new Date(departure.scheduledTime);
  const actualTime = departure.actualTime
    ? new Date(departure.actualTime)
    : null;

  const getStatusConfig = () => {
    switch (departure.status) {
      case 'ON_TIME':
        return {
          icon: 'checkmark-circle',
          color: COLORS.success,
          bgColor: 'rgba(52,199,89,0.15)',
          text: 'On time',
        };
      case 'DELAYED':
        return {
          icon: 'time',
          color: COLORS.warning,
          bgColor: 'rgba(255,149,0,0.15)',
          text: `+${departure.delayMinutes} min`,
        };
      case 'CANCELLED':
        return {
          icon: 'close-circle',
          color: COLORS.danger,
          bgColor: 'rgba(255,59,48,0.15)',
          text: 'Cancelled',
        };
      case 'BOARDING':
        return {
          icon: 'walk',
          color: COLORS.primary,
          bgColor: 'rgba(0,122,255,0.15)',
          text: 'Boarding',
        };
      default:
        return {
          icon: 'time-outline',
          color: COLORS.textSecondary,
          bgColor: 'rgba(142,142,147,0.15)',
          text: 'Scheduled',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const isCancelled = departure.status === 'CANCELLED';
  const isDelayed = departure.status === 'DELAYED';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: translateXAnim }],
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.row, isCancelled && styles.cancelledRow]}>
          {/* Time Column */}
          <View style={styles.timeColumn}>
            <Text style={styles.time}>{format(scheduledTime, 'HH:mm')}</Text>
            {actualTime && isDelayed && (
              <Text style={styles.actualTime}>
                {format(actualTime, 'HH:mm')}
              </Text>
            )}
          </View>

          {/* Train Column */}
          <View style={styles.trainColumn}>
            <View style={styles.trainBadge}>
              <Text style={styles.trainType}>{departure.trainName || 'ICE'}</Text>
            </View>
            <Text style={styles.trainNumber}>{departure.trainNumber}</Text>
          </View>

          {/* Destination Column */}
          <View style={styles.destinationColumn}>
            <Text style={styles.destCity} numberOfLines={1}>
              {departure.destination.name}
            </Text>
            {departure.via && departure.via.length > 0 && (
              <Text style={styles.viaText} numberOfLines={1}>
                via {departure.via.join(', ')}
              </Text>
            )}
            
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.text}
              </Text>
            </View>
          </View>

          {/* Platform Column */}
          <View style={styles.platformColumn}>
            <View style={[
              styles.platformBadge,
              isCancelled && styles.platformBadgeCancelled,
            ]}>
              <Text style={[
                styles.platformNum,
                isCancelled && { color: COLORS.textTertiary },
              ]}>
                {departure.platform}
              </Text>
            </View>
            <Text style={styles.platformLabel}>Platform</Text>
          </View>

          {/* Arrow */}
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={COLORS.textTertiary}
            style={styles.arrow}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  cancelledRow: {
    opacity: 0.5,
  },
  timeColumn: {
    width: 55,
    alignItems: 'flex-start',
  },
  time: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  actualTime: {
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  trainColumn: {
    width: 75,
    paddingLeft: 8,
  },
  trainBadge: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  trainType: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trainNumber: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 4,
    fontWeight: '500',
  },
  destinationColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 8,
  },
  destCity: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  viaText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  platformColumn: {
    width: 55,
    alignItems: 'center',
  },
  platformBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,122,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBadgeCancelled: {
    backgroundColor: 'rgba(142,142,147,0.15)',
  },
  platformNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  platformLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  arrow: {
    marginLeft: 8,
  },
});
