# Railmate Mobile App

A beautiful train tracking app built with React Native, Expo, and TypeScript. Inspired by Flighty's premium design.

## Features

- 🗺️ **Map View** - Visualize train routes on an interactive map
- 🚄 **My Trains** - Track your saved journeys with beautiful cards
- 📍 **Station Board** - Live departure boards for any station
- 🎫 **Passport** - Travel statistics and achievements
- 🔔 **Live Activities** - iOS 16.1+ lock screen widgets
- 🌙 **Dark Theme** - Pure black (#000000) premium aesthetic

## Tech Stack

- **Framework**: React Native with Expo SDK 50
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for React Native)
- **State**: Zustand + React Query
- **Maps**: react-native-maps
- **Animations**: react-native-reanimated
- **Icons**: @expo/vector-icons

## Project Structure

```
src/
├── app/                    # Expo Router routes
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Tab navigation
│   │   ├── index.tsx       # My Trains screen
│   │   ├── map.tsx         # Map visualization
│   │   ├── stations.tsx    # Station board
│   │   └── passport.tsx    # Stats screen
│   ├── journey/
│   │   └── [id].tsx        # Journey detail
│   ├── search.tsx          # Search/add journey
│   └── _layout.tsx         # Root layout
├── components/             # Reusable components
│   ├── TrainCard.tsx
│   ├── StationRow.tsx
│   ├── StatusBadge.tsx
│   └── ProgressBar.tsx
├── hooks/                  # Custom hooks
│   ├── useJourneys.ts
│   ├── useLiveActivity.ts
│   └── useAndroidNotification.ts
├── lib/                    # Utilities
│   ├── api.ts
│   ├── constants.ts
│   └── types.ts
└── stores/                 # State management
    └── journeyStore.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Building for Production

```bash
# Configure EAS
npx eas build:configure

# Build for iOS
npx eas build --platform ios --profile production

# Build for Android
npx eas build --platform android --profile production
```

## Design System

### Colors

- **Background**: #000000 (Pure black)
- **Card**: #1C1C1E
- **Card Secondary**: #2C2C2E
- **Border**: #3A3A3C
- **Text**: #FFFFFF
- **Text Secondary**: #8E8E93
- **Primary**: #007AFF
- **Success**: #34C759
- **Warning**: #FF9500
- **Danger**: #FF3B30

### Typography

- Font: System font (SF Pro on iOS, Roboto on Android)
- Large titles: 34px, font-weight 700
- Section titles: 20px, font-weight 700
- Body: 17px, font-weight 400
- Captions: 13px, font-weight 400

## API Integration

The app uses Deutsche Bahn's API (via Bahn.expert) for train data:

- Station search
- Departure boards
- Journey planning
- Real-time updates

## iOS Live Activities

For iOS 16.1+, the app supports Live Activities on the lock screen:

- Real-time journey progress
- Platform updates
- Delay notifications

Android uses persistent notifications as an alternative.

## License

MIT
