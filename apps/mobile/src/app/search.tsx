/**
 * Search Screen - Add new journey
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useStationSearch, useJourneySearch } from '../hooks/useJourneys';
import { useJourneyStore } from '../stores/journeyStore';
import { Station, TrainJourney } from '../lib/types';
import { COLORS } from '../lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen() {
  const router = useRouter();
  const addJourney = useJourneyStore((state) => state.addJourney);

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [showFromResults, setShowFromResults] = useState(false);
  const [showToResults, setShowToResults] = useState(false);

  const { data: fromResults, isLoading: isLoadingFrom } = useStationSearch(fromQuery);
  const { data: toResults, isLoading: isLoadingTo } = useStationSearch(toQuery);
  const { data: searchResults, isLoading: isSearching } = useJourneySearch(
    fromStation?.id || '',
    toStation?.id || ''
  );

  const handleSelectFrom = (station: Station) => {
    setFromStation(station);
    setFromQuery(station.name);
    setShowFromResults(false);
  };

  const handleSelectTo = (station: Station) => {
    setToStation(station);
    setToQuery(station.name);
    setShowToResults(false);
  };

  const handleAddJourney = (journey: TrainJourney) => {
    addJourney(journey);
    router.push(`/journey/${journey.id}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search Journey</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* From Input */}
        <View style={styles.inputContainer}>
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
            />
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
                    <Text style={styles.resultText}>{station.name}</Text>
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
        </View>

        {/* To Input */}
        <View style={styles.inputContainer}>
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
                    <Text style={styles.resultText}>{station.name}</Text>
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
        </View>

        {/* Search Results */}
        {fromStation && toStation && (
          <View style={styles.searchResults}>
            <Text style={styles.resultsTitle}>
              {fromStation.name} → {toStation.name}
            </Text>

            {isSearching ? (
              <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : searchResults?.journeys ? (
              searchResults.journeys.map((journey) => (
                <TouchableOpacity
                  key={journey.id}
                  style={styles.journeyCard}
                  onPress={() => handleAddJourney(journey)}
                >
                  <View style={styles.journeyHeader}>
                    <View style={styles.trainBadge}>
                      <Text style={styles.trainNumber}>
                        {journey.trainNumber}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.journeyStatus,
                        {
                          color:
                            journey.status === 'ON_TIME'
                              ? COLORS.success
                              : COLORS.warning,
                        },
                      ]}
                    >
                      {journey.status === 'ON_TIME' ? 'On time' : 'Delayed'}
                    </Text>
                  </View>

                  <View style={styles.journeyTimes}>
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeValue}>
                        {format(new Date(journey.scheduledDeparture), 'HH:mm')}
                      </Text>
                      <Text style={styles.timeLabel}>Departure</Text>
                    </View>

                    <View style={styles.durationColumn}>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={COLORS.textSecondary}
                      />
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
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noJourneys}>No journeys found</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
  },
  resultsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
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
  resultText: {
    color: COLORS.text,
    fontSize: 16,
  },
  noResults: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
  searchResults: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  loader: {
    marginTop: 32,
  },
  journeyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  journeyStatus: {
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  durationColumn: {
    paddingHorizontal: 16,
  },
  platformColumn: {
    alignItems: 'center',
  },
  platformValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  platformLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  noJourneys: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 32,
  },
});
