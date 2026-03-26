# Railmate - Paperclip Agent Prompt

## Overview
This document provides the complete prompt for Paperclip agents to build the Railmate train tracking app.

---

## Project Brief

**Project Name:** Railmate
**Type:** Mobile application (iOS primary, Android secondary)
**Category:** Travel/Transportation
**Inspiration:** Flighty app (Apple Design Award winner)

**Mission:** Build the "Flighty for Trains" - a premium train tracking app that predicts delays before they happen and provides a beautiful, unified experience across European rail networks.

---

## Core Requirements

### MVP Features (Phase 1)

#### 1. Train Tracking
- [ ] Search and add train journeys
- [ ] Real-time departure/arrival information
- [ ] Platform information and changes
- [ ] Delay alerts (push notifications)
- [ ] Journey progress visualization

#### 2. Data Sources (Phase 1)
- [ ] Deutsche Bahn (Germany) - Primary
- [ ] SNCF (France) - Secondary
- [ ] National Rail UK - Secondary

#### 3. UI/UX
- [ ] Dark mode interface (pure black #000000)
- [ ] Airport departure board aesthetic
- [ ] Train cards with live status
- [ ] Journey detail view
- [ ] Station departure board
- [ ] Search/add journey flow

#### 4. iOS Ecosystem
- [ ] Live Activities (Lock Screen/Dynamic Island)
- [ ] Home Screen widgets
- [ ] Push notifications
- [ ] Siri Shortcuts support

#### 5. User Features
- [ ] User accounts (iCloud sync)
- [ ] Travel history
- [ ] Basic stats (distance, journeys)

### Phase 2 Features (Post-MVP)

#### Enhanced Tracking
- [ ] Delay predictions (ML-powered)
- [ ] "Where's my train" inbound tracking
- [ ] Connection assistant
- [ ] Alternative route suggestions

#### Expanded Coverage
- [ ] Netherlands (NS)
- [ ] Switzerland (SBB)
- [ ] Austria (ÖBB)
- [ ] Italy (Trenitalia)

#### Social Features
- [ ] Share journey status
- [ ] Friends tracking
- [ ] Travel achievements/badges

#### Premium Features (Pro Tier)
- [ ] Instant delay alerts (vs delayed)
- [ ] Unlimited journey history
- [ ] Advanced statistics
- [ ] Delay reason explanations

---

## Technical Architecture

### Frontend
```
Platform: iOS (primary)
Framework: SwiftUI
Minimum iOS: 16.0 (for Live Activities)
Language: Swift
```

### Backend
```
Runtime: Node.js
Framework: Fastify/Express
Language: TypeScript
API: GraphQL (client-facing), REST (internal)
```

### Database
```
Primary: PostgreSQL + PostGIS (geospatial)
Cache: Redis (real-time data)
Queue: Bull (notification processing)
```

### Infrastructure
```
Hosting: AWS or Google Cloud
CDN: CloudFront/CloudFlare
Monitoring: Datadog/Sentry
CI/CD: GitHub Actions
```

### ML/AI (Phase 2)
```
Framework: Python (scikit-learn/TensorFlow)
Deployment: AWS SageMaker or self-hosted
Features: Delay prediction models
```

---

## API Integrations

### Primary Data Sources

#### 1. Deutsche Bahn (Germany)
```
Base URL: https://v5.db.transport.rest
Auth: None (rate limited)
Endpoints:
  - GET /locations (station search)
  - GET /stops/{id}/departures (live departures)
  - GET /journeys (journey planning)
  - GET /trips/{id} (trip details)
```

#### 2. SNCF (France)
```
Base URL: https://api.sncf.com/v1
Auth: API Key (register at numerique.sncf.com)
Endpoints:
  - GET /coverage/sncf/journeys
  - GET /coverage/sncf/stop_points/{id}/departures
```

#### 3. National Rail UK
```
Base URL: https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb11.asmx
Auth: API Key (register at nationalrail.co.uk/developers)
Protocol: SOAP
Operations:
  - GetDepartureBoard
  - GetServiceDetails
```

### Data Normalization
All APIs should be normalized to a unified data model:
```typescript
interface TrainJourney {
  id: string;
  operator: string;
  trainNumber: string;
  trainType: string;
  origin: Station;
  destination: Station;
  scheduledDeparture: ISO8601;
  actualDeparture: ISO8601;
  departureDelay: number;
  departurePlatform: string;
  scheduledArrival: ISO8601;
  actualArrival: ISO8601;
  arrivalDelay: number;
  arrivalPlatform: string;
  status: 'SCHEDULED' | 'ON_TIME' | 'DELAYED' | 'CANCELLED';
  stops: Stopover[];
}
```

---

## Design System

### Colors
```css
/* Backgrounds */
--bg-primary: #000000;        /* Pure black */
--bg-secondary: #1C1C1E;      /* Dark gray (cards) */
--bg-tertiary: #2C2C2E;       /* Elevated */

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #8E8E93;
--text-tertiary: #48484A;

/* Status */
--status-ontime: #34C759;        /* Green */
--status-delayed: #FF9500;       /* Orange */
--status-heavily-delayed: #FF3B30; /* Red */
--status-cancelled: #8E8E93;     /* Gray */
--status-boarding: #007AFF;      /* Blue */

/* Brand */
--brand-primary: #007AFF;
--brand-secondary: #5856D6;
```

### Typography
```
Font: SF Pro Display (iOS system font)
Scale:
  - Display: 48px / 600 weight
  - Headline: 32px / 600 weight
  - Title: 24px / 600 weight
  - Body Large: 18px / 400 weight
  - Body: 16px / 400 weight
  - Caption: 14px / 500 weight
```

### Components
- **Train Card** - Journey summary with status
- **Status Badge** - On time/Delayed/Cancelled
- **Station Row** - Departure board row
- **Progress Bar** - Journey completion
- **Platform Badge** - Platform number display

### Screens
1. **Home** - My Trains list
2. **Journey Detail** - Full journey info
3. **Station Board** - Live departures
4. **Search** - Add new journey
5. **Passport** - Stats and achievements

Reference designs: See `/research/mockups/` directory

---

## File Structure

```
railmate/
├── apps/
│   ├── ios/                    # SwiftUI iOS app
│   │   ├── Railmate/
│   │   │   ├── App/
│   │   │   ├── Views/
│   │   │   ├── ViewModels/
│   │   │   ├── Models/
│   │   │   ├── Services/
│   │   │   └── Widgets/
│   │   └── Railmate.xcodeproj
│   └── android/                # Future: Android app
├── server/
│   ├── src/
│   │   ├── api/               # GraphQL resolvers
│   │   ├── services/          # Business logic
│   │   ├── adapters/          # API integrations
│   │   │   ├── db.ts          # Deutsche Bahn
│   │   │   ├── sncf.ts        # SNCF
│   │   │   └── darwin.ts      # UK National Rail
│   │   ├── models/            # Data models
│   │   ├── workers/           # Background jobs
│   │   └── utils/             # Helpers
│   ├── tests/
│   └── package.json
├── shared/
│   └── types/                 # Shared TypeScript types
├── docs/
│   ├── api/                   # API documentation
│   └── design/                # Design assets
└── README.md
```

---

## Development Phases

### Phase 1: MVP (Weeks 1-8)
**Goal:** Functional app with core tracking

**Week 1-2: Foundation**
- [ ] Set up project structure
- [ ] iOS app skeleton (SwiftUI)
- [ ] Backend API foundation
- [ ] DB schema design

**Week 3-4: Data Integration**
- [ ] Deutsche Bahn API integration
- [ ] Data normalization layer
- [ ] Caching strategy
- [ ] Basic journey search

**Week 5-6: Core UI**
- [ ] Home screen with train cards
- [ ] Journey detail view
- [ ] Station board
- [ ] Search flow

**Week 7-8: Polish & Notifications**
- [ ] Push notifications
- [ ] Live Activities
- [ ] Widgets
- [ ] Beta testing

### Phase 2: Expansion (Weeks 9-16)
**Goal:** Add countries and premium features

- [ ] SNCF integration (France)
- [ ] National Rail integration (UK)
- [ ] Delay prediction (basic ML)
- [ ] Pro subscription tier
- [ ] Travel stats/Passport

### Phase 3: Scale (Weeks 17-24)
**Goal:** Full European coverage

- [ ] Additional countries (NL, CH, AT, IT)
- [ ] Social features
- [ ] Advanced ML predictions
- [ ] Android app

---

## Key Technical Decisions

### 1. Why SwiftUI over React Native?
- **Live Activities** - Requires native iOS
- **Performance** - Smooth 60fps animations
- **Design** - Native iOS look and feel
- **Future-proof** - Apple's recommended framework

### 2. Why GraphQL for API?
- **Flexibility** - Clients request exactly what they need
- **Type safety** - Schema-driven development
- **Performance** - Single request for complex data
- **Developer experience** - Great tooling

### 3. Why PostgreSQL + PostGIS?
- **Geospatial queries** - Station proximity, route mapping
- **Reliability** - Proven for production
- **JSON support** - Flexible API responses
- **Extensions** - Rich ecosystem

### 4. Why Redis?
- **Speed** - Sub-millisecond response times
- **Pub/sub** - Real-time updates
- **Caching** - Reduce API calls
- **Rate limiting** - Track API usage

---

## Testing Strategy

### Unit Tests
- Business logic
- Data transformations
- API adapters

### Integration Tests
- API endpoints
- Database operations
- External service calls

### UI Tests
- Critical user flows
- Screen navigation
- State management

### Beta Testing
- TestFlight for iOS
- 100-1000 beta users
- Focus on Germany initially

---

## Success Criteria

### MVP Launch
- [ ] App Store approval
- [ ] 4.5+ star rating
- [ ] < 1% crash rate
- [ ] 10,000 downloads in first month

### Phase 2
- [ ] 50,000 MAU
- [ ] 3% Pro conversion
- [ ] 85% prediction accuracy
- [ ] 4.7+ star rating

### Phase 3
- [ ] 200,000 MAU
- [ ] 5% Pro conversion
- [ ] Coverage in 10+ countries
- [ ] Profitable unit economics

---

## Resources

### Documentation
- API Spec: `/research/train-app-api-specification.md`
- UI/UX Design: `/research/train-app-ui-ux-design.md`
- Additional APIs: `/research/train-app-additional-apis.md`
- Competitive Analysis: `/research/train-app-competitive-analysis.md`
- Business Model: `/research/train-app-business-model.md`

### Mockups
Location: `/research/mockups/`
- `home_screen.png`
- `journey_detail.png`
- `station_board.png`
- `search_screen.png`
- `live_activity.png`
- `passport_screen.png`

### External Resources
- Flighty App: https://www.flightyapp.com
- Apple Design Awards: https://developer.apple.com/design/awards/
- Deutsche Bahn API: https://v5.db.transport.rest
- SNCF API: https://numerique.sncf.com/startup/api/

---

## Questions for Development Team

1. **API Rate Limits:** How should we handle rate limiting across multiple APIs?
2. **Offline Support:** What data should be available offline?
3. **Push Notifications:** Should we use Firebase, OneSignal, or native APNs?
4. **Authentication:** iCloud-only or email/password option?
5. **Analytics:** Mixpanel, Amplitude, or self-hosted?

---

## Next Steps

1. **Set up development environment**
2. **Create project repositories**
3. **Implement Deutsche Bahn adapter**
4. **Build iOS app skeleton**
5. **Design database schema**
6. **Create API endpoints**
7. **Implement core UI components**
8. **Test with beta users**

---

*Document Version: 1.0*
*Prepared for: Paperclip Agents*
*Date: March 2026*
