/**
 * Journey Detail Screen
 * Shows detailed journey information with live progress
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useJourneyDetails } from '../../hooks/useJourneys';
import { useLiveActivity } from '../../hooks/useLiveActivity';
import { useJourneyStore } from '../../stores/journeyStore';
import { StatusBadge } from '../../components/StatusBadge';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function JourneyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: journey, isLoading } = useJourneyDetails(id);
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

  if (isLoading || !journey) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading journey...</Text>
      </View>
    );
  }

  const departureTime = new Date(journey.scheduledDeparture);
  const arrivalTime = new Date(journey.scheduledArrival);
  const duration = Math.round(
    (arrivalTime.getTime() - departureTime.getTime()) / 60000
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.trainBadge}>
          <Text style={styles.trainNumber}>{journey.trainNumber}</Text>
        </View>

        <Text style={styles.routeLarge}>
          {journey.origin.name.split(' ')[0]}{' '}
          <Text style={styles.routeArrow}>→</Text>{' '}
          {journey.destination.name.split(' ')[0]}
        </Text>

        {/* Timeline */}
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
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {journey.status === 'ON_TIME'
              ? 'On time'
              : journey.status === 'DELAYED'
              ? `Delayed +${journey.delayMinutes} min`
              : journey.status}{' '}
            • Platform {journey.platform}
          </Text>
        </View>
      </View>

      {/* Live Progress Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Progress</Text>
          <Text style={styles.liveBadge}>● LIVE</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.stationList}>
            {journey.stops?.map((stop, index) => {
              const isCurrent = stop.status === 'BOARDING';
              const isPassed = stop.status === 'DEPARTED' || stop.status === 'ARRIVED';

              return (
                <View
                  key={stop.station.id}
                  style={[styles.stationItem, isCurrent && styles.stationItemCurrent]}
                >
                  <Text style={styles.stationTime}>
                    {format(new Date(stop.scheduledArrival), 'HH:mm')}
                  </Text>

                  <View style={styles.stationTrack}>
                    <View
                      style={[
                        styles.trackDot,
                        isCurrent && styles.trackDotCurrent,
                        isPassed && styles.trackDotPassed,
                      ]}
                    />
                    {index < (journey.stops?.length || 0) - 1 && (
                      <View style={styles.trackLine} />
                    )}
                  </View>

                  <Text style={styles.stationName}>{stop.station.name}</Text>

                  <Text
                    style={[
                      styles.stationStatus,
                      isCurrent && styles.stationStatusCurrent,
                      isPassed && styles.stationStatusPassed,
                    ]}
                  >
                    {stop.status === 'DEPARTED'
                      ? 'Departed'
                      : stop.status === 'BOARDING'
                      ? 'Current'
                      : stop.status === 'ARRIVED'
                      ? 'Passed'
                      : 'Scheduled'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Track Button */}
      {isSupported && (
        <TouchableOpacity
          style={styles.trackButton}
          onPress={handleTrackJourney}
          activeOpacity={0.8}
        >
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.text} />
          <Text style={styles.trackButtonText}>
            {activityId ? 'Tracking Active' : 'Track on Lock Screen'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 17,
    textAlign: 'center',
    marginTop: 100,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  trainBadge: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  trainNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  routeLarge: {
    fontSize: 28,
    fontWeight: '700',
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
    minWidth: 70,
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
  },
  durationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.success,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  liveBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
  },
  stationList: {
    flexDirection: 'column',
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  stationItemCurrent: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  stationTime: {
    width: 50,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  stationTrack: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    width: 2,
    height: 40,
    backgroundColor: '#3A3A3C',
    top: 14,
  },
  trackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3A3A3C',
    zIndex: 1,
  },
  trackDotCurrent: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  trackDotPassed: {
    backgroundColor: COLORS.success,
  },
  stationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    paddingLeft: 12,
  },
  stationStatus: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  stationStatusCurrent: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  stationStatusPassed: {
    color: COLORS.success,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  trackButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
});
