/**
 * TrainCard component - Beautiful animated card for displaying train journey
 * Flighty-inspired design with smooth animations
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { TrainJourney } from '../lib/types';
import { COLORS, STATUS_COLORS } from '../lib/constants';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';

interface TrainCardProps {
  journey: TrainJourney;
  showProgress?: boolean;
  index?: number;
}

export function TrainCard({ journey, showProgress = true, index = 0 }: TrainCardProps) {
  const router = useRouter();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pulse animation for active journeys
  useEffect(() => {
    if (journey.status === 'DEPARTED' || journey.status === 'BOARDING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [journey.status]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    router.push(`/journey/${journey.id}`);
  };

  const departureTime = new Date(journey.scheduledDeparture);
  const duration = journey.scheduledArrival
    ? Math.round(
        (new Date(journey.scheduledArrival).getTime() - departureTime.getTime()) /
          60000
      )
    : 0;
  const durationHours = Math.floor(duration / 60);
  const durationMinutes = duration % 60;

  const isActive = journey.status === 'DEPARTED' || journey.status === 'BOARDING';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View style={styles.card}>
          {/* Active indicator */}
          {isActive && (
            <Animated.View 
              style={[
                styles.activeIndicator,
                { transform: [{ scale: pulseAnim }] }
              ]} 
            />
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.trainBadge}>
              <Text style={styles.trainNumber}>{journey.trainNumber}</Text>
              {journey.operator && (
                <Text style={styles.operator}>{journey.operator}</Text>
              )}
            </View>
            <StatusBadge status={journey.status} delayMinutes={journey.delayMinutes} />
          </View>

          {/* Route */}
          <View style={styles.route}>
            <View style={styles.cityContainer}>
              <Text style={styles.routeCity}>{journey.origin.name.split(' ')[0]}</Text>
              <Text style={styles.routeTime}>
                {format(departureTime, 'HH:mm')}
              </Text>
            </View>
            
            <View style={styles.routeMiddle}>
              <View style={styles.routeLine} />
              <View style={styles.routeArrowContainer}>
                <Text style={styles.routeArrow}>→</Text>
              </View>
              <Text style={styles.durationText}>
                {durationHours}h {durationMinutes}m
              </Text>
            </View>
            
            <View style={styles.cityContainer}>
              <Text style={styles.routeCity}>
                {journey.destination.name.split(' ')[0]}
              </Text>
              <Text style={styles.routeTime}>
                {format(new Date(journey.scheduledArrival), 'HH:mm')}
              </Text>
            </View>
          </View>

          {/* Info Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Platform</Text>
              <Text style={[styles.infoValue, styles.platformValue]}>
                {journey.platform}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {getStatusText(journey.status)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gate</Text>
              <Text style={styles.infoValue}>--</Text>
            </View>
          </View>

          {/* Progress */}
          {showProgress && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={journey.progress || 0}
                status={journey.status}
                animated
              />
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel} numberOfLines={1}>
                  {journey.origin.name}
                </Text>
                <Text style={[styles.progressLabel, styles.progressStatus]}>
                  {getProgressText(journey.status)}
                </Text>
                <Text style={styles.progressLabel} numberOfLines={1}>
                  {journey.destination.name}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getStatusText(status: string): string {
  switch (status) {
    case 'BOARDING':
      return 'Boarding';
    case 'DEPARTED':
      return 'In Transit';
    case 'ARRIVED':
      return 'Arrived';
    case 'DELAYED':
      return 'Delayed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'ON_TIME':
      return 'On Time';
    default:
      return 'Scheduled';
  }
}

function getProgressText(status: string): string {
  switch (status) {
    case 'BOARDING':
      return 'Boarding now';
    case 'DEPARTED':
      return 'In transit';
    case 'ARRIVED':
      return 'Arrived';
    case 'DELAYED':
      return 'Delayed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'On schedule';
  }
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  pressable: {
    borderRadius: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trainNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  operator: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cityContainer: {
    alignItems: 'flex-start',
    minWidth: 80,
  },
  routeCity: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  routeTime: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  routeMiddle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  routeLine: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: COLORS.border,
  },
  routeArrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    zIndex: 1,
  },
  routeArrow: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  platformValue: {
    color: COLORS.primary,
    fontSize: 18,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  progressStatus: {
    textAlign: 'center',
    color: COLORS.primary,
    fontWeight: '600',
  },
});
