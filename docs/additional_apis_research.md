# Railmate - Additional European Train APIs Research

## Overview
This document provides research on additional European train operator APIs to expand Railmate's coverage beyond Germany (DB).

---

## 1. Switzerland - SBB (Swiss Federal Railways)

### Official API Portal
- **Portal**: https://developer.sbb.ch/apis
- **Documentation**: https://developer.sbb.ch/

### Available APIs
1. **DDIP SKI Data Hub**
   - National exchange of real-time data and event information
   - Standards supported: SIRI-ET, SIRI-PT, SIRI-SX
   - Also supports VDV454 AUS/REFAUS and VDV736 standards

2. **Open Data API**
   - URL: https://data.sbb.ch/api/explore/v2.0/console
   - REST-based API
   - Returns JSON data
   - Hierarchical endpoint organization

### Data Coverage
- Real-time train positions
- Timetable data
- Station information
- Service disruptions

### Integration Notes
- SIRI standards compliance makes it compatible with other European systems
- Requires registration for API access
- Real-time updates available

---

## 2. Austria - ÖBB (Austrian Federal Railways)

### Official API Portal
- **Portal**: https://apiportal.oebb.at/
- **Community Forum**: Available for developer support

### Available APIs

1. **ÖBB KonzernHub API**
   - Official enterprise API
   - Requires registration and token access
   - Gallery of available APIs

2. **OEBB Transport REST API (Community/Unofficial)**
   - URL: https://v6.oebb.transport.rest/
   - Modern, reliable, easy-to-use
   - Real-time journeys, departures, arrivals
   - Radar functionality
   - No official affiliation but widely used

3. **Unofficial API Documentation**
   - GitHub: https://github.com/hoenic07/oebb-api-docs
   - Documents endpoints used by tickets.oebb.at
   - Simplified usage examples

### Data Coverage
- Real-time schedules
- Journey planning
- Station departures/arrivals
- Route data and maps

### Integration Notes
- Official API requires business relationship
- Community API is more accessible for startups
- Good documentation available

---

## 3. France - SNCF

### Official API Portal
- **Portal**: https://numerique.sncf.com/startup/api/
- **Open Data**: https://ressources.data.sncf.com/api/explore/v2.1/console

### Available APIs

1. **SNCF API (Navitia-based)**
   - Real-time train data
   - Theoretical schedules for: TGV, TER, Transilien, Intercités
   - Real-time data for: TGV, TER, Intercités
   - GitHub docs: https://github.com/SNCFdevelopers/API-trains-sncf

2. **Open Data API**
   - Opendatasoft Explore API v2
   - REST architecture
   - JSON responses
   - Hierarchical endpoints

### Data Coverage
- Real-time station information
- Route planning
- Service status
- Historical data available

### Integration Notes
- Open data approach - easier access
- Navitia platform provides standardized interface
- Good for startups and innovation projects

---

## 4. Additional APIs to Consider

### Pan-European Solutions

1. **Railway Guru / TheTrainLine API**
   - Aggregated data from multiple operators
   - Commercial API with pricing
   - Good for multi-country coverage

2. **Interrail/Eurail Pass Integration**
   - Pass validation APIs
   - Route planning for pass holders

3. **Eurostar API**
   - Channel Tunnel services
   - UK-France-Belgium-Netherlands

4. **Thalys/DB International**
   - High-speed international services
   - France-Belgium-Netherlands-Germany

### Open Data Initiatives

1. **EU Open Data Portal**
   - https://data.europa.eu/
   - Cross-border railway data
   - Standardized formats

2. **uRail.eu** (if available)
   - Community-driven API aggregation

---

## 5. Technical Standards

### Common Standards Across APIs
- **SIRI** (Service Interface for Real Time Information)
  - ET: Estimated Timetable
  - PT: Production Timetable
  - SX: Situation Exchange

- **GTFS-RT** (General Transit Feed Specification - Realtime)
  - Trip updates
  - Service alerts
  - Vehicle positions

- **VDV Standards** (German-speaking countries)
  - VDV454: Real-time data exchange
  - VDV736: Event information

---

## 6. Integration Strategy Recommendations

### Phase 1: Core Markets
1. Germany (DB) - Already planned
2. Switzerland (SBB) - High data quality, SIRI standards
3. Austria (ÖBB) - Good community API available

### Phase 2: Expansion
4. France (SNCF) - Large market, open data
5. Italy (Trenitalia) - High-speed focus
6. Benelux (NS, NMBS/SNCB, CFL)

### Phase 3: Full Coverage
7. Spain (Renfe)
8. Nordic countries (SJ, VR, DSB)
9. Eastern Europe (PKP, ČD, MAV)

### Architecture Considerations
- Implement adapter pattern for each API
- Normalize data to internal format
- Cache aggressively (train data changes slowly)
- Fallback mechanisms for API failures
- Rate limiting compliance

---

## 7. API Access Requirements Summary

| Operator | Registration | Cost | Real-time | Documentation |
|----------|-------------|------|-----------|---------------|
| DB | Required | Free tier | Yes | Good |
| SBB | Required | Free | Yes | Good |
| ÖBB Official | Business | Enterprise | Yes | Good |
| ÖBB Community | None | Free | Yes | Community |
| SNCF | Open | Free | Yes | Good |

---

## 8. Next Steps

1. **Register for SBB Developer Portal**
   - Apply for API access
   - Review SIRI implementation guides

2. **Evaluate ÖBB Options**
   - Test community API for MVP
   - Contact ÖBB for official partnership

3. **SNCF Integration**
   - Start with Open Data API
   - Explore Navitia integration

4. **Unified Data Model**
   - Design internal schema
   - Build adapter layer
   - Implement caching strategy

---

*Document Version: 1.0*
*Date: March 26, 2026*
*Research for: Railmate App Development*