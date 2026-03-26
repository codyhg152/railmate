/**
 * Live Activity Module - TypeScript bridge to native iOS Live Activities
 */
import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

const { LiveActivityModule } = NativeModules;

// Check if module exists
const isModuleAvailable = !!LiveActivityModule;

// Event emitter for Live Activity events
let eventEmitter: NativeEventEmitter | null = null;
if (isModuleAvailable) {
  eventEmitter = new NativeEventEmitter(LiveActivityModule);
}

// Types
export interface JourneyData {
  trainNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  platform: string;
  status?: string;
  progress?: number;
  delayMinutes?: number;
  currentStation?: string;
  arrivalTime?: string;
  timeRemaining?: string;
}

export interface ActivityUpdate {
  status?: string;
  progress?: number;
  delayMinutes?: number;
  currentStation?: string;
  arrivalTime?: string;
  timeRemaining?: string;
}

export interface ActivityInfo {
  id: string;
  trainNumber: string;
  origin: string;
  destination: string;
  status: string;
  progress: number;
}

export interface StartActivityResult {
  activityId: string;
  pushToken?: string;
}

// Module interface
interface LiveActivityModuleInterface {
  startActivity(data: JourneyData): Promise<StartActivityResult>;
  updateActivity(activityId: string, data: ActivityUpdate): Promise<{ success: boolean }>;
  endActivity(activityId: string): Promise<{ success: boolean }>;
  getActivities(): Promise<{ activities: ActivityInfo[] }>;
  endAllActivities(): Promise<{ success: boolean }>;
}

// Check if Live Activities are supported
export function isLiveActivitiesSupported(): boolean {
  return (
    Platform.OS === 'ios' &&
    parseFloat(Platform.Version as string) >= 16.1 &&
    isModuleAvailable
  );
}

// Start a new Live Activity
export async function startLiveActivity(data: JourneyData): Promise<string | null> {
  if (!isLiveActivitiesSupported()) {
    console.warn('Live Activities are not supported on this device');
    return null;
  }

  try {
    const result = await LiveActivityModule.startActivity(data);
    return result.activityId;
  } catch (error) {
    console.error('Failed to start Live Activity:', error);
    return null;
  }
}

// Update an existing Live Activity
export async function updateLiveActivity(
  activityId: string,
  data: ActivityUpdate
): Promise<boolean> {
  if (!isLiveActivitiesSupported()) {
    return false;
  }

  try {
    const result = await LiveActivityModule.updateActivity(activityId, data);
    return result.success;
  } catch (error) {
    console.error('Failed to update Live Activity:', error);
    return false;
  }
}

// End a Live Activity
export async function endLiveActivity(activityId: string): Promise<boolean> {
  if (!isLiveActivitiesSupported()) {
    return false;
  }

  try {
    const result = await LiveActivityModule.endActivity(activityId);
    return result.success;
  } catch (error) {
    console.error('Failed to end Live Activity:', error);
    return false;
  }
}

// Get all active Live Activities
export async function getActiveLiveActivities(): Promise<ActivityInfo[]> {
  if (!isLiveActivitiesSupported()) {
    return [];
  }

  try {
    const result = await LiveActivityModule.getActivities();
    return result.activities || [];
  } catch (error) {
    console.error('Failed to get Live Activities:', error);
    return [];
  }
}

// End all Live Activities
export async function endAllLiveActivities(): Promise<boolean> {
  if (!isLiveActivitiesSupported()) {
    return false;
  }

  try {
    const result = await LiveActivityModule.endAllActivities();
    return result.success;
  } catch (error) {
    console.error('Failed to end all Live Activities:', error);
    return false;
  }
}

// Subscribe to push token updates
export function onLiveActivityPushToken(
  callback: (activityId: string, pushToken: string) => void
): (() => void) {
  if (!eventEmitter) {
    return () => {};
  }

  const subscription = eventEmitter.addListener(
    'LiveActivityPushToken',
    (event: { activityId: string; pushToken: string }) => {
      callback(event.activityId, event.pushToken);
    }
  );

  return () => subscription.remove();
}

// Export the module for direct access
export { LiveActivityModule };
