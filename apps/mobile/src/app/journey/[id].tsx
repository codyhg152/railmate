/**
 * Journey Detail Screen
 * Shows detailed journey information with live progress and timeline
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useJourneyDetails, usePullToRefresh } from '../../hooks/useJourneys';
import { useLiveActivity } from '../../hooks/useLiveActivity';
import { useJourneyStore } from '../../stores/journeyStore';
import { StatusBadge } from '../../components/StatusBadge';
import { ProgressBar } from '../../components/ProgressBar';
import { JourneyTimeline } from '../../components/JourneyTimeline';
import { JourneyDetailSkeleton } from '../../components/SkeletonLoader';
import { ErrorEmptyState } from '../../components/EmptyState';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function JourneyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { 
    data: journey, 
    isLoading,
    isError,
    error,
    refresh,
    isRefreshing,
  } = useJourneyDetails(id);
  const { isSupported, startActivity, updateActivity } = useLiveActivity();
  const addJourney = useJourneyStore((state) => state.addJourney);
  const [activityId, setActivityId] = React.useState<string | null>(null);

  useEffect(() => {
    if (journey) {
      addJourney(journey);
    }
  }, [journey]);

  const handleTrackJourney = async () => {
    if (!journey || !isSupported) return;

    const newActivityId = await startActivity({
      trainNumber: journey.trainNumber,
      origin: journey.origin.name,
      destination: journey.destination.name,
      departureTime: format(new Date(journey.scheduledDeparture), 'HH:mm'),
      platform: journey.platform,
    });

    if (newActivityId) {
      setActivityId(newActivityId);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <JourneyDetailSkeleton />
      </View>
    );
  }

  if (isError || !journey) {
    return (
      <View style={styles.container}>
        <View style={styles.errorHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ErrorEmptyState 
          message={error?.message || "Couldn't load journey details"}
          onRetry={refresh}
        />
      </View>
    );
  }

  const departureTime = new Date(journey.scheduledDeparture);
  const arrivalTime = new Date(journey.scheduledArrival);
  const duration = Math.round(
    (arrivalTime.getTime() - departureTime.getTime()) / 60000
  );

  const isActive = journey.status === 'DEPARTED' || journey.status === 'BOARDING';

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Back Button */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Hero Section */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.hero}>
        <View style={styles.trainBadge}>
          <Text style={styles.trainNumber}>{journey.trainNumber}</Text>
          {journey.operator && (
            <Text style={styles.operator}>{journey.operator}</Text>
          )}
        </View>

        <Text style={styles.routeLarge}>
          {journey.origin.name.split(' ')[0]}{' '}
          <Text style={styles.routeArrow}>→</Text>{' '}
          {journey.destination.name.split(' ')[0]}
        </Text>

        {/* Timeline Hero */}
        <View style={styles.timelineHero}>
          <View style={styles.timeBox}>
            <Text style={styles.timeValue}>{format(departureTime, 'HH:mm')}</Text>
            <Text style={styles.timeLabel}>{journey.origin.name}</Text>
          </View>

          <View style={styles.timelineBar}>
            <View
              style={[
                styles.timelineProgress,
                { width: `${journey.progress || 0}%` },
              ]}
            />
            <View
              style={[
                styles.timelineDot,
                { left: `${journey.progress || 0}%` },
              ]}
            />
            <View style={styles.durationPill}>
              <Text style={styles.durationText}>
                {Math.floor(duration / 60)}h {duration % 60}m
              </Text>
            </View>
          </View>

          <View style={styles.timeBox}>
            <Text style={styles.timeValue}>{format(arrivalTime, 'HH:mm')}</Text>
            <Text style={styles.timeLabel}>{journey.destination.name}</Text>
          </View>
        </View>

        {/* Status Pill */}
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(journey.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(journey.status) }]}>
            {journey.status === 'ON_TIME'
              ? 'On time'
              : journey.status === 'DELAYED'
              ? `Delayed +${journey.delayMinutes} min`
              : journey.status}{' '}
            • Platform {journey.platform}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={journey.progress || 0}
            status={journey.status}
            height={8}
            animated
          />
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Start</Text>
            <Text style={[styles.progressLabel, styles.progressPercent]}>
              {Math.round(journey.progress || 0)}%
            </Text>
            <Text style={styles.progressLabel}>Destination</Text>
          </View>
        </View>
      </Animated.View>

      {/* Journey Timeline */}
      {journey.stops && journey.stops.length > 0 && (
        <Animated.View entering={FadeInUp.delay(200)}>
          <JourneyTimeline
            stops={journey.stops}
            currentStatus={journey.status}
            progress={journey.progress || 0}
          />
        </Animated.View>
      )}

      {/* Track Button */}
      {isSupported && (
        <Animated.View entering={FadeInUp.delay(300)}>
          <TouchableOpacity
            style={[
              styles.trackButton,
              activityId && styles.trackButtonActive,
            ]}
            onPress={handleTrackJourney}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activityId ? 'lock-closed' : 'lock-closed-outline'}
              size={20}
              color={COLORS.text}
            />
            <Text style={styles.trackButtonText}>
              {activityId ? 'Tracking Active' : 'Track on Lock Screen'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Journey Info Card */}
      <Animated.View entering={FadeInUp.delay(400)} style={styles.infoCard}>
        <Text style={styles.infoTitle}>Journey Details</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Train</Text>
            <Text style={styles.infoValue}>{journey.trainNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Operator</Text>
            <Text style={styles.infoValue}>{journey.operator || 'DB'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{format(departureTime, 'MMM d, yyyy')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{Math.floor(duration / 60)}h {duration % 60}m</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ON_TIME':
    case 'ARRIVED':
      return COLORS.success;
    case 'DELAYED':
      return COLORS.warning;
    case 'CANCELLED':
      return COLORS.danger;
    case 'BOARDING':
    case 'DEPARTED':
      return COLORS.primary;
    default:
      return COLORS.textSecondary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  errorHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  trainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  trainNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  operator: {
    fontSize: 13,
    color: COLORS.textSecondary,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.2)',
    paddingLeft: 12,
  },
  routeLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  routeArrow: {
    color: COLORS.textSecondary,
    marginHorizontal: 12,
  },
  timelineHero: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  timeBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  timelineBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    marginHorizontal: 12,
    position: 'relative',
  },
  timelineProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  timelineDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    top: '50%',
    marginTop: -6,
    marginLeft: -6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  durationPill: {
    position: 'absolute',
    top: -28,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  durationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,199,89,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressPercent: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  trackButtonActive: {
    backgroundColor: COLORS.success,
  },
  trackButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
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
  bottomPadding: {
    height: 40,
  },
});
