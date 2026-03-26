/**
 * Stations Screen - Live departure board
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useStationDepartures, useStationSearch } from '../../hooks/useJourneys';
import { StationRow } from '../../components/StationRow';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function StationsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStationId, setSelectedStationId] = useState<string>('1'); // Default to Berlin
  const [selectedStationName, setSelectedStationName] = useState('Berlin Hbf');
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');

  const { data: searchResults, isLoading: isSearching } = useStationSearch(searchQuery);
  const { data: departures, isLoading: isLoadingDepartures } = useStationDepartures(selectedStationId);

  const handleStationSelect = (stationId: string, stationName: string) => {
    setSelectedStationId(stationId);
    setSelectedStationName(stationName);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search station..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <View style={styles.searchResults}>
          {isSearching ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((station) => (
              <TouchableOpacity
                key={station.id}
                style={styles.searchResultItem}
                onPress={() => handleStationSelect(station.id, station.name)}
              >
                <Text style={styles.searchResultText}>{station.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noResults}>No stations found</Text>
          )}
        </View>
      )}

      {/* Station Header */}
      <View style={styles.stationHeader}>
        <Text style={styles.stationName}>{selectedStationName}</Text>
        <Text style={styles.stationSubtitle}>Central Station • Germany</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'departures' && styles.tabActive]}
          onPress={() => setActiveTab('departures')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'departures' && styles.tabTextActive,
            ]}
          >
            Departures
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'arrivals' && styles.tabActive]}
          onPress={() => setActiveTab('arrivals')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'arrivals' && styles.tabTextActive,
            ]}
          >
            Arrivals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Board Header */}
      <View style={styles.boardHeader}>
        <Text style={styles.boardHeaderText}>Time</Text>
        <Text style={styles.boardHeaderText}>Train</Text>
        <Text style={[styles.boardHeaderText, { flex: 1 }]}>Destination</Text>
        <Text style={[styles.boardHeaderText, { textAlign: 'right' }]}>Plat</Text>
      </View>

      {/* Departure Board */}
      {isLoadingDepartures ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.board} showsVerticalScrollIndicator={false}>
          {departures?.map((departure) => (
            <StationRow key={departure.id} departure={departure} />
          ))}
        </ScrollView>
      )}

      {/* Update Banner */}
      <View style={styles.updateBanner}>
        <View style={styles.updateDot} />
        <Text style={styles.updateText}>
          Last updated:{' '}
          <Text style={styles.updateTime}>{format(new Date(), 'HH:mm')}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  searchResults: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 8,
    zIndex: 100,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  searchResultText: {
    color: COLORS.text,
    fontSize: 16,
  },
  noResults: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
  stationHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  stationName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  stationSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  boardHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  boardHeaderText: {
    width: 60,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  board: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1C1C1E',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  updateDot: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  updateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  updateTime: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
