# Railmate - Expo Go Build Specification

## Overview
This is the updated build specification for Railmate using **Expo Go** for rapid development and easy deployment.

---

## Why Expo Go?

### Benefits
- **No Xcode/Android Studio required** - Develop on any machine
- **Instant deployment** - Share via QR code or link
- **Over-the-air updates** - Push updates without app store review
- **Cross-platform** - iOS and Android from single codebase
- **Rich ecosystem** - Pre-built modules for common features
- **EAS Build** - Cloud builds for production releases

### Trade-offs
- **Live Activities** - Not supported (requires native iOS)
- **Widgets** - Limited support
- **App size** - Larger bundle (includes Expo SDK)
- **Native modules** - Some require ejecting (not needed for this app)

---

## Technical Architecture (Expo)

### Frontend
```
Framework: React Native + Expo SDK 50+
Language: TypeScript
Navigation: Expo Router (file-based)
Styling: NativeWind (Tailwind for RN) or StyleSheet
State: Zustand or React Query
```

### Backend
```
Runtime: Node.js
Framework: Fastify
Language: TypeScript
API: REST (simpler for Expo)
Hosting: Railway/Render/Fly.io
```

### Database & Services
```
Database: Supabase (PostgreSQL + realtime)
Auth: Supabase Auth (magic link, social)
Cache: Upstash Redis
Push: Expo Push Notifications
```

---

## Project Structure

```
railmate/
├── apps/
│   └── mobile/                    # Expo app
│       ├── app/                   # Expo Router routes
│       │   ├── (tabs)/           # Tab navigation
│       │   │   ├── index.tsx     # Home / My Trains
│       │   │   ├── stations.tsx  # Station board
│       │   │   └── passport.tsx  # Stats
│       │   ├── journey/
│       │   │   └── [id].tsx      # Journey detail
│       │   ├── search.tsx        # Search/add journey
│       │   └── _layout.tsx       # Root layout
│       ├── components/           # Reusable components
│       │   ├── TrainCard.tsx
│       │   ├── StationRow.tsx
│       │   ├── StatusBadge.tsx
│       │   └── ProgressBar.tsx
│       ├── hooks/                # Custom hooks
│       │   ├── useJourneys.ts
│       │   ├── useStation.ts
│       │   └── useRealtime.ts
│       ├── lib/                  # Utilities
│       │   ├── api.ts
│       │   ├── constants.ts
│       │   └── types.ts
│       ├── assets/               # Images, fonts
│       ├── app.json              # Expo config
│       └── package.json
├── server/                       # Backend API
│   ├── src/
│   │   ├── routes/              # API routes
│   │   ├── adapters/            # Rail API integrations
│   │   ├── services/            # Business logic
│   │   └── db/                  # Database schema
│   └── package.json
└── package.json                  # Workspace root
```

---

## Expo Configuration

### app.json
```json
{
  "expo": {
    "name": "Railmate",
    "slug": "railmate",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.railmate.app",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "remote-notification"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.railmate.app",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
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
    ],
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

---

## Key Dependencies

### Core
```json
{
  "expo": "~50.0.0",
  "expo-router": "~3.4.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "typescript": "^5.3.0"
}
```

### UI & Styling
```json
{
  "nativewind": "^2.0.0",
  "tailwindcss": "^3.4.0",
  "@expo/vector-icons": "^14.0.0",
  "expo-linear-gradient": "~12.7.0"
}
```

### Data & State
```json
{
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.5.0",
  "@supabase/supabase-js": "^2.39.0"
}
```

### Notifications & Background
```json
{
  "expo-notifications": "~0.27.0",
  "expo-background-fetch": "~11.8.0",
  "expo-task-manager": "~11.7.0"
}
```

### Utilities
```json
{
  "date-fns": "^3.0.0",
  "zod": "^3.22.0",
  "axios": "^1.6.0"
}
```

---

## Component Examples

### TrainCard.tsx
```tsx
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrainCardProps {
  trainNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  platform: string;
  status: 'on-time' | 'delayed' | 'cancelled';
  delay?: number;
}

export function TrainCard({
  trainNumber,
  origin,
  destination,
  departureTime,
  platform,
  status,
  delay
}: TrainCardProps) {
  const statusColors = {
    'on-time': 'text-green-500',
    'delayed': 'text-orange-500',
    'cancelled': 'text-gray-500'
  };

  return (
    <Pressable className="bg-[#1C1C1E] rounded-2xl p-4 mb-3 active:opacity-80">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Ionicons name="train" size={20} color="#007AFF" />
          <Text className="text-white font-semibold ml-2">{trainNumber}</Text>
        </View>
        <View className="bg-[#2C2C2E] px-3 py-1 rounded-full">
          <Text className="text-white text-sm">Plat {platform}</Text>
        </View>
      </View>
      
      <View className="flex-row items-center mb-3">
        <Text className="text-white text-lg font-medium">{departureTime}</Text>
        <Text className={`ml-3 font-medium ${statusColors[status]}`}>
          {status === 'delayed' && delay ? `+${delay} min` : status.replace('-', ' ')}
        </Text>
      </View>
      
      <Text className="text-gray-400">
        {origin} → {destination}
      </Text>
      
      {/* Progress bar for active journeys */}
      <View className="mt-3 h-1 bg-[#2C2C2E] rounded-full overflow-hidden">
        <View className="h-full bg-[#007AFF] w-[60%]" />
      </View>
    </Pressable>
  );
}
```

### StationRow.tsx
```tsx
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StationRowProps {
  time: string;
  train: string;
  destination: string;
  platform: string;
  status: 'on-time' | 'delayed' | 'cancelled' | 'boarding';
  delay?: number;
}

export function StationRow({
  time,
  train,
  destination,
  platform,
  status,
  delay
}: StationRowProps) {
  const statusConfig = {
    'on-time': { icon: 'checkmark-circle', color: '#34C759' },
    'delayed': { icon: 'alert-circle', color: '#FF9500' },
    'cancelled': { icon: 'close-circle', color: '#8E8E93' },
    'boarding': { icon: 'notifications', color: '#007AFF' }
  };

  const config = statusConfig[status];

  return (
    <View className="flex-row items-center py-3 border-b border-[#2C2C2E]">
      <View className="w-16">
        <Text className="text-white font-mono text-base">{time}</Text>
        {delay && (
          <Text className="text-orange-500 text-xs">+{delay}m</Text>
        )}
      </View>
      
      <View className="flex-1 px-2">
        <Text className="text-white font-medium">{train}</Text>
        <Text className="text-gray-400 text-sm">{destination}</Text>
      </View>
      
      <View className="flex-row items-center">
        <Text className="text-white font-mono mr-3">{platform}</Text>
        <Ionicons name={config.icon} size={20} color={config.color} />
      </View>
    </View>
  );
}
```

---

## API Integration Pattern

### React Query Hook
```tsx
// hooks/useJourneys.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useJourneys() {
  return useQuery({
    queryKey: ['journeys'],
    queryFn: async () => {
      const { data } = await api.get('/journeys');
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useStationDepartures(stationId: string) {
  return useQuery({
    queryKey: ['departures', stationId],
    queryFn: async () => {
      const { data } = await api.get(`/stations/${stationId}/departures`);
      return data;
    },
    refetchInterval: 30000,
    enabled: !!stationId,
  });
}
```

---

## Push Notifications

### Setup
```tsx
// app/_layout.tsx
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications();
  }, []);

  async function registerForPushNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      const token = await Notifications.getExpoPushTokenAsync();
      // Send token to your backend
      await api.post('/users/push-token', { token: token.data });
    }
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

---

## Development Workflow

### 1. Start Development
```bash
cd apps/mobile
npx expo start
```

### 2. Test on Device
- Scan QR code with Expo Go app
- iOS: Camera app
- Android: Expo Go app

### 3. Build for Production
```bash
# Preview build (internal testing)
eas build --profile preview

# Production build (App Store)
eas build --profile production
```

### 4. Over-the-Air Updates
```bash
# Push update without app store review
npx expo publish

# Or with EAS Update
eas update --branch production --message "Bug fixes"
```

---

## EAS Build Configuration

### eas.json
```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Backend API (Simplified)

Since we're using Expo, the backend can be simpler:

### Endpoints
```
GET    /api/stations/search?q={query}
GET    /api/stations/{id}/departures
GET    /api/journeys/search?from={id}&to={id}&date={iso}
GET    /api/journeys/{id}
POST   /api/users/push-token
POST   /api/subscriptions  (subscribe to journey updates)
```

### Real-time Updates
Use Supabase Realtime for live updates:
```typescript
// Subscribe to journey updates
const subscription = supabase
  .channel('journey-updates')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'journeys' },
    (payload) => {
      // Update local cache
      queryClient.invalidateQueries(['journeys']);
    }
  )
  .subscribe();
```

---

## Deployment Checklist

### Pre-launch
- [ ] App icon (1024x1024)
- [ ] Splash screen
- [ ] App Store screenshots
- [ ] Privacy policy
- [ ] Terms of service
- [ ] App Store Connect setup
- [ ] Google Play Console setup

### Backend
- [ ] Deploy to Railway/Render
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up monitoring (Sentry)

### App
- [ ] Test on physical devices
- [ ] Test push notifications
- [ ] Test offline mode
- [ ] Run EAS build
- [ ] Submit to App Store
- [ ] Submit to Google Play

---

## Migration Path (Future)

If you need native features later (Live Activities, Widgets):

1. **Eject from Expo** - `npx expo prebuild`
2. **Add native modules** - Swift/Kotlin for iOS widgets
3. **Keep most code** - React Native still works
4. **Gradual migration** - Add native features incrementally

---

## Summary

**Expo Go Benefits:**
- ✅ Faster development
- ✅ Easy sharing/testing
- ✅ OTA updates
- ✅ Cross-platform
- ✅ No native build tools needed

**Limitations:**
- ❌ No Live Activities
- ❌ No iOS widgets
- ❌ Larger app size

**Recommendation:** Start with Expo for rapid MVP development. Eject later if native features become critical.

---

*Updated for Expo Go - March 2026*
