/**
 * Zustand store for journey state management
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TrainJourney, JourneyStats } from '../lib/types';
import { STORAGE_KEYS } from '../lib/constants';

interface JourneyState {
  // Saved journeys
  savedJourneys: TrainJourney[];
  addJourney: (journey: TrainJourney) => void;
  removeJourney: (journeyId: string) => void;
  updateJourney: (journeyId: string, updates: Partial<TrainJourney>) => void;
  
  // Currently selected journey
  selectedJourney: TrainJourney | null;
  setSelectedJourney: (journey: TrainJourney | null) => void;
  
  // User stats
  stats: JourneyStats;
  updateStats: (stats: Partial<JourneyStats>) => void;
  
  // Recent searches
  recentStations: string[];
  addRecentStation: (stationId: string) => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      savedJourneys: [],
      selectedJourney: null,
      recentStations: [],
      stats: {
        totalJourneys: 0,
        totalDistance: 0,
        totalDuration: 0,
        onTimePercentage: 100,
      },

      addJourney: (journey) => {
        set((state) => ({
          savedJourneys: [...state.savedJourneys.filter(j => j.id !== journey.id), journey],
        }));
      },

      removeJourney: (journeyId) => {
        set((state) => ({
          savedJourneys: state.savedJourneys.filter((j) => j.id !== journeyId),
        }));
      },

      updateJourney: (journeyId, updates) => {
        set((state) => ({
          savedJourneys: state.savedJourneys.map((j) =>
            j.id === journeyId ? { ...j, ...updates } : j
          ),
        }));
      },

      setSelectedJourney: (journey) => {
        set({ selectedJourney: journey });
      },

      updateStats: (stats) => {
        set((state) => ({
          stats: { ...state.stats, ...stats },
        }));
      },

      addRecentStation: (stationId) => {
        set((state) => ({
          recentStations: [
            stationId,
            ...state.recentStations.filter((id) => id !== stationId),
          ].slice(0, 10),
        }));
      },
    }),
    {
      name: STORAGE_KEYS.SAVED_JOURNEYS,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
