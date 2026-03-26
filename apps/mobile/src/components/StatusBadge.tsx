/**
 * StatusBadge component - Premium status indicator
 * Flighty-inspired design with smooth animations
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { JourneyStatus } from '../lib/types';
import { COLORS, STATUS_COLORS } from '../lib/constants';
import { Ionicons } from '@expo/vector-icons';

interface StatusBadgeProps {
  status: JourneyStatus;
  delayMinutes?: number;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  delayMinutes,
  size = 'medium',
  showIcon = true,
}: StatusBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entry animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();

    // Pulse animation for active statuses
    if (status === 'BOARDING' || status === 'DEPARTED') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'ON_TIME':
        return {
          text: 'On Time',
          icon: 'checkmark-circle',
          color: COLORS.success,
        };
      case 'DELAYED':
        return {
          text: delayMinutes ? `+${delayMinutes} min` : 'Delayed',
          icon: 'time',
          color: COLORS.warning,
        };
      case 'CANCELLED':
        return {
          text: 'Cancelled',
          icon: 'close-circle',
          color: COLORS.danger,
        };
      case 'BOARDING':
        return {
          text: 'Boarding',
          icon: 'walk',
          color: COLORS.primary,
        };
      case 'DEPARTED':
        return {
          text: 'In Transit',
          icon: 'train',
          color: COLORS.info,
        };
      case 'ARRIVED':
        return {
          text: 'Arrived',
          icon: 'flag',
          color: COLORS.success,
        };
      default:
        return {
          text: 'Scheduled',
          icon: 'time-outline',
          color: COLORS.textSecondary,
        };
    }
  };

  const config = getStatusConfig();

  const getBackgroundColor = (color: string): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };

  const backgroundColor = getBackgroundColor(config.color);

  const sizeStyles = {
    small: { 
      paddingHorizontal: 8, 
      paddingVertical: 3, 
      fontSize: 11,
      iconSize: 12,
      borderRadius: 6,
    },
    medium: { 
      paddingHorizontal: 12, 
      paddingVertical: 5, 
      fontSize: 13,
      iconSize: 14,
      borderRadius: 8,
    },
    large: { 
      paddingHorizontal: 16, 
      paddingVertical: 8, 
      fontSize: 15,
      iconSize: 18,
      borderRadius: 10,
    },
  };

  const s = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingHorizontal: s.paddingHorizontal,
          paddingVertical: s.paddingVertical,
          borderRadius: s.borderRadius,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {showIcon && (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons 
            name={config.icon as any} 
            size={s.iconSize} 
            color={config.color}
            style={styles.icon}
          />
        </Animated.View>
      )}
      <Text style={[styles.text, { color: config.color, fontSize: s.fontSize }]}>
        {config.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
