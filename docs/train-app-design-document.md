# Train Tracking App - Research & Design Document

## Executive Summary

Based on thorough research, there is a **significant opportunity** to create a "Flighty for Trains" app for Europe. While existing apps like Trainline, DB Navigator, and Rail Europe provide booking and basic tracking, **none offer the premium, pilot-grade experience** that Flighty delivers for air travel.

---

## 1. Reference App Analysis: Flighty

### What Makes Flighty Exceptional

**Core Philosophy:** "Don't Fly Without This App" - The flight tracker your pilot uses.

**Key Differentiators:**

| Feature | Description | Competitive Advantage |
|---------|-------------|----------------------|
| **World's Fastest Delay Alerts** | 2-90 min faster than airline apps | First-mover information |
| **Delay Predictions** | ML-powered predictions with reasons | Proactive vs reactive |
| **Pilot-Grade Data** | FAA/Eurocontrol data, actual flight plans | Professional-grade accuracy |
| **25-Hour Where's My Plane** | Track inbound aircraft | Early delay detection |
| **Airport Intelligence** | AI-processed airport status | Contextual awareness |
| **Live Activities/Dynamic Island** | Always-visible flight progress | iOS ecosystem integration |
| **Flighty Passport** | Personal travel stats & maps | Engagement & retention |
| **Flighty Friends** | Private flight sharing | Social feature |

**UI/UX Design Principles (from Apple Design Award):**
- **Airport signage conventions** - One line per flight, decades-tested clarity
- **Information always visible** - No need to constantly check
- **Boringly obvious** - Works so well it feels effortless
- **Shines when things go wrong** - Critical during disruptions
- **Offline-first** - Assumes loss of connectivity

---

## 2. European Train App Landscape

### Existing Players

| App | Strengths | Weaknesses | Coverage |
|-----|-----------|------------|----------|
| **Trainline** | Booking, 270 operators, 45 countries | Basic tracking, no delay predictions | Europe-wide |
| **DB Navigator** | Most accurate timetables, real-time delays | Germany-focused UI | Germany + some Europe |
| **SNCF Connect** | French network, good UI | France-only | France |
| **Trenitalia** | Italian network | Italy-only | Italy |
| **Rail Europe** | International booking | No real-time tracking | Europe-wide |
| **Zugfinder** | Live positions, statistics | Basic UI, limited features | Germany, Austria, BeNeLux, Italy |
| **geOps Live Train Tracker** | Live positions worldwide | No journey planning | Global |

### Market Gap Analysis

**What's Missing:**
1. ❌ **Unified European experience** - No single app covers all major networks with consistent UX
2. ❌ **Delay predictions** - No app predicts delays before they happen
3. ❌ **Why delays happen** - Limited context on delay reasons
4. ❌ **Premium design** - Most apps are functional but not delightful
5. ❌ **Live Activities/Dynamic Island** - Poor iOS ecosystem integration
6. ❌ **Personal travel passport** - No comprehensive travel history/stats
7. ❌ **Social sharing** - Limited friend/family sharing features
8. ❌ **Proactive alerts** - Reactive notifications only

---

## 3. API & Data Sources

### Primary Data Sources

#### 3.1 Deutsche Bahn (Germany + International)
- **API:** `v5.db.transport.rest` / `v5.db.api.bahn.guru`
- **Coverage:** Germany, most long-distance/regional traffic, some international trains
- **Features:** Real-time delays, disruptions, platform info
- **Auth:** No API key required (100 req/min limit)
- **CORS:** Enabled
- **Data Quality:** ⭐⭐⭐⭐⭐ Excellent

#### 3.2 Railtime.io
- **Coverage:** Multi-operator (NS, DB, SNCF, etc.)
- **Features:** Real-time updates, subscription webhooks
- **Auth:** API key required
- **Special:** Webhook-based change notifications
- **Data Quality:** ⭐⭐⭐⭐ Very Good

#### 3.3 SNCF (France)
- **API:** `numerique.sncf.com/startup/api/`
- **Coverage:** TGV, TER, Transilien, Intercités
- **Features:** Real-time + theoretical data, journey planning
- **Data Quality:** ⭐⭐⭐⭐ Very Good

#### 3.4 Trenitalia (Italy)
- **API:** Unofficial Viaggiatreno API + NeTEx database
- **Coverage:** All Trenitalia services
- **Features:** Live updates, schedules
- **Note:** Limited official API access

#### 3.5 GTFS Realtime Feeds
- **Source:** MobilityDatabase.org (6000+ feeds, 99 countries)
- **Transitland:** Aggregated GTFS/GTFS-RT feeds
- **Coverage:** Europe-wide
- **Features:** Standardized real-time data

#### 3.6 geOps
- **API:** `mobility.portal.geops.io`
- **Coverage:** Worldwide live positions
- **Features:** Live train tracking on map
- **Use Case:** Visual train position display

### Secondary/Regional Sources

| Country | Operator | API Availability |
|---------|----------|------------------|
| Switzerland | SBB/CFF/FFS | Limited open data |
| UK | National Rail Enquiries | Darwin API (requires registration) |
| Netherlands | NS | Open data available |
| Belgium | SNCB/NMBS | Limited |
| Austria | ÖBB | Limited |
| Spain | Renfe | Limited |
| Scandinavia | SJ, DSB, VR | Varies by country |

---

## 4. Proposed App: "Railmate" (Working Title)

### Core Value Proposition

> **"The train tracker that knows before your train company does"**

### Feature Parity with Flighty

| Flighty Feature | Train Equivalent | Implementation |
|-----------------|------------------|----------------|
| Fast Delay Alerts | Early Delay Warnings | ML predictions + inbound train tracking |
| Delay Predictions | Delay Forecasting | Historical data + weather + events |
| Why Delayed | Delay Reasons | API data + AI classification |
| 25h Where's My Plane | Where's My Train | Track inbound rolling stock |
| Airport Intelligence | Station Intelligence | Crowd levels + disruption monitoring |
| Pilot-Grade Data | Dispatcher-Grade Data | Direct from rail control systems |
| Live Activities | Live Activities | iOS 16+ Lock Screen/Dynamic Island |
| Flighty Passport | Railmate Passport | Personal travel map + stats |
| Flighty Friends | Railmate Friends | Private journey sharing |

### Unique Train-Specific Features

1. **Platform Change Alerts** - Instant notification when platform changes
2. **Connection Assistant** - Tight connection guidance with live walking times
3. **Seat Finder** - Crowd level indicators by carriage
4. **Alternative Route Suggestions** - Real-time rebooking options during delays
5. **Station Amenities** - Live info on shops, restaurants, facilities
6. **Delay Compensation** - Auto-calculate refund eligibility (EU 261 equivalent)
7. **Carbon Footprint** - Compare train vs flight emissions

---

## 5. Technical Architecture

### Data Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Data Sources   │────▶│  Data Fusion    │────▶│  ML Predictions │
│  (DB, SNCF, etc)│     │  Engine         │     │  (Delay Models) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GTFS-RT Feeds  │     │  Unified API    │     │  Alert System   │
│  (MobilityDB)   │     │  (GraphQL)      │     │  (Push/Webhook) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Tech Stack Recommendation

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React Native / SwiftUI | Cross-platform with native feel |
| **Backend** | Node.js / Python | API aggregation, ML |
| **Database** | PostgreSQL + PostGIS | Geospatial queries |
| **Cache** | Redis | Real-time data caching |
| **ML** | Python (scikit-learn/TensorFlow) | Delay predictions |
| **Queue** | Bull / RabbitMQ | Alert processing |
| **Hosting** | AWS/GCP | Scalable infrastructure |

---

## 6. MVP Scope (Phase 1)

### Markets
- **Primary:** Germany (best data availability)
- **Secondary:** France, Italy, Netherlands
- **Tertiary:** Expand to full Europe

### MVP Features

**Core:**
- [ ] Train search & journey planning
- [ ] Real-time departure/arrival boards
- [ ] Delay alerts (push notifications)
- [ ] Basic delay predictions
- [ ] Platform information
- [ ] Live train position on map

**UI/UX:**
- [ ] Clean, airport-board-inspired design
- [ ] Live Activities (iOS)
- [ ] Widgets (Home Screen + Lock Screen)
- [ ] Dark mode

**Data:**
- [ ] Deutsche Bahn integration
- [ ] SNCF integration
- [ ] Basic GTFS-RT aggregation

---

## 7. Business Model

### Freemium Structure

| Feature | Free | Pro |
|---------|------|-----|
| Basic tracking | ✅ | ✅ |
| Real-time data | ✅ | ✅ |
| Delay alerts | ✅ (delayed) | ✅ (instant) |
| Delay predictions | ❌ | ✅ |
| Why delayed | ❌ | ✅ |
| Live Activities | ✅ | ✅ |
| Unlimited history | ❌ | ✅ |
| Station intelligence | ❌ | ✅ |
| Connection assistant | ❌ | ✅ |
| Friends sharing | 1 friend | Unlimited |

### Pricing (Reference: Flighty)
- **Weekly:** £4.99
- **Monthly:** £9.99
- **Annual:** £59.99
- **Lifetime:** £299

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API rate limits / changes | Medium | High | Multi-source aggregation, caching |
| Data quality inconsistencies | Medium | Medium | Data fusion algorithms |
| Rail operator resistance | Low | High | Focus on consumer value, not disruption |
| Competition from incumbents | Medium | Medium | Differentiate on UX & predictions |
| ML prediction accuracy | Medium | Medium | Start simple, iterate with data |

---

## 9. Competitive Advantage

### Why This Will Win

1. **First-mover in premium train tracking** - No one has built the "Flighty of trains"
2. **Superior UX** - Airport-board design language adapted for stations
3. **Delay predictions** - ML-powered early warnings (no competitor has this)
4. **Unified Europe** - One app for cross-border travel
5. **iOS ecosystem** - Best-in-class Live Activities, widgets, Dynamic Island
6. **Proactive not reactive** - Alert users before they know there's a problem

---

## 10. Next Steps

1. **Validate APIs** - Build proof-of-concept with DB + SNCF APIs
2. **Design System** - Create Figma designs following Flighty principles
3. **ML Experiment** - Test delay prediction accuracy with historical data
4. **MVP Build** - React Native app with core features
5. **Beta Launch** - Germany-focused beta with 1000 users
6. **Iterate & Expand** - Add countries based on user demand

---

## Appendix: API Details

### Deutsche Bahn API (v5.db.transport.rest)

**Endpoints:**
- `GET /locations` - Search stations
- `GET /stops/{id}/departures` - Live departures
- `GET /journeys` - Journey planning
- `GET /trips/{id}` - Trip details

**Example Response:**
```json
{
  "tripId": "1|12345|1",
  "line": {
    "name": "ICE 123",
    "product": "nationalExpress"
  },
  "direction": "Berlin Hbf",
  "when": "2024-03-26T14:30:00+01:00",
  "plannedWhen": "2024-03-26T14:30:00+01:00",
  "delay": 5,
  "platform": "5",
  "remarks": [
    {"type": "hint", "text": "WiFi available"}
  ]
}
```

### Railtime.io API

**Endpoints:**
- `GET /api/v1/stations/search/{name}` - Station search
- `GET /api/v1/stations/{uicCode}` - Station details
- `POST /api/v1/subscriptions` - Subscribe to trip updates

**Webhook Payload:**
```json
{
  "ChangeTypes": ["DEPARTURETIME", "DEPARTUREPLATFORM"],
  "Scheduled": {
    "DepartureDateTime": "2024-03-26T14:30:00+01:00",
    "DeparturePlatform": null
  },
  "Actual": {
    "DepartureDateTime": "2024-03-26T14:35:00+01:00",
    "DeparturePlatform": "5"
  }
}
```

---

*Document Version: 1.0*
*Research Date: March 2026*
