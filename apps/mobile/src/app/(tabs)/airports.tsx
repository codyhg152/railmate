/**
 * Stations Screen - Live departure board with airport FIDS style
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useStationDepartures, useStationSearch, usePullToRefresh } from '../../hooks/useJourneys';
import { StationRow } from '../../components/StationRow';
import { StationRowSkeleton } from '../../components/SkeletonLoader';
import { NoResultsEmptyState, ErrorEmptyState } from '../../components/EmptyState';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function StationsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStationId, setSelectedStationId] = useState<string>('8000096'); // Berlin Hbf
  const [selectedStationName, setSelectedStationName] = useState('Berlin Hauptbahnhof');
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');

  const { data: searchResults, isLoading: isSearching } = useStationSearch(searchQuery);
  const { 
    data: departures, 
    isLoading: isLoadingDepartures,
    isError,
    error,
    refresh,
    isRefreshing,
  } = useStationDepartures(selectedStationId);

  const handleStationSelect = (stationId: string, stationName: string) => {
    setSelectedStationId(stationId);
    setSelectedStationName(stationName);
    setSearchQuery('');
  };

  const handleRetry = () => {
    refresh();
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.searchContainer}>
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
      </Animated.View>

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
                <View style={styles.searchResultContent}>
                  <Ionicons name="location" size={18} color={COLORS.primary} />
                  <Text style={styles.searchResultText}>{station.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noResults}>No stations found</Text>
          )}
        </View>
      )}

      {/* Station Header */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.stationHeader}>
        <Text style={styles.stationName}>{selectedStationName}</Text>
        <Text style={styles.stationSubtitle}>Live Departures • Germany</Text>
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInUp.delay(150)} style={styles.tabs}>
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
      </Animated.View>

      {/* Board Header */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.boardHeader}>
        <Text style={styles.boardHeaderText}>Time</Text>
        <Text style={styles.boardHeaderText}>Train</Text>
        <Text style={[styles.boardHeaderText, { flex: 1 }]}>Destination</Text>
        <Text style={[styles.boardHeaderText, { textAlign: 'right' }]}>Plat</Text>
      </Animated.View>

      {/* Departure Board */}
      {isLoadingDepartures ? (
        <ScrollView style={styles.board} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map((i) => (
            <StationRowSkeleton key={i} />
          ))}
        </ScrollView>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <ErrorEmptyState 
            message={error?.message || "Couldn't load departures"}
            onRetry={handleRetry}
          />
        </View>
      ) : (
        <ScrollView 
          style={styles.board} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {departures?.map((departure, index) => (
            <StationRow 
              key={departure.id} 
              departure={departure}
              index={index}
            />
          ))}
          
          {departures?.length === 0 && (
            <NoResultsEmptyState />
          )}
        </ScrollView>
      )}

      {/* Update Banner */}
      <Animated.View entering={FadeInUp.delay(300)} style={styles.updateBanner}>
        <View style={styles.updateDot} />
        <Text style={styles.updateText}>
          Last updated:{' '}
          <Text style={styles.updateTime}>{format(new Date(), 'HH:mm')}</Text>
        </Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
          <Ionicons 
            name="refresh" 
            size={16} 
            color={COLORS.primary}
            style={isRefreshing && styles.refreshingIcon}
          />
        </TouchableOpacity>
      </Animated.View>
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
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 8,
    zIndex: 100,
    maxHeight: 250,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchResultText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
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
    fontWeight: '800',
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
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
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
    width: 55,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    flex: 1,
  },
  updateTime: {
    color: COLORS.text,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 4,
  },
  refreshingIcon: {
    transform: [{ rotate: '45deg' }],
  },
});
