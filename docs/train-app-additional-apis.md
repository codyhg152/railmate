# Railmate - Additional API Research

## Extended European Coverage

This document supplements the primary API specification with additional European rail operators.

---

## 1. Switzerland (SBB/CFF/FFS)

### Overview
Switzerland has excellent open data through the **Open Data Platform Mobility Switzerland**.

### GTFS Realtime Feed
```
Base URL: https://api.opentransportdata.swiss/la/gtfs-rt
Documentation: https://opentransportdata.swiss/
```

**Authentication:**
- API Key required (free registration)
- Header: `Authorization: Bearer {token}`
- Rate limit: 2 requests/minute

**Data Types:**
- Trip updates (delays, cancellations)
- Service alerts (station closures, disruptions)
- Vehicle positions (NOT available for open data)

**Update Frequency:**
- Data cached for 30 seconds
- New data twice per minute
- GTFS Static updated Mondays & Thursdays at 9-10am
- GTFS-RT switches to new static at 3pm

**Key Features:**
- 3-hour preview window
- All Swiss transport undertakings included
- Delays accurate to 0.1 minutes (6 seconds)
- Protocol Buffers format (JSON available for testing)

**Special Considerations:**
- API returns redirects for caching optimization
- Must handle HTTP redirects (follow Location header)
- Compression recommended (90% size reduction with gzip)
- No updates on public holidays

### geOps Swiss Feed
```
URL: https://gtfs.geops.ch/
```
- Daily updated GTFS feed
- Based on official Swiss HAFAS schedule
- Converted to GTFS format

---

## 2. Austria (ÖBB)

### Overview
Austria has a public REST API similar to Deutsche Bahn.

### ÖBB Transport REST API
```
Base URL: https://v6.oebb.transport.rest
Documentation: https://v6.oebb.transport.rest/
```

**Features:**
- Real-time train schedules
- Journey planning
- Station search
- No authentication required

**Endpoints (similar to DB API):**
- `GET /locations` - Station search
- `GET /stops/{id}/departures` - Live departures
- `GET /journeys` - Journey planning

**Data Quality:** ⭐⭐⭐⭐ Very Good

### ÖBB Developer Portal
```
URL: https://apiportal.oebb.at/
```

**Available APIs:**
- Points of sale information
- Station information
- Requires registration for API keys

---

## 3. Spain (Renfe)

### Overview
Renfe has limited official API access but some open data available.

### Renfe Open Data Portal
```
URL: https://data.renfe.com/
```

**Available Data:**
- Static schedules (limited)
- Station information
- Historical data

**Limitations:**
- No official real-time API for third parties
- Limited GTFS coverage
- Most real-time data is proprietary

### Transport for Spain API
```
URL: https://www.facts.dev/api/renfe-open-data/
```

**Note:** Third-party aggregator with limited real-time capabilities.

**Data Quality:** ⭐⭐ Limited

**Recommendation:** 
- Spain is a lower priority for MVP
- Consider partnering with Renfe for API access
- Use GTFS static as fallback

---

## 4. Sweden (SJ + Trafiklab)

### Overview
Sweden has good open data through Trafiklab.

### Trafiklab APIs
```
URL: https://www.trafiklab.se/api
```

**Available APIs:**
- **ResRobot** - Journey planning and departures
- **GTFS Sweden** - Static and real-time data
- **SL (Stockholm)** - Local transport

**Authentication:**
- API Key required (free tier available)
- Rate limits vary by API

### SJ (Swedish Railways)
```
Unofficial API: https://gist.github.com/derhuerst/283636962d9e14ce44b1146fb7a64347
```

**Note:** SJ uses an internal API that can be reverse-engineered but is not officially documented.

**Data Quality:** ⭐⭐⭐⭐ Good (via Trafiklab)

---

## 5. Denmark (DSB + Rejseplanen)

### Overview
Denmark uses Rejseplanen for journey planning with GTFS feeds.

### Rejseplanen GTFS
```
Feed: rejseplanen-dk
Routes: 1,499
Stops: 35,842
Agencies: 21
```

**Availability:**
- GTFS Static available
- Real-time data limited

### DSB API
```
GitHub: https://github.com/briandemant/node-dsb-api
```

**Note:** Unofficial Node.js wrapper for DSB API.

**Data Quality:** ⭐⭐⭐ Moderate

---

## 6. Norway (Vy/Entur)

### Entur
```
URL: https://developer.entur.org/
```

**Features:**
- National journey planner
- GTFS feeds
- Real-time data for many operators

**Data Quality:** ⭐⭐⭐⭐ Good

---

## 7. Finland (VR)

### VR (Finnish Railways)
```
URL: https://www.vr.fi/en
```

**Limitations:**
- Limited open data
- No official real-time API
- GTFS static available

**Data Quality:** ⭐⭐ Limited

---

## 8. Belgium (SNCB/NMBS)

### SNCB/NMBS
```
GTFS: Available via Transitland/MobilityDatabase
```

**Limitations:**
- Limited real-time open data
- GTFS static available
- Some data via iRail API (community)

### iRail API
```
URL: https://api.irail.be/
```

**Features:**
- Community-maintained
- Live departures
- Station information

**Data Quality:** ⭐⭐⭐ Moderate

---

## 9. Netherlands (NS) - Extended

### NS API (Previously mentioned, expanded)
```
Base URL: https://gateway.apiportal.ns.nl
Documentation: https://apiportal.ns.nl/
```

**Available APIs:**
- **Reisinformatie API** - Departures, disruptions, engineering work
- **Planner API** - Journey planning
- **Price API** - Ticket prices

**Authentication:**
- API Key required (free for basic tier)
- Header: `Ocp-Apim-Subscription-Key`

**Rate Limits:**
- Free tier: 50 requests/day
- Paid tiers available

**Data Quality:** ⭐⭐⭐⭐ Very Good

---

## 10. Poland (PKP)

### PKP (Polish State Railways)
```
URL: https://rozklad-pkp.pl/
```

**Limitations:**
- No official API
- Website scraping required
- Limited real-time data

**Data Quality:** ⭐⭐ Limited

---

## 11. Czech Republic (ČD)

### České dráhy
```
URL: https://www.cd.cz/en/
```

**Limitations:**
- No official open API
- Limited real-time data available

**Data Quality:** ⭐⭐ Limited

---

## Updated API Coverage Matrix

| Country | Operator | API | Real-time | Quality | Priority |
|---------|----------|-----|-----------|---------|----------|
| 🇩🇪 Germany | DB | `db.transport.rest` | ✅ | ⭐⭐⭐⭐⭐ | P0 |
| 🇫🇷 France | SNCF | `api.sncf.com` | ✅ | ⭐⭐⭐⭐ | P0 |
| 🇬🇧 UK | National Rail | Darwin | ✅ | ⭐⭐⭐⭐⭐ | P0 |
| 🇮🇹 Italy | Trenitalia | Viaggiatreno | ✅ | ⭐⭐⭐ | P1 |
| 🇳🇱 Netherlands | NS | `ns-api.nl` | ✅ | ⭐⭐⭐⭐ | P1 |
| 🇨🇭 Switzerland | SBB | GTFS-RT | ✅ | ⭐⭐⭐⭐ | P1 |
| 🇦🇹 Austria | ÖBB | `oebb.transport.rest` | ✅ | ⭐⭐⭐⭐ | P1 |
| 🇪🇸 Spain | Renfe | Limited | ⚠️ | ⭐⭐ | P2 |
| 🇸🇪 Sweden | Trafiklab | GTFS + API | ✅ | ⭐⭐⭐⭐ | P2 |
| 🇩🇰 Denmark | Rejseplanen | GTFS | ⚠️ | ⭐⭐⭐ | P2 |
| 🇳🇴 Norway | Entur | GTFS + API | ✅ | ⭐⭐⭐⭐ | P2 |
| 🇫🇮 Finland | VR | Limited | ❌ | ⭐⭐ | P3 |
| 🇧🇪 Belgium | SNCB | iRail | ⚠️ | ⭐⭐⭐ | P2 |
| 🇵🇱 Poland | PKP | None | ❌ | ⭐⭐ | P3 |
| 🇨🇿 Czech | ČD | None | ❌ | ⭐⭐ | P3 |

**Legend:**
- P0 = MVP must-have
- P1 = Phase 2 expansion
- P2 = Phase 3 expansion
- P3 = Future consideration

---

## Implementation Recommendations

### Phase 1 (MVP): Core Europe
Focus on countries with best APIs:
1. **Germany** (DB) - Primary market
2. **France** (SNCF) - Secondary market
3. **UK** (National Rail) - English-speaking market

### Phase 2: Western Europe Expansion
Add high-quality APIs:
4. **Netherlands** (NS)
5. **Switzerland** (SBB GTFS-RT)
6. **Austria** (ÖBB)
7. **Italy** (Trenitalia)

### Phase 3: Nordic + Benelux
8. **Sweden** (Trafiklab)
9. **Norway** (Entur)
10. **Denmark** (Rejseplanen)
11. **Belgium** (iRail)

### Phase 4: Southern/Eastern Europe
12. **Spain** (if API improves)
13. **Poland, Czech** (if APIs become available)

---

## Unified API Strategy

### Recommended Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    Railmate API Gateway                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   DB     │  │  SNCF    │  │  Darwin  │  │  NS      │    │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │  │ Adapter  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
│                         │                                   │
│                         ▼                                   │
│              ┌─────────────────────┐                        │
│              │   Data Normalizer   │                        │
│              │   (Unified Model)   │                        │
│              └─────────────────────┘                        │
│                         │                                   │
│                         ▼                                   │
│              ┌─────────────────────┐                        │
│              │   GraphQL API       │                        │
│              │   (Client-facing)   │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Adapter Pattern
Each country adapter handles:
1. **Authentication** - API keys, tokens
2. **Rate limiting** - Respect limits, implement backoff
3. **Data mapping** - Convert to unified model
4. **Error handling** - Normalize errors
5. **Caching** - Reduce API calls

### Fallback Strategy
```
1. Primary API (e.g., DB)
2. GTFS-RT feed
3. Secondary aggregator (Railtime.io)
4. Cached data (stale-while-revalidate)
5. User notification ("Live data unavailable")
```

---

*Document Version: 1.0*
*Supplement to: train-app-api-specification.md*
