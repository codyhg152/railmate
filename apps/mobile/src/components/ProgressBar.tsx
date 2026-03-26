/**
 * ProgressBar component - Smooth animated progress indicator
 * Flighty-style with gradient and smooth animations
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { JourneyStatus } from '../lib/types';
import { COLORS, STATUS_COLORS } from '../lib/constants';

interface ProgressBarProps {
  progress: number; // 0-100
  status: JourneyStatus;
  height?: number;
  animated?: boolean;
  showStripes?: boolean;
}

export function ProgressBar({
  progress,
  status,
  height = 6,
  animated = true,
  showStripes = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(progressAnim, {
        toValue: clampedProgress,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  // Pulse animation for in-progress journeys
  useEffect(() => {
    if (status === 'DEPARTED' || status === 'BOARDING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [status]);

  const getBarColor = (): string => {
    switch (status) {
      case 'DELAYED':
        return COLORS.warning;
      case 'CANCELLED':
        return COLORS.danger;
      case 'BOARDING':
        return COLORS.primary;
      case 'DEPARTED':
        return COLORS.info;
      case 'ARRIVED':
        return COLORS.success;
      case 'ON_TIME':
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  };

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const isActive = status === 'DEPARTED' || status === 'BOARDING';

  return (
    <Animated.View 
      style={[
        styles.container, 
        { height },
        isActive && { transform: [{ scale: pulseAnim }] }
      ]}
    >
      {/* Background track */}
      <View style={styles.background} />
      
      {/* Progress fill */}
      <Animated.View
        style={[
          styles.fill,
          {
            width: widthInterpolated,
            backgroundColor: getBarColor(),
          },
        ]}
      >
        {/* Animated gradient overlay */}
        {isActive && (
          <View style={styles.shimmer}>
            <View style={styles.shimmerLine} />
          </View>
        )}
        
        {/* Stripes for delayed/cancelled */}
        {(status === 'DELAYED' || status === 'CANCELLED') && showStripes && (
          <View style={styles.stripes}>
            <View style={styles.stripe} />
            <View style={styles.stripe} />
            <View style={styles.stripe} />
          </View>
        )}
      </Animated.View>
      
      {/* Progress dot indicator */}
      <Animated.View
        style={[
          styles.progressDot,
          {
            left: Animated.subtract(widthInterpolated, 6),
            backgroundColor: getBarColor(),
            opacity: clampedProgress > 0 && clampedProgress < 100 ? 1 : 0,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerLine: {
    width: '30%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  stripes: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-around',
    opacity: 0.3,
  },
  stripe: {
    width: 4,
    height: '100%',
    backgroundColor: '#000',
    transform: [{ skewX: '-20deg' }],
  },
  progressDot: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
