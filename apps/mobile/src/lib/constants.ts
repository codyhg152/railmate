/**
 * App constants
 */

// Colors - Dark theme
export const COLORS = {
  background: '#000000',
  card: '#1C1C1E',
  cardSecondary: '#2C2C2E',
  border: '#3A3A3C',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
};

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  ON_TIME: COLORS.success,
  DELAYED: COLORS.warning,
  CANCELLED: COLORS.danger,
  BOARDING: COLORS.primary,
  DEPARTED: COLORS.info,
  ARRIVED: COLORS.success,
  UNKNOWN: COLORS.textSecondary,
};

// API
export const API_CONFIG = {
  BASE_URL: 'https://bahn.expert/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// App
export const APP_CONFIG = {
  NAME: 'Railmate',
  VERSION: '1.0.0',
  DEFAULT_LOCALE: 'de-DE',
  REFRESH_INTERVAL: 30000, // 30 seconds
};

// Storage keys
export const STORAGE_KEYS = {
  SAVED_JOURNEYS: '@railmate:saved_journeys',
  RECENT_STATIONS: '@railmate:recent_stations',
  USER_STATS: '@railmate:user_stats',
  SETTINGS: '@railmate:settings',
};
