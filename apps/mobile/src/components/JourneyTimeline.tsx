/**
 * JourneyTimeline component - Visual timeline for journey stops
 * Flighty-inspired design with animated progress
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { Stop, JourneyStatus } from '../lib/types';
import { COLORS } from '../lib/constants';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface JourneyTimelineProps {
  stops: Stop[];
  currentStatus: JourneyStatus;
  progress: number;
}

interface TimelineItemProps {
  stop: Stop;
  index: number;
  isLast: boolean;
  currentStatus: JourneyStatus;
}

function TimelineItem({ stop, index, isLast, currentStatus }: TimelineItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isCurrent = stop.status === 'BOARDING';
  const isPassed = stop.status === 'DEPARTED' || stop.status === 'ARRIVED';
  const isUpcoming = !isCurrent && !isPassed;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
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

    if (isCurrent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
  }, [index, isCurrent]);

  const getStatusIcon = () => {
    if (isPassed) return 'checkmark';
    if (isCurrent) return 'train';
    return 'time-outline';
  };

  const getStatusColor = () => {
    if (isPassed) return COLORS.success;
    if (isCurrent) return COLORS.primary;
    return COLORS.textTertiary;
  };

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {/* Timeline track */}
      <View style={styles.trackColumn}>
        {/* Top line */}
        {index > 0 && (
          <View style={[
            styles.trackLine,
            styles.trackLineTop,
            isPassed && styles.trackLinePassed,
            isCurrent && styles.trackLineActive,
          ]} />
        )}
        
        {/* Dot/Icon */}
        <Animated.View
          style={[
            styles.trackDot,
            isPassed && styles.trackDotPassed,
            isCurrent && styles.trackDotCurrent,
            { transform: [{ scale: isCurrent ? pulseAnim : 1 }] },
          ]}
        >
          <Ionicons 
            name={getStatusIcon() as any} 
            size={isCurrent ? 14 : 10} 
            color={isCurrent ? COLORS.text : isPassed ? COLORS.text : COLORS.textTertiary}
          />
        </Animated.View>
        
        {/* Bottom line */}
        {!isLast && (
          <View style={[
            styles.trackLine,
            styles.trackLineBottom,
            isPassed && styles.trackLinePassed,
          ]} />
        )}
      </View>

      {/* Content */}
      <View style={[
        styles.contentColumn,
        isCurrent && styles.contentColumnCurrent,
      ]}>
        {/* Time row */}
        <View style={styles.timeRow}>
          <Text style={[
            styles.timeText,
            isPassed && styles.timeTextPassed,
            isCurrent && styles.timeTextCurrent,
          ]}>
            {format(new Date(stop.scheduledArrival), 'HH:mm')}
          </Text>
          
          {stop.actualArrival && (
            <Text style={[
              styles.actualTimeText,
              isPassed ? styles.actualTimeOnTime : styles.actualTimeDelayed,
            ]}>
              {format(new Date(stop.actualArrival), 'HH:mm')}
            </Text>
          )}
        </View>

        {/* Station name */}
        <Text style={[
          styles.stationName,
          isUpcoming && styles.stationNameUpcoming,
        ]}>
          {stop.station.name}
        </Text>

        {/* Platform */}
        <View style={styles.platformRow}>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>Plat {stop.platform || '--'}</Text>
          </View>
          
          {/* Status indicator */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: isCurrent ? 'rgba(0,122,255,0.15)' : 'transparent' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor() }
            ]}>
              {isCurrent ? 'Current' : isPassed ? 'Passed' : 'Scheduled'}
            </Text>
          </View>
        </View>

        {/* Duration if not last */}
        {!isLast && stop.scheduledDeparture && (
          <Text style={styles.durationText}>
            Stop: {Math.round((new Date(stop.scheduledDeparture).getTime() - new Date(stop.scheduledArrival).getTime()) / 60000)} min
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export function JourneyTimeline({ stops, currentStatus, progress }: JourneyTimelineProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Journey Timeline</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.timelineContainer}>
        {stops.map((stop, index) => (
          <TimelineItem
            key={stop.station.id}
            stop={stop}
            index={index}
            isLast={index === stops.length - 1}
            currentStatus={currentStatus}
          />
        ))}
      </View>

      {/* Progress summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Progress</Text>
          <Text style={styles.summaryValue}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },
  timelineContainer: {
    marginTop: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    minHeight: 100,
  },
  trackColumn: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#2C2C2E',
  },
  trackLineTop: {
    top: 0,
    bottom: '50%',
  },
  trackLineBottom: {
    top: '50%',
    bottom: 0,
  },
  trackLinePassed: {
    backgroundColor: COLORS.success,
  },
  trackLineActive: {
    backgroundColor: COLORS.primary,
  },
  trackDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginTop: 12,
  },
  trackDotPassed: {
    backgroundColor: COLORS.success,
  },
  trackDotCurrent: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  contentColumnCurrent: {
    backgroundColor: 'rgba(0,122,255,0.05)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timeTextPassed: {
    color: COLORS.success,
  },
  timeTextCurrent: {
    color: COLORS.primary,
  },
  actualTimeText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  actualTimeOnTime: {
    color: COLORS.success,
  },
  actualTimeDelayed: {
    color: COLORS.warning,
  },
  stationName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  stationNameUpcoming: {
    color: COLORS.textSecondary,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  platformBadge: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
  summaryContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressBarContainer: {
    height: 8,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
});
