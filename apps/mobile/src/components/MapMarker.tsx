/**
 * MapMarker component - Animated train position marker for map
 * Shows train location with pulsing effect
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../lib/constants';
import { Ionicons } from '@expo/vector-icons';

interface MapMarkerProps {
  type: 'train' | 'origin' | 'destination' | 'stop';
  label?: string;
  status?: 'active' | 'passed' | 'upcoming';
  trainNumber?: string;
}

export function MapMarker({ type, label, status = 'upcoming', trainNumber }: MapMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();

    // Pulse animation for active train
    if (type === 'train' && status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
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
  }, [type, status]);

  if (type === 'train') {
    return (
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        {/* Outer pulse rings */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.5],
                outputRange: [0.6, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRingInner,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.5],
                outputRange: [0.4, 0],
              }),
            },
          ]}
        />
        
        {/* Main marker */}
        <View style={styles.trainMarker}>
          <Ionicons name="train" size={18} color={COLORS.text} />
        </View>
        
        {/* Label */}
        {trainNumber && (
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>{trainNumber}</Text>
          </View>
        )}
      </Animated.View>
    );
  }

  if (type === 'origin') {
    return (
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.stationMarker, styles.originMarker]}>
          <View style={styles.stationDot} />
        </View>
        {label && (
          <View style={styles.stationLabelContainer}>
            <Text style={styles.stationLabel}>{label}</Text>
          </View>
        )}
      </Animated.View>
    );
  }

  if (type === 'destination') {
    return (
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.stationMarker, styles.destinationMarker]}>
          <View style={styles.stationDot} />
        </View>
        {label && (
          <View style={styles.stationLabelContainer}>
            <Text style={styles.stationLabel}>{label}</Text>
          </View>
        )}
      </Animated.View>
    );
  }

  // Stop marker
  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[
        styles.stopMarker,
        status === 'passed' && styles.stopMarkerPassed,
        status === 'active' && styles.stopMarkerActive,
      ]}>
        <View style={[
          styles.stopDot,
          status === 'passed' && styles.stopDotPassed,
          status === 'active' && styles.stopDotActive,
        ]} />
      </View>
      {label && (
        <View style={styles.stopLabelContainer}>
          <Text style={[
            styles.stopLabel,
            status === 'passed' && styles.stopLabelPassed,
          ]}>{label}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Train marker styles
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
  },
  pulseRingInner: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.primary,
  },
  trainMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  labelContainer: {
    position: 'absolute',
    top: -28,
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  // Station marker styles
  stationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  originMarker: {
    backgroundColor: COLORS.success,
  },
  destinationMarker: {
    backgroundColor: COLORS.primary,
  },
  stationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.text,
  },
  stationLabelContainer: {
    position: 'absolute',
    bottom: -24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  // Stop marker styles
  stopMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  stopMarkerPassed: {
    borderColor: COLORS.success,
  },
  stopMarkerActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  stopDotPassed: {
    backgroundColor: COLORS.success,
  },
  stopDotActive: {
    backgroundColor: COLORS.text,
  },
  stopLabelContainer: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  stopLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  stopLabelPassed: {
    color: COLORS.success,
  },
});
