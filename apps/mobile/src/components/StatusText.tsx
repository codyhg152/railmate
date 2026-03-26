/**
 * StatusText - Flighty-style status display
 * Simple colored text, no badges or backgrounds
 */
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { JourneyStatus } from '../lib/types';
import { COLORS } from '../lib/constants';

interface StatusTextProps {
  status: JourneyStatus;
  delayMinutes?: number;
  style?: TextStyle;
}

export function StatusText({ status, delayMinutes, style }: StatusTextProps) {
  // Get status text and color (Flighty style - text only)
  const getStatusInfo = () => {
    switch (status) {
      case 'ON_TIME':
        return { text: 'On Time', color: COLORS.success };
      case 'DELAYED':
        return { 
          text: delayMinutes ? `+${delayMinutes} min late` : 'Delayed', 
          color: COLORS.warning 
        };
      case 'CANCELLED':
        return { text: 'Cancelled', color: COLORS.danger };
      case 'BOARDING':
        return { text: 'Boarding', color: COLORS.primary };
      case 'DEPARTED':
        return { text: 'Departed', color: COLORS.info };
      case 'ARRIVED':
        return { text: 'Arrived', color: COLORS.success };
      default:
        return { text: 'Scheduled', color: COLORS.textSecondary };
    }
  };

  const { text, color } = getStatusInfo();

  return (
    <Text style={[styles.status, { color }, style]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  status: {
    fontSize: 15,
    fontWeight: '500',
  },
});
