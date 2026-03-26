/**
 * SkeletonLoader component - Loading placeholders for lists and cards
 * Shimmer effect for premium feel
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { COLORS } from '../lib/constants';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <View style={[styles.background, { borderRadius }]} />
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

// Pre-built skeleton layouts
export function TrainCardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Skeleton width={80} height={28} borderRadius={8} />
        <Skeleton width={70} height={24} borderRadius={6} />
      </View>
      <View style={styles.routeRow}>
        <Skeleton width={100} height={28} />
        <Skeleton width={40} height={20} />
        <Skeleton width={100} height={28} />
      </View>
      <View style={styles.infoRow}>
        <Skeleton width={60} height={40} />
        <Skeleton width={60} height={40} />
        <Skeleton width={60} height={40} />
      </View>
      <Skeleton width="100%" height={6} borderRadius={3} />
    </View>
  );
}

export function StationRowSkeleton() {
  return (
    <View style={styles.rowContainer}>
      <Skeleton width={50} height={20} />
      <Skeleton width={60} height={36} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="80%" height={18} />
        <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={40} height={36} borderRadius={10} />
    </View>
  );
}

export function JourneyDetailSkeleton() {
  return (
    <View style={styles.detailContainer}>
      <View style={styles.heroSection}>
        <Skeleton width={100} height={32} borderRadius={8} />
        <Skeleton width="80%" height={36} style={{ marginTop: 16 }} />
        <Skeleton width="60%" height={80} style={{ marginTop: 20 }} />
      </View>
      
      <View style={styles.timelineSection}>
        <Skeleton width={120} height={24} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.timelineItem}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Skeleton width="70%" height={18} />
              <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2C2C2E',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    transform: [{ skewX: '-20deg' }],
  },
  // Card skeleton styles
  cardContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  // Row skeleton styles
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0A0A0A',
    marginHorizontal: 16,
    marginBottom: 1,
  },
  // Detail skeleton styles
  detailContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  timelineSection: {
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
});
