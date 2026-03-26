/**
 * Main Flights screen - Combined map + list like Flighty
 * Map at top (40%), swipeable train cards below
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated as RNAnimated,
  PanResponder,
} from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useJourneyStore } from '../../stores/journeyStore';
import { TrainJourney } from '../../lib/types';
import { COLORS, STATUS_COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { computeSmartState, JourneyState } from '../../utils/smartState';
import { useSmartStates } from '../../hooks/useSmartState';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.4;
const CARD_HEIGHT = 120;
const SNAP_POINTS = [MAP_HEIGHT, height * 0.6, height * 0.15];

const ACCENT_COLOR: Record<string, string> = {
  danger: COLORS.danger,
  warning: COLORS.warning,
  success: COLORS.success,
  primary: COLORS.primary,
  info: COLORS.info,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
};

// Mock routes
const ROUTES: Record<string, { coordinates: { latitude: number; longitude: number }[] }> = {
  'berlin-munich': {
    coordinates: [
      { latitude: 52.520008, longitude: 13.404954 },
      { latitude: 51.339695, longitude: 12.373075 },
      { latitude: 50.827845, longitude: 10.92137 },
      { latitude: 49.487459, longitude: 8.466039 },
      { latitude: 48.135125, longitude: 11.581981 },
    ],
  },
};

export default function FlightsScreen() {
  const router = useRouter();
  const savedJourneys = useJourneyStore((state) => state.savedJourneys);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sheetPosition, setSheetPosition] = useState(SNAP_POINTS[0]);
  const mapRef = useRef<MapView>(null);
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const panY = useRef(new RNAnimated.Value(MAP_HEIGHT)).current;

  // Smart states for all journeys (handles haptic on transition)
  const smartStates = useSmartStates(savedJourneys);

  const selectedJourney = savedJourneys[selectedIndex] || null;

  // Get route for selected journey
  const getRoute = () => {
    if (!selectedJourney) return ROUTES['berlin-munich'];
    return ROUTES['berlin-munich']; // Simplified
  };

  const route = getRoute();

  // Fit map to route
  const fitToRoute = useCallback(() => {
    if (mapRef.current && route.coordinates.length > 0) {
      mapRef.current.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [route]);

  // Handle card swipe
  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    if (index !== selectedIndex) {
      setSelectedIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Pan responder for bottom sheet
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newY = Math.max(SNAP_POINTS[2], Math.min(SNAP_POINTS[0], sheetPosition + gestureState.dy));
        panY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY = sheetPosition + gestureState.dy;
        const closest = SNAP_POINTS.reduce((prev, curr) =>
          Math.abs(curr - currentY) < Math.abs(prev - currentY) ? curr : prev
        );
        setSheetPosition(closest);
        RNAnimated.spring(panY, {
          toValue: closest,
          useNativeDriver: true,
        }).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  // Render single flight card (Flighty style - smart state aware)
  const renderFlightCard = (journey: TrainJourney, index: number) => {
    const departureTime = new Date(journey.scheduledDeparture);
    const isActive = index === selectedIndex;
    const smartState = smartStates[index];

    const timeStr = format(departureTime, 'HH:mm');
    let dateLabel = format(departureTime, 'EEE, MMM d');
    if (isToday(departureTime)) dateLabel = 'Today';
    if (isTomorrow(departureTime)) dateLabel = 'Tomorrow';

    const accentColor = smartState?.content.accent
      ? ACCENT_COLOR[smartState.content.accent] ?? COLORS.text
      : COLORS.text;

    const isLiveState = smartState && [
      JourneyState.boarding,
      JourneyState.atPlatform,
      JourneyState.taxiing,
      JourneyState.inTransit,
      JourneyState.arriving,
      JourneyState.onBoard,
    ].includes(smartState.state);

    return (
      <TouchableOpacity
        key={journey.id}
        style={[styles.card, isActive && styles.cardActive, isLiveState && styles.cardLive]}
        onPress={() => router.push(`/journey/${journey.id}`)}
        activeOpacity={0.9}
      >
        {/* Live state accent bar */}
        {isLiveState && (
          <View style={[styles.liveBar, { backgroundColor: accentColor }]} />
        )}

        {/* Time - Most prominent (Flighty style) */}
        <Text style={styles.timeText}>{timeStr}</Text>

        {/* Smart state content */}
        {smartState ? (
          <View style={styles.stateContent}>
            <Text style={[styles.headlineText, { color: accentColor }]} numberOfLines={1}>
              {smartState.content.headline}
            </Text>
            <Text style={styles.primaryText} numberOfLines={1}>
              {smartState.content.primary}
            </Text>
            {smartState.content.secondary && (
              <Text style={styles.secondaryText} numberOfLines={1}>
                {smartState.content.secondary}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.stateContent}>
            <View style={styles.routeRow}>
              <Text style={styles.stationText}>{journey.origin.name}</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} style={styles.arrow} />
              <Text style={styles.stationText}>{journey.destination.name}</Text>
            </View>
            <Text style={styles.secondaryText}>{dateLabel}</Text>
          </View>
        )}

        {/* Action button for boarding states */}
        {isActive && smartState?.content.action && (
          <View style={styles.actionBadge}>
            <Text style={styles.actionText}>{smartState.content.action}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Empty state
  if (savedJourneys.length === 0) {
    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 51,
            longitude: 10,
            latitudeDelta: 8,
            longitudeDelta: 8,
          }}
          customMapStyle={darkMapStyle}
        />
        <View style={styles.emptyOverlay}>
          <Ionicons name="train-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Upcoming Journeys</Text>
          <Text style={styles.emptySubtitle}>Tap + to add your first train</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/search');
          }}
        >
          <Ionicons name="add" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map - Top 40% */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 50.5,
          longitude: 10.5,
          latitudeDelta: 8,
          longitudeDelta: 8,
        }}
        customMapStyle={darkMapStyle}
        onMapReady={fitToRoute}
      >
        {selectedJourney && (
          <>
            <Polyline
              coordinates={route.coordinates}
              strokeColor={COLORS.primary}
              strokeWidth={3}
              lineCap="round"
            />
            <Marker coordinate={route.coordinates[0]}>
              <View style={styles.originMarker} />
            </Marker>
            <Marker coordinate={route.coordinates[route.coordinates.length - 1]}>
              <View style={styles.destinationMarker} />
            </Marker>
          </>
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {savedJourneys.length === 1 ? '1 Journey' : `${savedJourneys.length} Journeys`}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/search');
          }}
        >
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet - Swipeable Cards */}
      <RNAnimated.View
        style={[
          styles.bottomSheet,
          { transform: [{ translateY: panY }] }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle}>
          <View style={styles.dragBar} />
        </View>

        {/* Horizontal Scroll Cards */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.cardsContainer}
        >
          {savedJourneys.map((journey, index) => renderFlightCard(journey, index))}
        </ScrollView>

        {/* Page Indicator */}
        <View style={styles.pageIndicator}>
          {savedJourneys.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === selectedIndex && styles.dotActive
              ]}
            />
          ))}
        </View>
      </RNAnimated.View>
    </View>
  );
}

// Dark map style
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1C1C1E' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8E8E93' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1C1C1E' }] },
  { featureType: 'water', stylers: [{ color: '#000000' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'on' }, { color: '#2C2C2E' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    height: MAP_HEIGHT,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textSecondary,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  card: {
    width: width - 40,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  cardLive: {
    backgroundColor: '#1C1C2E',
  },
  liveBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  timeText: {
    fontSize: 34,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  stateContent: {
    marginTop: 8,
  },
  headlineText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 2,
  },
  secondaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  arrow: {
    marginHorizontal: 6,
  },
  actionBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textSecondary,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  originMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  destinationMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
