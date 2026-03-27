/**
 * Search Screen - Add new journey with real API integration
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useStationSearch, useJourneySearch } from '../hooks/useJourneys';
import { useJourneyStore } from '../stores/journeyStore';
import { Station, TrainJourney } from '../lib/types';
import { COLORS } from '../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusText } from '../components/StatusText';
import { NoResultsEmptyState, ErrorEmptyState } from '../components/EmptyState';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function SearchScreen() {
  const router = useRouter();
  const addJourney = useJourneyStore((state) => state.addJourney);

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [showFromResults, setShowFromResults] = useState(false);
  const [showToResults, setShowToResults] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: fromResults, isLoading: isLoadingFrom, error: fromError } = useStationSearch(fromQuery);
  const { data: toResults, isLoading: isLoadingTo, error: toError } = useStationSearch(toQuery);
  const { 
    data: searchResults, 
    isLoading: isSearching,
    error: searchError,
    refetch: refetchJourneys,
  } = useJourneySearch(
    fromStation?.id || '',
    toStation?.id || '',
    selectedDate
  );

  const handleSelectFrom = (station: Station) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromStation(station);
    setFromQuery(station.name);
    setShowFromResults(false);
  };

  const handleSelectTo = (station: Station) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToStation(station);
    setToQuery(station.name);
    setShowToResults(false);
  };

  const handleAddJourney = (journey: TrainJourney) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addJourney(journey);
    router.push(`/journey/${journey.id}`);
  };

  const swapStations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const tempStation = fromStation;
    const tempQuery = fromQuery;
    setFromStation(toStation);
    setFromQuery(toQuery);
    setToStation(tempStation);
    setToQuery(tempQuery);
  };

  const hasError = fromError || toError || searchError;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text style={styles.title}>Search Journey</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* From Input */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.inputContainer}>
          <Text style={styles.inputLabel}>From</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="location-outline"
              size={20}
              color={COLORS.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Departure station"
              placeholderTextColor={COLORS.textSecondary}
              value={fromQuery}
              onChangeText={(text) => {
                setFromQuery(text);
                setShowFromResults(text.length >= 2);
                if (fromStation && text !== fromStation.name) {
                  setFromStation(null);
                }
              }}
              autoFocus
            />
            {fromQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setFromQuery(''); setFromStation(null); }}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* From Results */}
          {showFromResults && fromQuery.length >= 2 && (
            <View style={styles.resultsContainer}>
              {isLoadingFrom ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : fromResults && fromResults.length > 0 ? (
                fromResults.map((station) => (
                  <TouchableOpacity
                    key={station.id}
                    style={styles.resultItem}
                    onPress={() => handleSelectFrom(station)}
                  >
                    <View style={styles.resultContent}>
                      <Ionicons name="location" size={18} color={COLORS.primary} />
                      <Text style={styles.resultText}>{station.name}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResults}>No stations found</Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* Swap Button */}
        <Animated.View entering={FadeInUp.delay(150)} style={styles.swapContainer}>
          <TouchableOpacity style={styles.swapButton} onPress={swapStations}>
            <Ionicons name="swap-vertical" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* To Input */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.inputContainer}>
          <Text style={styles.inputLabel}>To</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="location"
              size={20}
              color={COLORS.danger}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Arrival station"
              placeholderTextColor={COLORS.textSecondary}
              value={toQuery}
              onChangeText={(text) => {
                setToQuery(text);
                setShowToResults(text.length >= 2);
                if (toStation && text !== toStation.name) {
                  setToStation(null);
                }
              }}
            />
            {toQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setToQuery(''); setToStation(null); }}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* To Results */}
          {showToResults && toQuery.length >= 2 && (
            <View style={styles.resultsContainer}>
              {isLoadingTo ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : toResults && toResults.length > 0 ? (
                toResults.map((station) => (
                  <TouchableOpacity
                    key={station.id}
                    style={styles.resultItem}
                    onPress={() => handleSelectTo(station)}
                  >
                    <View style={styles.resultContent}>
                      <Ionicons name="location" size={18} color={COLORS.danger} />
                      <Text style={styles.resultText}>{station.name}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResults}>No stations found</Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* Search Results */}
        {fromStation && toStation && (
          <Animated.View entering={FadeInUp.delay(300)} style={styles.searchResults}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {fromStation.name} → {toStation.name}
              </Text>
              <Text style={styles.resultsDate}>
                {format(selectedDate, 'EEEE, MMM d')}
              </Text>
            </View>

            {isSearching ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loaderText}>Searching journeys...</Text>
              </View>
            ) : searchError ? (
              <ErrorEmptyState 
                message="Couldn't search for journeys"
                onRetry={() => refetchJourneys()}
              />
            ) : searchResults?.journeys && searchResults.journeys.length > 0 ? (
              searchResults.journeys.map((journey, index) => (
                <Animated.View 
                  key={journey.id}
                  entering={FadeInUp.delay(index * 100)}
                >
                  <TouchableOpacity
                    style={styles.journeyCard}
                    onPress={() => handleAddJourney(journey)}
                  >
                    <View style={styles.journeyHeader}>
                      <View style={styles.trainBadge}>
                        <Text style={styles.trainNumber}>
                          {journey.trainNumber}
                        </Text>
                      </View>
                      <StatusText status={journey.status} delayMinutes={journey.delayMinutes} />
                    </View>

                    <View style={styles.journeyTimes}>
                      <View style={styles.timeColumn}>
                        <Text style={styles.timeValue}>
                          {format(new Date(journey.scheduledDeparture), 'HH:mm')}
                        </Text>
                        <Text style={styles.timeLabel}>Departure</Text>
                      </View>

                      <View style={styles.durationColumn}>
                        <View style={styles.durationLine} />
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.durationText}>
                          {Math.round((new Date(journey.scheduledArrival).getTime() - 
                            new Date(journey.scheduledDeparture).getTime()) / 60000)} min
                        </Text>
                      </View>

                      <View style={styles.timeColumn}>
                        <Text style={styles.timeValue}>
                          {format(new Date(journey.scheduledArrival), 'HH:mm')}
                        </Text>
                        <Text style={styles.timeLabel}>Arrival</Text>
                      </View>

                      <View style={styles.platformColumn}>
                        <Text style={styles.platformValue}>
                          {journey.platform}
                        </Text>
                        <Text style={styles.platformLabel}>Platform</Text>
                      </View>
                    </View>

                    <View style={styles.journeyFooter}>
                      <Ionicons name="information-circle-outline" size={16} color={COLORS.textTertiary} />
                      <Text style={styles.journeyFooterText}>
                        Tap to track this journey
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <NoResultsEmptyState 
                onClear={() => {
                  setFromStation(null);
                  setFromQuery('');
                  setToStation(null);
                  setToQuery('');
                }}
              />
            )}
          </Animated.View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '500',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  noResults: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
  searchResults: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  resultsDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    color: COLORS.textSecondary,
    marginTop: 16,
    fontSize: 15,
  },
  journeyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  trainBadge: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trainNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  journeyTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationColumn: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  durationLine: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: COLORS.border,
  },
  durationText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  platformColumn: {
    alignItems: 'center',
  },
  platformValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  platformLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  journeyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  journeyFooterText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  bottomPadding: {
    height: 100,
  },
});
