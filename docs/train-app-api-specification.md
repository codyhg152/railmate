# Railmate - Technical API Specification

## Document Purpose
Detailed technical specification for all European train data APIs to be consumed by the Railmate app.

---

## 1. API Coverage Matrix

| Country | Operator | API Name | Protocol | Auth | Real-time | Quality |
|---------|----------|----------|----------|------|-----------|---------|
| 🇩🇪 Germany | Deutsche Bahn | `db.transport.rest` | REST/JSON | None | ✅ | ⭐⭐⭐⭐⭐ |
| 🇫🇷 France | SNCF | `api.sncf.com` | REST/JSON | Token | ✅ | ⭐⭐⭐⭐ |
| 🇬🇧 UK | National Rail | Darwin | SOAP/XML | Token | ✅ | ⭐⭐⭐⭐⭐ |
| 🇮🇹 Italy | Trenitalia | `viaggiatreno` | REST/JSON | None | ✅ | ⭐⭐⭐ |
| 🇳🇱 Netherlands | NS | `ns-api.nl` | REST/JSON | Token | ✅ | ⭐⭐⭐⭐ |
| 🇨🇭 Switzerland | SBB | GTFS-RT | Protobuf | None | ✅ | ⭐⭐⭐ |
| 🇦🇹 Austria | ÖBB | HAFAS | REST/JSON | None | ✅ | ⭐⭐⭐ |
| 🇧🇪 Belgium | SNCB | GTFS-RT | Protobuf | None | ✅ | ⭐⭐⭐ |
| 🇪🇸 Spain | Renfe | Limited | - | - | ⚠️ | ⭐⭐ |
| 🇸🇪 Sweden | SJ | Limited | - | - | ⚠️ | ⭐⭐ |

---

## 2. Deutsche Bahn API (Primary)

### Base URL
```
https://v5.db.transport.rest
```

### Rate Limits
- 100 requests/minute (burst: 150)
- No authentication required
- CORS enabled

### Endpoints

#### 2.1 Search Locations
```http
GET /locations?query={search_term}&results={limit}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Station name or address |
| results | integer | No | Max results (default: 10) |
| fuzzy | boolean | No | Fuzzy matching (default: true) |

**Response:**
```json
{
  "id": "8011160",
  "name": "Berlin Hbf",
  "type": "station",
  "location": {
    "latitude": 52.525589,
    "longitude": 13.369548
  },
  "products": {
    "nationalExpress": true,
    "national": true,
    "regionalExp": true,
    "regional": true,
    "suburban": true,
    "bus": true,
    "ferry": false,
    "subway": true,
    "tram": true,
    "taxi": false
  }
}
```

#### 2.2 Departures Board
```http
GET /stops/{stopId}/departures
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| stopId | string | Yes | Station ID (e.g., 8011160) |
| when | ISO8601 | No | Query time (default: now) |
| duration | integer | No | Time window in minutes (default: 60) |
| results | integer | No | Max departures (default: 10) |

**Response:**
```json
{
  "departures": [
    {
      "tripId": "1|234567|1",
      "stop": {
        "id": "8011160",
        "name": "Berlin Hbf"
      },
      "when": "2024-03-26T14:35:00+01:00",
      "plannedWhen": "2024-03-26T14:30:00+01:00",
      "delay": 300,
      "platform": "5",
      "plannedPlatform": "5",
      "direction": "München Hbf",
      "line": {
        "id": "ice-123",
        "name": "ICE 123",
        "product": "nationalExpress",
        "productName": "ICE",
        "mode": "train",
        "public": true
      },
      "remarks": [
        {
          "type": "status",
          "code": "delay",
          "text": "Delayed by 5 minutes"
        },
        {
          "type": "hint",
          "code": "wifi",
          "text": "WiFi available"
        }
      ],
      "cancelled": false
    }
  ]
}
```

**Field Mappings:**
| API Field | App Field | Transform |
|-----------|-----------|-----------|
| when | actualDeparture | Parse ISO8601 |
| plannedWhen | scheduledDeparture | Parse ISO8601 |
| delay | delayMinutes | delay / 60 |
| platform | platform | String |
| line.name | trainNumber | String |
| line.productName | trainType | String (ICE/IC/RE/RB) |
| direction | destination | String |
| cancelled | isCancelled | Boolean |

#### 2.3 Journey Planning
```http
GET /journeys?from={fromId}&to={toId}&departure={time}&results={limit}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| from | string | Yes | Origin station ID |
| to | string | Yes | Destination station ID |
| departure | ISO8601 | No | Departure time |
| arrival | ISO8601 | No | Arrival time (alternative) |
| results | integer | No | Max journeys (default: 5) |
| transfers | integer | No | Max transfers (default: -1) |
| transferTime | integer | No | Min transfer time in minutes |

**Response:**
```json
{
  "journeys": [
    {
      "type": "journey",
      "legs": [
        {
          "origin": {
            "id": "8011160",
            "name": "Berlin Hbf",
            "departure": "2024-03-26T14:30:00+01:00",
            "departurePlatform": "5"
          },
          "destination": {
            "id": "8000261",
            "name": "München Hbf",
            "arrival": "2024-03-26T19:15:00+01:00",
            "arrivalPlatform": "12"
          },
          "line": {
            "name": "ICE 123",
            "product": "nationalExpress"
          },
          "departureDelay": 300,
          "arrivalDelay": 180,
          "distance": 623000,
          "remarks": []
        }
      ],
      "price": {
        "amount": 89.90,
        "currency": "EUR"
      }
    }
  ]
}
```

#### 2.4 Trip Details (Live Tracking)
```http
GET /trips/{tripId}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| tripId | string | Yes | Trip ID from departures |

**Response:**
```json
{
  "id": "1|234567|1",
  "line": {
    "name": "ICE 123",
    "product": "nationalExpress"
  },
  "direction": "München Hbf",
  "stopovers": [
    {
      "stop": {
        "id": "8011160",
        "name": "Berlin Hbf"
      },
      "arrival": null,
      "plannedArrival": null,
      "departure": "2024-03-26T14:35:00+01:00",
      "plannedDeparture": "2024-03-26T14:30:00+01:00",
      "departureDelay": 300,
      "platform": "5"
    },
    {
      "stop": {
        "id": "8010205",
        "name": "Leipzig Hbf"
      },
      "arrival": "2024-03-26T15:45:00+01:00",
      "plannedArrival": "2024-03-26T15:40:00+01:00",
      "arrivalDelay": 300,
      "departure": "2024-03-26T15:50:00+01:00",
      "plannedDeparture": "2024-03-26T15:45:00+01:00",
      "departureDelay": 300,
      "platform": "8"
    }
  ]
}
```

---

## 3. SNCF API (France)

### Base URL
```
https://api.sncf.com/v1
```

### Authentication
- HTTP Basic Auth
- Token required (register at numerique.sncf.com)

### Endpoints

#### 3.1 Journey Planning
```http
GET /coverage/sncf/journeys
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| from | string | Yes | Origin stop area ID |
| to | string | Yes | Destination stop area ID |
| datetime | ISO8601 | No | Departure time |
| datetime_represents | string | No | "departure" or "arrival" |
| count | integer | No | Max results |

**Response:**
```json
{
  "journeys": [
    {
      "duration": 8400,
      "nb_transfers": 0,
      "departure_date_time": "20240326T143000",
      "arrival_date_time": "20240326T163000",
      "sections": [
        {
          "type": "public_transport",
          "display_informations": {
            "commercial_mode": "TGV",
            "network": "TGV",
            "label": "1234",
            "headsign": "Paris - Lyon",
            "direction": "Lyon Part Dieu"
          },
          "departure_date_time": "20240326T143000",
          "arrival_date_time": "20240326T163000",
          "from": {
            "stop_point": {
              "name": "Paris Gare de Lyon",
              "coord": {"lat": 48.8448, "lon": 2.3735}
            }
          },
          "to": {
            "stop_point": {
              "name": "Lyon Part Dieu",
              "coord": {"lat": 45.7605, "lon": 4.8596}
            }
          }
        }
      ]
    }
  ]
}
```

#### 3.2 Real-time Departures
```http
GET /coverage/sncf/stop_points/{id}/departures
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| from_datetime | ISO8601 | No | Start time |
| duration | integer | No | Time window (seconds) |
| depth | integer | No | Data depth (0-3) |

**Response:**
```json
{
  "departures": [
    {
      "display_informations": {
        "commercial_mode": "TGV",
        "label": "1234",
        "direction": "Lyon Part Dieu",
        "physical_mode": "High speed train"
      },
      "stop_date_time": {
        "departure_date_time": "20240326T143000",
        "base_departure_date_time": "20240326T143000"
      },
      "stop_point": {
        "name": "Paris Gare de Lyon"
      }
    }
  ]
}
```

---

## 4. UK National Rail Darwin API

### Base URL
```
https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb11.asmx
```

### Authentication
- SOAP API
- Access token required (register at nationalrail.co.uk/developers)

### SOAP Operations

#### 4.1 Get Departure Board
```xml
<soap:Envelope>
  <soap:Body>
    <GetDepartureBoardRequest>
      <numRows>10</numRows>
      <crs>WAT</crs>
      <timeWindow>120</timeWindow>
    </GetDepartureBoardRequest>
  </soap:Body>
</soap:Envelope>
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| numRows | integer | Yes | Number of services |
| crs | string | Yes | Station code (e.g., WAT = Waterloo) |
| timeWindow | integer | No | Time window in minutes |
| filterCrs | string | No | Filter by destination |
| filterType | string | No | "to" or "from" |

**Response:**
```xml
<GetDepartureBoardResponse>
  <GetStationBoardResult>
    <generatedAt>2024-03-26T14:30:00.000Z</generatedAt>
    <locationName>London Waterloo</locationName>
    <crs>WAT</crs>
    <platformAvailable>true</platformAvailable>
    <trainServices>
      <service>
        <std>14:30</std>
        <etd>14:35</etd>
        <platform>4</platform>
        <operator>South Western Railway</operator>
        <destination>
          <location>
            <locationName>Weymouth</locationName>
            <crs>WEY</crs>
          </location>
        </destination>
      </service>
    </trainServices>
  </GetStationBoardResult>
</GetDepartureBoardResponse>
```

**Field Mappings:**
| XML Field | App Field | Notes |
|-----------|-----------|-------|
| std | scheduledDeparture | HH:MM format |
| etd | estimatedDeparture | "On time", "Delayed", "Cancelled", or HH:MM |
| platform | platform | May be empty |
| operator | operatorName | Train operating company |
| destination/location/locationName | destination | Final destination |

#### 4.2 Get Service Details
```xml
<soap:Envelope>
  <soap:Body>
    <GetServiceDetailsRequest>
      <serviceID>{serviceID}</serviceID>
    </GetServiceDetailsRequest>
  </soap:Body>
</soap:Envelope>
```

---

## 5. Trenitalia API (Italy)

### Base URL
```
http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno
```

### Authentication
- No authentication required
- Unofficial API (use with caution)

### Endpoints

#### 5.1 Station Search
```http
GET /autocompletaStazione/{stationName}
```

**Response:**
```
S02430-7|ROMA TERMINI
S02587-1|MILANO CENTRALE
```

#### 5.2 Departures
```http
GET /partenze/{stationCode}/{dateTime}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| stationCode | string | Yes | Station code (e.g., S02430) |
| dateTime | string | Yes | Format: yyyy-MM-ddTHH:mm:ss |

**Response:**
```json
{
  "partenze": [
    {
      "numeroTreno": 1234,
      "categoria": "Frecciarossa",
      "origine": "Roma Termini",
      "destinazione": "Milano Centrale",
      "orarioPartenza": 1711465800000,
      "orarioPartenzaEffettivo": 1711466100000,
      "binarioProgrammato": "1",
      "binarioEffettivo": "1",
      "ritardo": 5
    }
  ]
}
```

#### 5.3 Train Status
```http
GET /andamentoTreno/{originCode}/{trainNumber}/{dateTime}
```

---

## 6. NS API (Netherlands)

### Base URL
```
https://gateway.apiportal.ns.nl
```

### Authentication
- API Key in header: `Ocp-Apim-Subscription-Key`

### Endpoints

#### 6.1 Departures
```http
GET /reisinformatie-api/api/v2/departures?station={stationCode}
```

**Response:**
```json
{
  "payload": {
    "departures": [
      {
        "direction": "Amsterdam Centraal",
        "name": "IC 1234",
        "plannedDateTime": "2024-03-26T14:30:00+01:00",
        "actualDateTime": "2024-03-26T14:35:00+01:00",
        "plannedTrack": "5",
        "actualTrack": "5",
        "cancelled": false,
        "delay": 300
      }
    ]
  }
}
```

---

## 7. Unified Data Model

### Train Journey
```typescript
interface TrainJourney {
  id: string;                          // Unique journey ID
  operator: string;                    // DB, SNCF, Trenitalia, etc.
  trainNumber: string;                 // e.g., "ICE 123"
  trainType: TrainType;                // ICE, TGV, Frecciarossa, etc.
  
  origin: Station;
  destination: Station;
  
  scheduledDeparture: ISO8601;
  actualDeparture: ISO8601;
  departureDelay: number;              // Seconds
  departurePlatform: string;
  
  scheduledArrival: ISO8601;
  actualArrival: ISO8601;
  arrivalDelay: number;                // Seconds
  arrivalPlatform: string;
  
  status: JourneyStatus;               // ON_TIME, DELAYED, CANCELLED
  delayReason?: string;                // e.g., "Signal failure"
  
  stops: Stopover[];
  amenities: Amenity[];
  
  // Predictions
  predictedDelay?: number;             // ML prediction
  predictionConfidence?: number;       // 0-1
  
  // Crowd level (if available)
  crowdLevel?: CrowdLevel;             // LOW, MEDIUM, HIGH
}

interface Station {
  id: string;
  name: string;
  country: string;                     // ISO 3166-1 alpha-2
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;                    // e.g., "Europe/Berlin"
}

interface Stopover {
  station: Station;
  scheduledArrival: ISO8601;
  actualArrival: ISO8601;
  arrivalDelay: number;
  arrivalPlatform: string;
  
  scheduledDeparture: ISO8601;
  actualDeparture: ISO8601;
  departureDelay: number;
  departurePlatform: string;
  
  status: StopoverStatus;
}

enum TrainType {
  // Germany
  ICE = 'ICE',          // Intercity-Express
  IC = 'IC',            // Intercity
  RE = 'RE',            // Regional-Express
  RB = 'RB',            // Regionalbahn
  S = 'S',              // S-Bahn
  
  // France
  TGV = 'TGV',          // Train à Grande Vitesse
  TER = 'TER',          // Transport Express Régional
  TRANSILIEN = 'Transilien',
  
  // Italy
  FRECCIAROSSA = 'Frecciarossa',
  FRECCIARGENTO = 'Frecciargento',
  FRECCIABIANCA = 'Frecciabianca',
  
  // UK
  HIGH_SPEED = 'High Speed',
  EXPRESS = 'Express',
  
  // Generic
  EUROCITY = 'EuroCity',
  NIGHTJET = 'Nightjet',
}

enum JourneyStatus {
  SCHEDULED = 'SCHEDULED',
  ON_TIME = 'ON_TIME',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
  BOARDING = 'BOARDING',
  DEPARTED = 'DEPARTED',
  ARRIVED = 'ARRIVED',
}
```

---

## 8. Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "STATION_NOT_FOUND",
    "message": "Station with ID '99999' not found",
    "details": {
      "stationId": "99999"
    }
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| STATION_NOT_FOUND | 404 | Station ID doesn't exist |
| INVALID_DATE | 400 | Date format invalid |
| RATE_LIMITED | 429 | Too many requests |
| SERVICE_UNAVAILABLE | 503 | Rail operator API down |
| NO_JOURNEYS_FOUND | 404 | No routes between stations |
| AUTH_REQUIRED | 401 | Missing or invalid API key |

---

## 9. Caching Strategy

### Cache TTLs
| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Station list | 24 hours | Static data |
| Departures | 30 seconds | High volatility |
| Journey plans | 5 minutes | Moderate volatility |
| Train positions | 10 seconds | Real-time tracking |
| Disruptions | 5 minutes | Semi-static |

### Cache Keys
```
stations:{country_code}
departures:{station_id}:{date}
journey:{from_id}:{to_id}:{datetime_hash}
trip:{trip_id}
```

---

## 10. Webhook Events (Railtime.io)

### Subscription
```http
POST /api/v1/subscriptions
Content-Type: application/json
X-Railtime-Api-Secret: {API_KEY}

{
  "CodeQualifier": "UICCode",
  "DepartureCode": "8400530",
  "ScheduledDepartureDateTime": "2024-03-26T15:35:00+01:00",
  "ArrivalCode": "8400058",
  "ScheduledArrivalDateTime": "2024-03-26T16:15:00+01:00",
  "ReplyAddress": "https://api.railmate.app/webhooks/railtime",
  "ExternalIdentifier": "journey-123"
}
```

### Change Notification
```json
{
  "Key": "8400530|8400058|202403261535",
  "TimeStamp": "2024-03-26T13:58:25+01:00",
  "ChangeTypes": ["DEPARTURETIME", "DEPARTUREPLATFORM"],
  "DepartureUICCode": "8400530",
  "ArrivalUICCode": "8400058",
  "Scheduled": {
    "DepartureDateTime": "2024-03-26T15:35:00+01:00",
    "DeparturePlatform": null,
    "ArrivalDateTime": "2024-03-26T16:15:00+01:00",
    "ArrivalPlatform": null
  },
  "Actual": {
    "DepartureDateTime": "2024-03-26T15:40:00+01:00",
    "DeparturePlatform": "13",
    "ArrivalDateTime": "2024-03-26T16:20:00+01:00",
    "ArrivalPlatform": "11"
  }
}
```

---

## 11. Implementation Notes

### Retry Strategy
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 5
- Circuit breaker: Open after 10 consecutive failures

### Fallback Chain
1. Primary API (e.g., Deutsche Bahn)
2. GTFS-RT feed
3. Railtime.io
4. Cached data (stale-while-revalidate)

### Data Freshness Requirements
| Feature | Max Staleness |
|---------|---------------|
| Live tracking | 10 seconds |
| Delay alerts | 30 seconds |
| Departure boards | 60 seconds |
| Journey planning | 5 minutes |
| Station info | 24 hours |

---

*Document Version: 1.0*
*Last Updated: March 2026*
