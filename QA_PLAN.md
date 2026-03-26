# Railmate Testing & QA Plan

## Automated Testing Setup

### 1. Unit Tests
```bash
cd apps/mobile
npm test
```

### 2. Integration Tests
- API adapter tests
- Smart state engine tests
- Journey calculation tests

### 3. E2E Tests with Detox
```bash
# Install Detox
npm install detox --save-dev

# Build for testing
detox build

# Run tests
detox test
```

## Manual Testing Checklist

### Core Features
- [ ] Search stations (Berlin, Paris, London)
- [ ] View departures
- [ ] Plan journey
- [ ] Save journey
- [ ] View journey detail
- [ ] Pull to refresh
- [ ] Smart states update

### UI/UX
- [ ] Dark theme consistent
- [ ] Time display (tabular nums)
- [ ] Status colors correct
- [ ] No shadows on cards
- [ ] Swipeable cards work
- [ ] Map shows route
- [ ] Bottom sheet draggable

### iOS Specific
- [ ] Live Activities work
- [ ] Dynamic Island compact
- [ ] Dynamic Island expanded
- [ ] Lock screen widget
- [ ] Haptic feedback

### APIs
- [ ] Deutsche Bahn returns data
- [ ] Error handling works
- [ ] Offline mode works
- [ ] Cache works

### Performance
- [ ] App launches < 2 seconds
- [ ] Scroll is 60fps
- [ ] No memory leaks
- [ ] Battery efficient

## Web Testing (Expo Web)

```bash
cd apps/mobile
npx expo start --web
```

Test in browser:
- Chrome
- Safari
- Firefox

## Known Issues to Fix

1. **Gradle build fails on Android**
   - Solution: Use EAS Build

2. **iOS requires Mac + Xcode**
   - Solution: Use EAS Build cloud

3. **API rate limits**
   - Solution: Implement caching

## Build Commands

### Android
```bash
cd apps/mobile
eas build --platform android --profile preview
```

### iOS
```bash
eas build --platform ios --profile preview
```

### Web
```bash
npx expo start --web
```

## QA Report Template

| Feature | Status | Notes |
|---------|--------|-------|
| Search | ✅/❌ | |
| Departures | ✅/❌ | |
| Journey Plan | ✅/❌ | |
| Live Activities | ✅/❌ | |
| Smart States | ✅/❌ | |

