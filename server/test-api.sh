#!/bin/bash

# Test script for Railmate API

echo "=== Railmate API Test ==="
echo ""

BASE_URL="http://localhost:3000"

# Test health endpoint
echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/health" | jq . 2>/dev/null || echo "Health check failed"
echo ""

# Test station search
echo "2. Testing Station Search (Berlin)..."
curl -s "$BASE_URL/api/stations/search?q=Berlin" | jq '.[0:3]' 2>/dev/null || echo "Station search failed"
echo ""

# Test departures (if we have a station ID)
echo "3. Testing Departures (Berlin Hbf - 8011160)..."
curl -s "$BASE_URL/api/stations/8011160/departures" | jq '.[0:3]' 2>/dev/null || echo "Departures failed"
echo ""

echo "=== Test Complete ==="
