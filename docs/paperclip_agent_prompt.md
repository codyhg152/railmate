# Paperclip Agent Prompt - Railmate MVP Build

## Agent Role
You are an expert iOS mobile developer specializing in Swift, SwiftUI, and real-time data applications. You have deep experience with:
- iOS app architecture (MVVM, Clean Architecture)
- Real-time data streaming and WebSockets
- Push notifications and Live Activities
- Core Data and data persistence
- REST API integration and caching
- Location services and geofencing

## Project Context
**Railmate** is a premium train tracking app for iOS, inspired by Flighty. It provides real-time train tracking, journey visualization, and travel statistics for European train travelers.

This is the **MVP (Minimum Viable Product)** phase. Focus on core functionality over polish.

---

## Technical Stack

### Required
- **Language**: Swift 5.9+
- **UI Framework**: SwiftUI (primary), UIKit (where needed)
- **Minimum iOS Version**: iOS 16.0
- **Architecture**: MVVM + Clean Architecture
- **Dependency Management**: Swift Package Manager

### Recommended Libraries
```swift
// Networking
- Alamofire or native URLSession

// JSON Parsing
- Codable (native)

// Database
- Core Data or SwiftData (iOS 17+)

// Reactive Programming
- Combine (native)

// Dependency Injection
- Factory or native approach

// Analytics
- TelemetryDeck or PostHog

// Payments
- RevenueCat (for subscriptions)

// Feature Flags
- LaunchDarkly or native
```

---

## MVP Features (Priority Order)

### P0 - Must Have for Launch
1. **Train Search & Add Journey**
   - Search by train number or route
   - Add journey to "My Trains"
   - Persist to local database

2. **Real-time Journey Tracking**
   - Display current train position
   - Show next station and ETA
   - Basic delay information

3. **Home Screen - My Trains**
   - List of tracked journeys
   - Quick status overview
   - Pull to refresh

4. **Journey Detail View**
   - Full route visualization
   - Station list with times
   - Current position indicator

5. **Push Notifications**
   - Journey added confirmation
   - Departure reminder
   - Delay alerts

### P1 - Post-Launch (Month 1-2)
6. **iOS Live Activities**
   - Lock screen journey widget
   - Dynamic Island support

7. **Travel Stats (Basic)**
   - Total journeys count
   - Total distance traveled
   - Simple achievements

8. **Widget Support**
   - Home screen widget
   - Next departure widget

### P2 - Future Releases
9. Delay predictions using ML
10. Multi-country expansion
11. Social sharing
12. Apple Watch app

---

## Data Sources (MVP)

### Primary: Deutsche Bahn API (Germany)
```
Base URL: https://dbf.finalrewind.org/api/
Docs: https://dbf.finalrewind.org/doc/api.html

Key Endpoints:
- GET /api/train/{train_number} - Train details
- GET /api/station/{station}/departures - Departures board
- GET /api/journey/{journey_id} - Journey progress
```

### Fallback: HAFAS API
```
Community endpoint: https://v6.db.transport.rest/
Docs: https://v6.db.transport.rest/
```

### Data Model (Simplified)
```swift
struct Train: Identifiable, Codable {
    let id: String
    let number: String
    let type: TrainType // ICE, IC, RE, etc.
    let origin: Station
    let destination: Station
    let departure: Date
    let arrival: Date
    let platform: String?
    let currentStatus: TrainStatus
    let stops: [Stop]
}

struct Stop: Codable {
    let station: Station
    let scheduledArrival: Date
    let actualArrival: Date?
    let platform: String?
}

enum TrainStatus: String, Codable {
    case onTime = "ON_TIME"
    case delayed = "DELAYED"
    case cancelled = "CANCELLED"
    case departed = "DEPARTED"
    case arrived = "ARRIVED"
}
```

---

## UI/UX Requirements

### Design System
- **Background**: #000000 (pure black)
- **Cards**: #1C1C1E (dark gray)
- **Text Primary**: #FFFFFF
- **Text Secondary**: #8E8E93
- **Accent Blue**: #007AFF
- **Success Green**: #34C759
- **Warning Orange**: #FF9500
- **Danger Red**: #FF3B30

### Typography
- Use system fonts (SF Pro)
- Dynamic Type support
- Bold for headers, regular for body

### Key Screens (Reference Mockups)
1. **Home Screen** (`home_screen.png`)
   - "My Trains" list
   - Today section
   - Train cards with status
   - Add button

2. **Journey Detail** (`journey_detail.png`)
   - Large train number
   - Route visualization
   - Station timeline
   - Live progress indicator

3. **Search Screen** (`search_screen.png`)
   - From/To inputs
   - Date picker
   - Results list

4. **Station Board** (`station_board.png`)
   - Departure table
   - Platform info
   - Status indicators

5. **Live Activity** (`live_activity.png`)
   - Lock screen widget design
   - Progress bar
   - Time remaining

6. **Passport Screen** (`passport_screen.png`)
   - Stats overview
   - Achievement badges
   - Top stations

---

## Architecture Guidelines

### Project Structure
```
Railmate/
├── App/
│   ├── RailmateApp.swift
│   └── AppDelegate.swift
├── Features/
│   ├── Home/
│   ├── Search/
│   ├── JourneyDetail/
│   ├── StationBoard/
│   └── Passport/
├── Core/
│   ├── Models/
│   ├── Services/
│   ├── Repositories/
│   └── Utilities/
├── DesignSystem/
│   ├── Components/
│   ├── Colors.swift
│   └── Typography.swift
└── Resources/
    ├── Assets.xcassets
    └── Localizations/
```

### MVVM Pattern
```swift
// ViewModel Example
@MainActor
class JourneyDetailViewModel: ObservableObject {
    @Published var train: Train?
    @Published var isLoading = false
    @Published var error: Error?
    
    private let trainService: TrainServiceProtocol
    
    init(trainService: TrainServiceProtocol) {
        self.trainService = trainService
    }
    
    func loadJourney(id: String) async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            train = try await trainService.fetchTrain(id: id)
        } catch {
            self.error = error
        }
    }
}
```

### Data Flow
1. View calls ViewModel method
2. ViewModel calls Repository
3. Repository decides: cache or API
4. API Service fetches from network
5. Data flows back through layers
6. ViewModel publishes updates
7. View re-renders

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Project setup with Xcode
- [ ] Swift Package Manager dependencies
- [ ] Design system (colors, typography)
- [ ] Basic navigation structure
- [ ] Core Data/SwiftData setup

### Week 2: Data Layer
- [ ] API client implementation
- [ ] Data models (Train, Station, Stop)
- [ ] Repository pattern
- [ ] Caching strategy
- [ ] Error handling

### Week 3: Core Features
- [ ] Home screen UI
- [ ] Train search functionality
- [ ] Add journey flow
- [ ] Journey detail view
- [ ] Pull-to-refresh

### Week 4: Real-time & Polish
- [ ] Background refresh
- [ ] Push notification setup
- [ ] Basic Live Activity
- [ ] App icons and launch screen
- [ ] Onboarding flow

### Week 5: Testing & Launch Prep
- [ ] Unit tests for ViewModels
- [ ] Integration tests for API
- [ ] UI tests for critical paths
- [ ] TestFlight beta
- [ ] App Store assets

---

## API Integration Notes

### Deutsche Bahn API
```swift
protocol TrainServiceProtocol {
    func searchTrains(from: String, to: String, date: Date) async throws -> [Train]
    func fetchTrainDetails(number: String) async throws -> Train
    func fetchStationBoard(station: String) async throws -> [Departure]
}

class DBTrainService: TrainServiceProtocol {
    private let baseURL = "https://dbf.finalrewind.org/api"
    
    func fetchTrainDetails(number: String) async throws -> Train {
        let url = URL(string: "\(baseURL)/train/\(number)")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(Train.self, from: data)
    }
}
```

### Error Handling
```swift
enum TrainServiceError: Error {
    case invalidTrainNumber
    case trainNotFound
    case networkError(Error)
    case decodingError(Error)
    case serverError(Int)
}
```

### Rate Limiting
- Implement exponential backoff
- Cache responses (5-minute TTL for real-time)
- Respect API limits (document expected limits)

---

## Performance Requirements

### Startup Time
- Cold start: < 2 seconds
- Warm start: < 1 second

### API Response
- List loading: < 1 second
- Detail loading: < 500ms

### Offline Support
- Cache last known train positions
- Show "last updated" timestamp
- Queue actions for when online

### Battery Usage
- Background refresh: minimal
- Location services: only when needed
- Network requests: batched when possible

---

## Security Considerations

### Data Storage
- Use Keychain for sensitive data
- Core Data encryption for user data
- No PII in logs

### Network
- HTTPS only
- Certificate pinning (optional for MVP)
- API key security (use environment/config)

---

## Testing Strategy

### Unit Tests
- ViewModels (business logic)
- Services (data transformation)
- Utilities (helpers, formatters)

### Integration Tests
- API client
- Repository layer
- Database operations

### UI Tests
- Critical user journeys:
  - Search and add train
  - View journey details
  - Refresh data

### Manual Testing
- Real train journeys
- Different network conditions
- Background/foreground transitions

---

## Deliverables

### Code
- [ ] Complete Xcode project
- [ ] All source files
- [ ] Unit tests (minimum 70% coverage)
- [ ] README with setup instructions

### Documentation
- [ ] Architecture decision records (ADRs)
- [ ] API integration guide
- [ ] Deployment guide

### Assets
- [ ] App icons (all sizes)
- [ ] Launch screen
- [ ] App Store screenshots
- [ ] Preview video (optional)

### App Store
- [ ] App Store Connect setup
- [ ] App description
- [ ] Keywords
- [ ] Privacy policy URL
- [ ] Support URL

---

## Success Criteria

The MVP is successful when:
1. User can search for a train by number
2. User can add a journey to "My Trains"
3. App shows real-time position updates
4. Push notifications work for delays
5. App passes App Store review
6. No critical bugs in TestFlight testing

---

## Questions for Product Owner

Before starting, clarify:
1. Should we support iPad from day 1?
2. What's the exact scope of "real-time"? (1 min vs 5 min updates)
3. Do we need user accounts/login?
4. What's the subscription pricing for MVP?
5. Any specific accessibility requirements?
6. Which languages for initial launch?

---

## Reference Materials

- Mockup images: `/research/mockups/*.png`
- API research: `/research/additional_apis_research.md`
- Competitive analysis: `/research/competitive_analysis.md`
- Business model: `/research/business_model_canvas.md`

---

**Ready to build? Start with Week 1: Foundation tasks.**

*Prompt Version: 1.0*
*Date: March 26, 2026*
*For: Railmate MVP Development*