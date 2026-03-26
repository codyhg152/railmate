/**
 * Custom hooks for journey data fetching with React Query
 * Enhanced with refresh, error handling, and loading states
 */
import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { trainApi, ApiError } from '../lib/api';
import { TrainJourney, Station, Departure } from '../lib/types';
import { useState, useCallback } from 'react';

// Query keys
export const queryKeys = {
  journeys: 'journeys' as const,
  journey: (id: string) => ['journey', id] as const,
  departures: (stationId: string) => ['departures', stationId] as const,
  stations: (query: string) => ['stations', query] as const,
};

// Hook return type with refresh
interface QueryWithRefresh<T> extends UseQueryResult<T, ApiError> {
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

/**
 * Hook to search for stations
 */
export function useStationSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.stations(query),
    queryFn: () => trainApi.searchStations(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') return false;
      return failureCount < 3;
    },
  });
}

/**
 * Hook to get departures for a station with refresh
 */
export function useStationDepartures(stationId: string): QueryWithRefresh<Departure[]> {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.departures(stationId),
    queryFn: () => trainApi.getDepartures(stationId),
    enabled: !!stationId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
    retry: 2,
  });

  const refresh = useCallback(async () => {
    if (!stationId) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.departures(stationId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.departures(stationId) });
    } finally {
      setIsRefreshing(false);
    }
  }, [stationId, queryClient]);

  return {
    ...query,
    refresh,
    isRefreshing,
  };
}

/**
 * Hook to search for journeys between stations
 */
export function useJourneySearch(
  fromStationId: string,
  toStationId: string,
  date?: Date
) {
  return useQuery({
    queryKey: ['journeySearch', fromStationId, toStationId, date],
    queryFn: () => trainApi.searchJourneys(fromStationId, toStationId, date),
    enabled: !!fromStationId && !!toStationId,
    staleTime: 60000,
    retry: 2,
  });
}

/**
 * Hook to get journey details with refresh
 */
export function useJourneyDetails(journeyId: string): QueryWithRefresh<TrainJourney | null> {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.journey(journeyId),
    queryFn: () => trainApi.getJourneyDetails(journeyId),
    enabled: !!journeyId,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 2,
  });

  const refresh = useCallback(async () => {
    if (!journeyId) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.journey(journeyId) });
      await queryClient.refetchQueries({ queryKey: queryKeys.journey(journeyId) });
    } finally {
      setIsRefreshing(false);
    }
  }, [journeyId, queryClient]);

  return {
    ...query,
    refresh,
    isRefreshing,
  };
}

/**
 * Hook to refresh journey data manually
 */
export function useRefreshJourney() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (journeyId: string) => {
      return trainApi.getJourneyDetails(journeyId);
    },
    onSuccess: (data, journeyId) => {
      queryClient.setQueryData(queryKeys.journey(journeyId), data);
    },
  });
}

/**
 * Hook to get multiple journey details (for saved journeys)
 */
export function useSavedJourneys(journeyIds: string[]) {
  return useQuery({
    queryKey: ['savedJourneys', journeyIds],
    queryFn: async () => {
      const journeys = await Promise.all(
        journeyIds.map(id => trainApi.getJourneyDetails(id))
      );
      return journeys.filter((j): j is TrainJourney => j !== null);
    },
    enabled: journeyIds.length > 0,
    staleTime: 30000,
  });
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(refreshFn: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFn();
    } finally {
      setRefreshing(false);
    }
  }, [refreshFn]);

  return { refreshing, onRefresh };
}
