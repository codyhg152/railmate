/**
 * Map Screen - Shows train route visualization like Flighty
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { useJourneyStore } from '../../stores/journeyStore';
import { MapMarker } from '../../components/MapMarker';
import { ProgressBar } from '../../components/ProgressBar';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Mock route coordinates for major German routes
const ROUTES: Record<string, { coordinates: { latitude: number; longitude: number }[]; stops: string[] }> = {
  'berlin-munich': {
    coordinates: [
      { latitude: 52.520008, longitude: 13.404954 }, // Berlin
      { latitude: 51.339695, longitude: 12.373075 }, // Leipzig
      { latitude: 50.827845, longitude: 10.92137 },  // Erfurt
      { latitude: 49.487459, longitude: 8.466039 },  // Mannheim
      { latitude: 48.775846, longitude: 9.182932 },  // Stuttgart
      { latitude: 48.135125, longitude: 11.581981 }, // Munich
    ],
    stops: ['Berlin Hbf', 'Leipzig Hbf', 'Erfurt Hbf', 'Mannheim Hbf', 'Stuttgart Hbf', 'München Hbf'],
  },
  'berlin-hamburg': {
    coordinates: [
      { latitude: 52.520008, longitude: 13.404954 }, // Berlin
      { latitude: 52.397861, longitude: 13.058835 }, // Potsdam
      { latitude: 52.412529, longitude: 12.533649 }, // Brandenburg
      { latitude: 52.245268, longitude: 11.624323 }, // Wolfsburg
      { latitude: 52.375892, longitude: 9.732010 },  // Hanover
      { latitude: 52.268873, longitude: 10.526770 }, // Braunschweig
      { latitude: 53.551086, longitude: 9.993682 },  // Hamburg
    ],
    stops: ['Berlin Hbf', 'Potsdam', 'Brandenburg', 'Wolfsburg', 'Hannover', 'Braunschweig', 'Hamburg Hbf'],
  },
  'berlin-frankfurt': {
    coordinates: [
      { latitude: 52.520008, longitude: 13.404954 }, // Berlin
      { latitude: 52.275040, longitude: 11.850840 }, // Wolfsburg
      { latitude: 51.495351, longitude: 11.966807 }, // Halle
      { latitude: 50.937531, longitude: 11.589250 }, // Erfurt
      { latitude: 50.978700, longitude: 11.329370 }, // Gotha
      { latitude: 50.110922, longitude: 8.682127 },  // Frankfurt
    ],
    stops: ['Berlin Hbf', 'Wolfsburg', 'Halle', 'Erfurt', 'Gotha', 'Frankfurt Hbf'],
  },
};

// Default route
const DEFAULT_ROUTE = ROUTES['berlin-munich'];

export default function MapScreen() {
  const savedJourneys = useJourneyStore((state) => state.savedJourneys);
  const [selectedJourney, setSelectedJourney] = useState(
    savedJourneys.length > 0 ? savedJourneys[0] : null
  );
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 50.5,
    longitude: 10.5,
    latitudeDelta: 8,
    longitudeDelta: 8,
  });
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  // Get route based on journey
  const getRoute = () => {
    if (!selectedJourney) return DEFAULT_ROUTE;
    
    const originName = selectedJourney.origin.name.toLowerCase();
    const destName = selectedJourney.destination.name.toLowerCase();
    
    if (originName.includes('berlin') && destName.includes('münchen')) {
      return ROUTES['berlin-munich'];
    }
    if (originName.includes('berlin') && destName.includes('hamburg')) {
      return ROUTES['berlin-hamburg'];
    }
    if (originName.includes('berlin') && destName.includes('frankfurt')) {
      return ROUTES['berlin-frankfurt'];
    }
    
    return DEFAULT_ROUTE;
  };

  const route = getRoute();

  // Calculate progress position along route
  const getProgressPosition = () => {
    if (!selectedJourney) return null;
    const progress = selectedJourney.progress || 0;
    const index = Math.floor((progress / 100) * (route.coordinates.length - 1));
    const nextIndex = Math.min(index + 1, route.coordinates.length - 1);
    
    // Interpolate between points for smoother movement
    const segmentProgress = ((progress / 100) * (route.coordinates.length - 1)) - index;
    const current = route.coordinates[index];
    const next = route.coordinates[nextIndex];
    
    return {
      latitude: current.latitude + (next.latitude - current.latitude) * segmentProgress,
      longitude: current.longitude + (next.longitude - current.longitude) * segmentProgress,
    };
  };

  const trainPosition = getProgressPosition();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Fit map to show the entire route
  const fitToRoute = () => {
    if (mapRef.current && route.coordinates.length > 0) {
      mapRef.current.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fitToRoute();
    }
  }, [isLoading, selectedJourney]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Route Line */}
        <Polyline
          coordinates={route.coordinates}
          strokeColor={COLORS.primary}
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />

        {/* Origin Marker */}
        <Marker coordinate={route.coordinates[0]}>
          <MapMarker 
            type="origin" 
            label={route.stops[0]}
          />
        </Marker>

        {/* Destination Marker */}
        <Marker coordinate={route.coordinates[route.coordinates.length - 1]}>
          <MapMarker 
            type="destination" 
            label={route.stops[route.stops.length - 1]}
          />
        </Marker>

        {/* Stop Markers */}
        {route.coordinates.slice(1, -1).map((coord, index) => (
          <Marker key={index} coordinate={coord}>
            <MapMarker 
              type="stop" 
              label={route.stops[index + 1]}
              status="upcoming"
            />
          </Marker>
        ))}

        {/* Train Position Marker */}
        {trainPosition && selectedJourney && (
          <Marker coordinate={trainPosition}>
            <MapMarker 
              type="train" 
              trainNumber={selectedJourney.trainNumber}
              status={selectedJourney.status === 'DEPARTED' ? 'active' : 'upcoming'}
            />
          </Marker>
        )}
      </MapView>

      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text style={styles.headerTitle}>Live Map</Text>
        <TouchableOpacity style={styles.locationButton} onPress={fitToRoute}>
          <Ionicons name="locate" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Journey Info Card */}
      {selectedJourney && (
        <Animated.View entering={FadeInUp.delay(200)} style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.trainBadge}>
              <Text style={styles.trainNumber}>
                {selectedJourney.trainNumber}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(selectedJourney.status) + '26' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(selectedJourney.status) }
              ]}>
                {selectedJourney.status === 'ON_TIME' 
                  ? 'On Time' 
                  : selectedJourney.status === 'DELAYED' 
                  ? `+${selectedJourney.delayMinutes} min`
                  : selectedJourney.status}
              </Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <Text style={styles.cityName}>
              {selectedJourney.origin.name.split(' ')[0]}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={COLORS.textSecondary}
            />
            <Text style={styles.cityName}>
              {selectedJourney.destination.name.split(' ')[0]}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <ProgressBar
              progress={selectedJourney.progress || 0}
              status={selectedJourney.status}
              height={8}
              animated
            />
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>Start</Text>
              <Text style={styles.progressPercent}>
                {Math.round(selectedJourney.progress || 0)}%
              </Text>
              <Text style={styles.progressText}>Destination</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Journey Selector */}
      {savedJourneys.length > 1 && (
        <Animated.View entering={FadeInUp.delay(300)} style={styles.selectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorContent}
          >
            {savedJourneys.map((journey) => (
              <TouchableOpacity
                key={journey.id}
                style={[
                  styles.selectorButton,
                  selectedJourney?.id === journey.id && styles.selectorButtonActive,
                ]}
                onPress={() => setSelectedJourney(journey)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    selectedJourney?.id === journey.id && styles.selectorTextActive,
                  ]}
                >
                  {journey.trainNumber}
                </Text>
                <Text style={styles.selectorRoute}>
                  {journey.origin.name.split(' ')[0]} → {journey.destination.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* No Journeys Message */}
      {savedJourneys.length === 0 && (
        <Animated.View entering={FadeInUp.delay(200)} style={styles.noJourneysCard}>
          <Ionicons name="train-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.noJourneysTitle}>No Active Journeys</Text>
          <Text style={styles.noJourneysText}>
            Add a journey to see it on the map
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ON_TIME':
    case 'ARRIVED':
      return COLORS.success;
    case 'DELAYED':
      return COLORS.warning;
    case 'CANCELLED':
      return COLORS.danger;
    case 'BOARDING':
    case 'DEPARTED':
      return COLORS.primary;
    default:
      return COLORS.textSecondary;
  }
}

// Dark map style
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1C1C1E' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8E8E93' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#2C2C2E' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3A3A3C' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2C2C2E' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3A3A3C' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2C2C2E' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  map: {
    width,
    height: height - 250,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(28,28,30,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoCard: {
    position: 'absolute',
    bottom: 140,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(28,28,30,0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trainBadge: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trainNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cityName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  selectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  selectorButton: {
    backgroundColor: 'rgba(28,28,30,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectorButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectorText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectorTextActive: {
    color: COLORS.text,
  },
  selectorRoute: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  noJourneysCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(28,28,30,0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  noJourneysTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  noJourneysText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
