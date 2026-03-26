/**
 * Map Screen - Shows train route visualization like Flighty
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useJourneyStore } from '../../stores/journeyStore';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Mock route coordinates for Berlin to Munich
const ROUTE_COORDINATES = [
  { latitude: 52.520008, longitude: 13.404954 }, // Berlin
  { latitude: 51.339695, longitude: 12.373075 }, // Leipzig
  { latitude: 50.827845, longitude: 12.92137 },  // Chemnitz area
  { latitude: 50.110922, longitude: 8.682127 },  // Frankfurt
  { latitude: 49.487459, longitude: 8.466039 },  // Mannheim
  { latitude: 48.775846, longitude: 9.182932 },  // Stuttgart
  { latitude: 48.135125, longitude: 11.581981 }, // Munich
];

export default function MapScreen() {
  const savedJourneys = useJourneyStore((state) => state.savedJourneys);
  const [selectedJourney, setSelectedJourney] = useState(
    savedJourneys.length > 0 ? savedJourneys[0] : null
  );
  const [mapRegion, setMapRegion] = useState({
    latitude: 50.5,
    longitude: 10.5,
    latitudeDelta: 8,
    longitudeDelta: 8,
  });

  // Calculate progress position along route
  const getProgressPosition = () => {
    if (!selectedJourney) return null;
    const progress = selectedJourney.progress || 0;
    const index = Math.floor((progress / 100) * (ROUTE_COORDINATES.length - 1));
    return ROUTE_COORDINATES[Math.min(index, ROUTE_COORDINATES.length - 1)];
  };

  const trainPosition = getProgressPosition();

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        customMapStyle={darkMapStyle}
      >
        {/* Route Line */}
        <Polyline
          coordinates={ROUTE_COORDINATES}
          strokeColor={COLORS.primary}
          strokeWidth={3}
          lineDashPattern={[1, 0]}
        />

        {/* Origin Marker */}
        <Marker coordinate={ROUTE_COORDINATES[0]}>
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.originMarker]} />
          </View>
        </Marker>

        {/* Destination Marker */}
        <Marker coordinate={ROUTE_COORDINATES[ROUTE_COORDINATES.length - 1]}>
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.destinationMarker]} />
          </View>
        </Marker>

        {/* Train Position Marker */}
        {trainPosition && (
          <Marker coordinate={trainPosition}>
            <View style={styles.trainMarkerContainer}>
              <View style={styles.trainMarker}>
                <Ionicons name="train" size={16} color={COLORS.text} />
              </View>
              <View style={styles.trainMarkerPulse} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Journey Info Card */}
      {selectedJourney && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.trainBadge}>
              <Text style={styles.trainNumber}>
                {selectedJourney.trainNumber}
              </Text>
            </View>
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    selectedJourney.status === 'ON_TIME'
                      ? COLORS.success
                      : selectedJourney.status === 'DELAYED'
                      ? COLORS.warning
                      : COLORS.textSecondary,
                },
              ]}
            >
              {selectedJourney.status === 'ON_TIME'
                ? 'On Time'
                : selectedJourney.status === 'DELAYED'
                ? `+${selectedJourney.delayMinutes} min`
                : selectedJourney.status}
            </Text>
          </View>

          <View style={styles.routeRow}>
            <Text style={styles.cityName}>
              {selectedJourney.origin.name.split(' ')[0]}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.cityName}>
              {selectedJourney.destination.name.split(' ')[0]}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${selectedJourney.progress || 0}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {selectedJourney.progress || 0}% complete
            </Text>
          </View>
        </View>
      )}

      {/* Journey Selector */}
      {savedJourneys.length > 1 && (
        <View style={styles.selectorContainer}>
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
                  selectedJourney?.id === journey.id &&
                    styles.selectorButtonActive,
                ]}
                onPress={() => setSelectedJourney(journey)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    selectedJourney?.id === journey.id &&
                      styles.selectorTextActive,
                  ]}
                >
                  {journey.trainNumber}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

import { ScrollView } from 'react-native';

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
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2C2C2E' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    width,
    height: height - 200,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  originMarker: {
    backgroundColor: COLORS.success,
  },
  destinationMarker: {
    backgroundColor: COLORS.primary,
  },
  trainMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trainMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  trainMarkerPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,122,255,0.3)',
    zIndex: 1,
  },
  infoCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trainBadge: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trainNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cityName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
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
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectorButtonActive: {
    backgroundColor: COLORS.primary,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectorTextActive: {
    color: COLORS.text,
  },
});
