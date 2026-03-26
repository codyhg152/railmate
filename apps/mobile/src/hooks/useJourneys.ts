/**
 * Custom hooks for journey data fetching
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainApi } from '../lib/api';
import { TrainJourney, Station, Departure } from '../lib/types';

// Query keys
export const queryKeys = {
  journeys: 'journeys',
  journey: (id: string) => ['journey', id],
  departures: (stationId: string) => ['departures', stationId],
  stations: (query: string) => ['stations', query],
};

/**
 * Hook to search for stations
 */
export function useStationSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.stations(query),
    queryFn: () => trainApi.searchStations(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get departures for a station
 */
export function useStationDepartures(stationId: string) {
  return useQuery({
    queryKey: queryKeys.departures(stationId),
    queryFn: () => trainApi.getDepartures(stationId),
    enabled: !!stationId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });
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
  });
}

/**
 * Hook to get journey details
 */
export function useJourneyDetails(journeyId: string) {
  return useQuery({
    queryKey: queryKeys.journey(journeyId),
    queryFn: () => trainApi.getJourneyDetails(journeyId),
    enabled: !!journeyId,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

/**
 * Hook to refresh journey data
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
