# Railmate Server

European train tracking API built with Node.js, Fastify, and TypeScript.

## Features

- **Station Search**: Search for stations across Europe
- **Departure Boards**: Real-time departure information
- **Journey Planning**: Find routes between stations
- **Multi-Country Support**: Deutsche Bahn (Germany), SNCF (France), National Rail (UK)
- **Caching**: Redis caching for optimal performance
- **Rate Limiting**: Built-in rate limiting for external APIs
- **Push Notifications**: Register push tokens for journey alerts

## API Endpoints

### Stations
- `GET /api/stations/search?q={query}` - Search stations
- `GET /api/stations/:id/departures` - Get departures for a station

### Journeys
- `GET /api/journeys/search?from={id}&to={id}&date={iso}` - Search journeys
- `GET /api/journeys/:id` - Get journey details

### Users
- `POST /api/users/push-token` - Register push notification token

### Health
- `GET /health` - Health check endpoint

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start PostgreSQL and Redis (using Docker):
```bash
docker-compose up -d postgres redis
```

4. Run the development server:
```bash
npm run dev
```

### Docker Deployment

1. Build and run all services:
```bash
docker-compose up -d
```

2. The API will be available at `http://localhost:3000`

3. API documentation at `http://localhost:3000/documentation`

## Data Sources

### Primary: Deutsche Bahn (Germany)
- Base URL: https://v5.db.transport.rest
- No authentication required
- Rate limit: 100 req/min

### Secondary: SNCF (France)
- Requires API token from numerique.sncf.com
- Set `SNCF_API_TOKEN` environment variable

### Secondary: National Rail (UK)
- Requires API token from nationalrail.co.uk/developers
- Set `NATIONAL_RAIL_API_TOKEN` environment variable

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `POSTGRES_HOST` | PostgreSQL host | `localhost` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | PostgreSQL database | `railmate` |
| `POSTGRES_USER` | PostgreSQL user | `railmate` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `railmate` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `SNCF_API_TOKEN` | SNCF API token | - |
| `NATIONAL_RAIL_API_TOKEN` | National Rail API token | - |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

## License

MIT
