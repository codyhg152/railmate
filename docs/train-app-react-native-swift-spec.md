# Railmate - React Native + Swift Build Specification

## Overview
Cross-platform train tracking app with **React Native** for shared code and **native Swift modules** for iOS Live Activities. Supports both iOS and Android from a single codebase.

---

## Architecture

```
Railmate/
├── apps/
│   └── mobile/                    # React Native app
│       ├── src/
│       │   ├── app/              # Expo Router routes
│       │   ├── components/       # Shared UI components
│       │   ├── hooks/            # React Query hooks
│       │   ├── lib/              # API clients, utilities
│       │   └── stores/           # Zustand state management
│       ├── modules/              # Native modules
│       │   └── live-activity/    # iOS Live Activity bridge
│       ├── ios/                  # iOS native code
│       │   ├── LiveActivity/
│       │   │   ├── LiveActivityModule.swift
│       │   │   ├── LiveActivityModuleBridge.m
│       │   │   └── TrainWidget/
│       │   │       ├── TrainWidgetAttributes.swift
│       │   │       ├── TrainWidgetLiveActivity.swift
│       │   │       └── TrainWidgetView.swift
│       │   └── Railmate/
│       │       └── AppDelegate.mm
│       ├── android/              # Android native code
│       │   └── app/
│       │       └── src/
│       │           └── main/
│       │               └── java/
│       │                   └── com/railmate/
│       │                       └── MainActivity.kt
│       ├── app.json              # Expo config
│       └── package.json
├── server/                       # Backend API
│   └── src/
├── shared/
│   └── types/                    # Shared TypeScript types
└── package.json
```

---

## Tech Stack

### Frontend (React Native)
```
Framework: React Native 0.73+ with Expo SDK 50
Navigation: Expo Router (file-based)
Language: TypeScript
Styling: NativeWind (Tailwind for RN)
State: Zustand + React Query
Build: EAS Build (not Expo Go)
```

### iOS Native (Swift)
```
Live Activities: ActivityKit (iOS 16.1+)
Widgets: WidgetKit (optional)
Bridge: RCTBridgeModule (Objective-C++ bridge)
Minimum iOS: 16.1 (for Live Activities)
```

### Android Native (Kotlin)
```
Notifications: Firebase Cloud Messaging
Widgets: AppWidgetProvider (optional)
Minimum Android: API 26 (Android 8.0)
```

### Backend
```
Runtime: Node.js 20+
Framework: Fastify
Database: PostgreSQL + Redis
Hosting: Railway/Render
```

---

## Native Module Structure

### iOS Live Activity Module

**File:** `apps/mobile/ios/LiveActivity/LiveActivityModule.swift`
```swift
import ActivityKit
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject, RCTBridgeModule {
  
  static func moduleName() -> String! {
    return "LiveActivityModule"
  }
  
  @objc func startActivity(_ data: NSDictionary, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      rejecter("NOT_ENABLED", "Live Activities not enabled", nil)
      return
    }
    
    let trainNumber = data["trainNumber"] as? String ?? ""
    let origin = data["origin"] as? String ?? ""
    let destination = data["destination"] as? String ?? ""
    let departureTime = data["departureTime"] as? String ?? ""
    let platform = data["platform"] as? String ?? ""
    
    let attributes = TrainWidgetAttributes(
      trainNumber: trainNumber,
      origin: origin,
      destination: destination
    )
    
    let contentState = TrainWidgetAttributes.ContentState(
      departureTime: departureTime,
      platform: platform,
      status: .onTime,
      progress: 0.0
    )
    
    do {
      let activity = try Activity.request(
        attributes: attributes,
        contentState: contentState,
        pushType: .token
      )
      resolver(["activityId": activity.id])
    } catch {
      rejecter("START_FAILED", error.localizedDescription, error)
    }
  }
  
  @objc func updateActivity(_ activityId: String, data: NSDictionary, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    
    Task {
      for activity in Activity<TrainWidgetAttributes>.activities {
        if activity.id == activityId {
          let contentState = TrainWidgetAttributes.ContentState(
            departureTime: data["departureTime"] as? String ?? "",
            platform: data["platform"] as? String ?? "",
            status: ActivityStatus(rawValue: data["status"] as? String ?? "onTime") ?? .onTime,
            progress: data["progress"] as? Double ?? 0.0
          )
          
          await activity.update(using: contentState)
          resolver(["success": true])
          return
        }
      }
      rejecter("NOT_FOUND", "Activity not found", nil)
    }
  }
  
  @objc func endActivity(_ activityId: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    
    Task {
      for activity in Activity<TrainWidgetAttributes>.activities {
        if activity.id == activityId {
          await activity.end(nil, dismissalPolicy: .default)
          resolver(["success": true])
          return
        }
      }
      rejecter("NOT_FOUND", "Activity not found", nil)
    }
  }
}

enum ActivityStatus: String {
  case onTime = "onTime"
  case delayed = "delayed"
  case cancelled = "cancelled"
  case boarding = "boarding"
}
```

**File:** `apps/mobile/ios/LiveActivity/LiveActivityModuleBridge.m`
```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityModule, NSObject)

RCT_EXTERN_METHOD(startActivity:(NSDictionary *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateActivity:(NSString *)activityId
                  data:(NSDictionary *)data
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endActivity:(NSString *)activityId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

### Widget Extension

**File:** `apps/mobile/ios/TrainWidget/TrainWidgetLiveActivity.swift`
```swift
import WidgetKit
import SwiftUI
import ActivityKit

struct TrainWidgetAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var departureTime: String
    var platform: String
    var status: ActivityStatus
    var progress: Double
  }
  
  var trainNumber: String
  var origin: String
  var destination: String
}

struct TrainWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: TrainWidgetAttributes.self) { context in
      // Lock Screen / Notification Center
      TrainWidgetLockScreenView(context: context)
    } dynamicIsland: { context in
      // Dynamic Island
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text(context.attributes.trainNumber)
            .font(.headline)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(context.state.departureTime)
            .font(.headline)
        }
        DynamicIslandExpandedRegion(.bottom) {
          ProgressView(value: context.state.progress)
            .tint(statusColor(context.state.status))
        }
      } compactLeading: {
        Image(systemName: "train.side.front.car")
      } compactTrailing: {
        Text(context.state.departureTime)
          .font(.caption)
      } minimal: {
        Image(systemName: "train.side.front.car")
      }
    }
  }
  
  func statusColor(_ status: ActivityStatus) -> Color {
    switch status {
    case .onTime: return .green
    case .delayed: return .orange
    case .cancelled: return .gray
    case .boarding: return .blue
    }
  }
}

struct TrainWidgetLockScreenView: View {
  let context: ActivityViewContext<TrainWidgetAttributes>
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Image(systemName: "train.side.front.car")
        Text(context.attributes.trainNumber)
          .font(.headline)
        Spacer()
        Text(context.state.departureTime)
          .font(.headline)
      }
      
      Text("\(context.attributes.origin) → \(context.attributes.destination)")
        .font(.subheadline)
      
      HStack {
        Text("Platform \(context.state.platform)")
        Spacer()
        Text(context.state.status.rawValue)
          .foregroundColor(statusColor(context.state.status))
      }
      .font(.caption)
      
      ProgressView(value: context.state.progress)
        .tint(statusColor(context.state.status))
    }
    .padding()
    .activityBackgroundTint(Color.black)
    .activitySystemActionForegroundColor(Color.white)
  }
  
  func statusColor(_ status: ActivityStatus) -> Color {
    switch status {
    case .onTime: return .green
    case .delayed: return .orange
    case .cancelled: return .gray
    case .boarding: return .blue
    }
  }
}
```

---

## React Native Usage

### Live Activity Hook

**File:** `apps/mobile/src/hooks/useLiveActivity.ts`
```typescript
import { useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

interface JourneyData {
  trainNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  platform: string;
}

interface ActivityUpdate {
  departureTime?: string;
  platform?: string;
  status?: 'onTime' | 'delayed' | 'cancelled' | 'boarding';
  progress?: number;
}

export function useLiveActivity() {
  const isSupported = Platform.OS === 'ios' && parseFloat(Platform.Version) >= 16.1;

  const startActivity = useCallback(async (data: JourneyData): Promise<string | null> => {
    if (!isSupported) return null;
    
    try {
      const result = await LiveActivityModule.startActivity(data);
      return result.activityId;
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
      return null;
    }
  }, [isSupported]);

  const updateActivity = useCallback(async (activityId: string, data: ActivityUpdate): Promise<void> => {
    if (!isSupported) return;
    
    try {
      await LiveActivityModule.updateActivity(activityId, data);
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
    }
  }, [isSupported]);

  const endActivity = useCallback(async (activityId: string): Promise<void> => {
    if (!isSupported) return;
    
    try {
      await LiveActivityModule.endActivity(activityId);
    } catch (error) {
      console.error('Failed to end Live Activity:', error);
    }
  }, [isSupported]);

  return {
    isSupported,
    startActivity,
    updateActivity,
    endActivity,
  };
}
```

### Using in Components

**File:** `apps/mobile/src/components/TrainCard.tsx`
```tsx
import { useLiveActivity } from '../hooks/useLiveActivity';

export function TrainCard({ journey }: { journey: Journey }) {
  const { isSupported, startActivity, updateActivity } = useLiveActivity();
  const [activityId, setActivityId] = useState<string | null>(null);

  const handleTrack = async () => {
    const id = await startActivity({
      trainNumber: journey.trainNumber,
      origin: journey.origin.name,
      destination: journey.destination.name,
      departureTime: journey.scheduledDeparture,
      platform: journey.platform,
    });
    
    if (id) {
      setActivityId(id);
    }
  };

  // Update Live Activity when journey updates
  useEffect(() => {
    if (activityId && journey.status === 'DELAYED') {
      updateActivity(activityId, {
        status: 'delayed',
        progress: calculateProgress(journey),
      });
    }
  }, [journey, activityId]);

  return (
    <View className="bg-[#1C1C1E] rounded-2xl p-4">
      {/* Card content */}
      {isSupported && (
        <Button onPress={handleTrack} title="Track on Lock Screen" />
      )}
    </View>
  );
}
```

---

## Android Alternative

Since Live Activities are iOS-only, use **rich notifications** on Android:

**File:** `apps/mobile/src/hooks/useAndroidNotification.ts`
```typescript
import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export function useAndroidNotification() {
  const isAndroid = Platform.OS === 'android';

  const showPersistentNotification = useCallback(async (journey: Journey) => {
    if (!isAndroid) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `journey-${journey.id}`,
      content: {
        title: `${journey.trainNumber} ${journey.origin} → ${journey.destination}`,
        body: `Platform ${journey.platform} • ${journey.status}`,
        data: { journeyId: journey.id },
        sticky: true, // Persistent notification
      },
      trigger: null,
    });
  }, [isAndroid]);

  const updateNotification = useCallback(async (journey: Journey) => {
    if (!isAndroid) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `journey-${journey.id}`,
      content: {
        title: `${journey.trainNumber} ${journey.origin} → ${journey.destination}`,
        body: `Platform ${journey.platform} • ${journey.status}`,
        data: { journeyId: journey.id },
        sticky: true,
      },
      trigger: null,
    });
  }, [isAndroid]);

  return {
    isAndroid,
    showPersistentNotification,
    updateNotification,
  };
}
```

---

## Cross-Platform Hook

**File:** `apps/mobile/src/hooks/useJourneyTracking.ts`
```typescript
import { useLiveActivity } from './useLiveActivity';
import { useAndroidNotification } from './useAndroidNotification';
import { Platform } from 'react-native';

export function useJourneyTracking() {
  const liveActivity = useLiveActivity();
  const androidNotification = useAndroidNotification();

  const startTracking = async (journey: Journey) => {
    if (Platform.OS === 'ios' && liveActivity.isSupported) {
      return await liveActivity.startActivity({
        trainNumber: journey.trainNumber,
        origin: journey.origin.name,
        destination: journey.destination.name,
        departureTime: journey.scheduledDeparture,
        platform: journey.platform,
      });
    } else if (Platform.OS === 'android') {
      await androidNotification.showPersistentNotification(journey);
      return `journey-${journey.id}`;
    }
    return null;
  };

  const updateTracking = async (trackingId: string, journey: Journey) => {
    if (Platform.OS === 'ios') {
      await liveActivity.updateActivity(trackingId, {
        status: journey.status.toLowerCase(),
        platform: journey.platform,
        progress: calculateProgress(journey),
      });
    } else if (Platform.OS === 'android') {
      await androidNotification.updateNotification(journey);
    }
  };

  return { startTracking, updateTracking };
}
```

---

## EAS Build Configuration

**File:** `apps/mobile/app.json`
```json
{
  "expo": {
    "name": "Railmate",
    "slug": "railmate",
    "ios": {
      "bundleIdentifier": "com.railmate.app",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSSupportsLiveActivities": true,
        "NSSupportsLiveActivitiesFrequentUpdates": true
      }
    },
    "android": {
      "package": "com.railmate.app",
      "versionCode": 1
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#007AFF"
        }
      ]
    ]
  }
}
```

**File:** `apps/mobile/eas.json`
```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  }
}
```

---

## Development Workflow

### 1. Setup
```bash
cd apps/mobile
npm install
npx expo prebuild  # Generate native iOS/Android projects
```

### 2. iOS Development
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

### 3. Android Development
```bash
npx expo run:android
```

### 4. Build for Production
```bash
# iOS
npx eas build --platform ios --profile production

# Android
npx eas build --platform android --profile production

# Both
npx eas build --platform all --profile production
```

---

## Summary

| Platform | Live Activities | Implementation |
|----------|----------------|----------------|
| **iOS 16.1+** | ✅ Native Live Activities | Swift Widget Extension |
| **iOS <16.1** | ❌ Not supported | Fallback to push notifications |
| **Android** | ❌ Not available | Rich persistent notifications |

**Key Benefits:**
- ✅ One React Native codebase for 90% of the app
- ✅ iOS Live Activities via native Swift module
- ✅ Android support with notification fallback
- ✅ EAS Build for easy deployment
- ✅ OTA updates for JavaScript code

---

*Updated: React Native + Swift for Live Activities - March 2026*
