# Railmate API Adapters

This directory contains adapters for integrating with various train data APIs across Europe.

## Adapters

### 1. DeutscheBahnAdapter (`deutschebahn.ts`)
**German Trains**

- **API**: v6.db.transport.rest (v5 is deprecated!)
- **Status**: ✅ Active and updated to v6
- **Rate Limit**: 100 requests/minute (strict - lower than v5)
- **Features**:
  - Station search
  - Real-time departures with delays
  - Journey planning
  - Journey details with stopovers

**Migration Notes (v5 → v6)**:
- Uses db-vendo-client backend instead of HAFAS
- Lower rate limits - implement caching aggressively
- Some endpoints removed: `/stops/reachable-from`, `/radar`
- Profile parameter available: `dbnav` (default), `db`, `dbweb`

**Caching**:
- Stations: 24 hours
- Departures: 30 seconds
- Journeys: 5 minutes
- Journey Details: 10 seconds

---

### 2. SNCFAdapter (`sncf.ts`)
**French Trains**

- **API**: api.sncf.com (Navitia format)
- **Status**: ✅ Active
- **Rate Limit**: Depends on API tier (default: 100/min)
- **Features**:
  - Station search via `/coverage/sncf/places`
  - Real-time departures
  - Journey planning
  - Disruption information

**Authentication**:
```typescript
const adapter = new SNCFAdapter('your-api-token');
```

**API Documentation**: https://doc.navitia.io/

**Caching**:
- Stations: 24 hours
- Departures: 30 seconds
- Journeys: 5 minutes
- Journey Details: 10 seconds

---

### 3. NationalRailAdapter (`nationalrail.ts`)
**UK Trains**

- **API**: Darwin SOAP API via OpenLDBWS
- **Status**: ✅ Active
- **Rate Limit**: 100 requests/minute
- **Features**:
  - Station search (static CRS code mapping)
  - Real-time departures
  - Service details

**Authentication**:
```typescript
const adapter = new NationalRailAdapter('your-soap-token');
```

**Note**: Uses CRS (Computer Reservation System) codes for stations, not searchable names.

**New**: Rail Data Marketplace (RDM) at https://raildata.org.uk/ offers modern REST APIs.

**SOAP Endpoints**:
- `GetDepartureBoard` - Get departures for a station
- `GetServiceDetails` - Get detailed service information

**Caching**:
- Stations: 24 hours (static)
- Departures: 30 seconds
- Journey Details: 10 seconds

---

### 4. RailtimeAdapter (`railtime.ts`)
**Multi-Source Real-Time Data**

- **API**: railtime.io
- **Status**: ✅ Active (last update: March 2025)
- **Rate Limit**: Depends on subscription tier
- **Features**:
  - Station search by name or UIC code
  - Station details with nearby POIs
  - **Webhook subscriptions** for automatic updates
  - Multi-source data (NS, DB, SNCB, etc.)

**Authentication**:
```typescript
const adapter = new RailtimeAdapter('your-api-secret');
```

**Unique Feature - Webhook Subscriptions**:
Subscribe to train updates and receive automatic notifications when changes occur:

```typescript
const subscriptionKey = await adapter.subscribeToUpdates({
  CodeQualifier: 'UICCode',
  DepartureCode: '8400530', // Rotterdam
  ScheduledDepartureDateTime: '2024-02-09T15:35:00+01:00',
  ArrivalCode: '8400058', // Amsterdam
  ScheduledArrivalDateTime: '2024-02-09T16:15:00+01:00',
  ReplyAddress: 'https://your-api.com/webhooks/railtime',
  ExternalIdentifier: 'My Trip Reference',
});
```

**Webhook Payload**:
Your endpoint will receive POST requests with change information:
- Status changes
- Departure/arrival time changes
- Platform changes
- Train number changes

**Caching**:
- Stations: 24 hours
- Station Details: 1 hour

---

## Base Adapter Features

All adapters extend `BaseTrainAdapter` which provides:

### Rate Limiting
- Automatic request throttling
- Configurable requests per minute (default: 100)
- Queue-based waiting when limit reached

### Caching
- Redis-based caching
- Configurable TTL per endpoint
- Automatic cache key generation

### Error Handling
Standardized error types:
- `STATION_NOT_FOUND` - Station doesn't exist
- `RATE_LIMITED` - API rate limit exceeded
- `AUTHENTICATION_ERROR` - Invalid API credentials
- `SERVICE_UNAVAILABLE` - API server error
- `TIMEOUT` - Request timeout
- `NETWORK_ERROR` - Connection issues

### Health Checks
All adapters implement `healthCheck()`:
```typescript
const isHealthy = await adapter.healthCheck();
```

---

## Usage Example

```typescript
import { 
  DeutscheBahnAdapter, 
  SNCFAdapter, 
  createAdapters,
  healthCheckAll 
} from './adapters';

// Create individual adapters
const dbAdapter = new DeutscheBahnAdapter();
const sncfAdapter = new SNCFAdapter('your-sncf-token');

// Or create all at once
const adapters = createAdapters({
  deutscheBahn: { enabled: true },
  sncf: { enabled: true, apiToken: 'your-token' },
  nationalRail: { enabled: false },
  railtime: { enabled: false },
});

// Health check all adapters
const health = await healthCheckAll(adapters);
console.log(health); // { DeutscheBahn: true, SNCF: true, ... }

// Search stations
const stations = await dbAdapter.searchStations('Berlin', 5);

// Get departures
const departures = await dbAdapter.getDepartures('8011160', 60);

// Search journeys
const journeys = await dbAdapter.searchJourneys(
  '8011160', // Berlin Hbf
  '8000261', // München Hbf
  '2024-12-25T10:00:00'
);
```

---

## Rate Limits Summary

| Adapter | Rate Limit | Notes |
|---------|-----------|-------|
| Deutsche Bahn | 100/min | Strict - use caching aggressively |
| SNCF | 100/min | Depends on API tier |
| National Rail | 100/min | Configurable |
| Railtime | Varies | Depends on subscription tier |

---

## API Status Summary

| API | Status | Last Verified |
|-----|--------|---------------|
| v6.db.transport.rest | ✅ Active | March 2025 |
| api.sncf.com | ✅ Active | March 2025 |
| Darwin SOAP API | ✅ Active | March 2025 |
| railtime.io | ✅ Active | March 2025 |

---

## Migration Notes

### Deutsche Bahn v5 → v6
1. Updated base URL from `v5.db.transport.rest` to `v6.db.transport.rest`
2. Reduced rate limit handling (100/min)
3. Added profile parameter support
4. Updated response parsing for new data structure
5. Added health check endpoint

### General Improvements
1. Added comprehensive error handling
2. Implemented Redis caching for all endpoints
3. Added rate limiting with automatic throttling
4. Added health check methods
5. Added detailed logging
6. Added TypeScript interfaces for all API responses
