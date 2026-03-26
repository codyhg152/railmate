/**
 * Home / My Trains screen
 * Shows saved journeys with beautiful train cards
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJourneyStore } from '../../stores/journeyStore';
import { TrainCard } from '../../components/TrainCard';
import { COLORS } from '../../lib/constants';
import { format } from 'date-fns';

export default function HomeScreen() {
  const router = useRouter();
  const savedJourneys = useJourneyStore((state) => state.savedJourneys);

  const handleAddJourney = () => {
    router.push('/search');
  };

  // Group journeys by date
  const today = new Date();
  const todaysJourneys = savedJourneys.filter((j) => {
    const depDate = new Date(j.scheduledDeparture);
    return (
      depDate.getDate() === today.getDate() &&
      depDate.getMonth() === today.getMonth() &&
      depDate.getFullYear() === today.getFullYear()
    );
  });

  const upcomingJourneys = savedJourneys.filter((j) => {
    const depDate = new Date(j.scheduledDeparture);
    return depDate > today && !todaysJourneys.includes(j);
  });

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Railmate</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddJourney}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Journeys */}
        {todaysJourneys.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>TODAY</Text>
            {todaysJourneys.map((journey) => (
              <TrainCard key={journey.id} journey={journey} />
            ))}
          </>
        )}

        {/* Upcoming Journeys */}
        {upcomingJourneys.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>UPCOMING</Text>
            {upcomingJourneys.map((journey) => (
              <TrainCard key={journey.id} journey={journey} />
            ))}
          </>
        )}

        {/* Empty State */}
        {savedJourneys.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="train-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No journeys yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to add your first train journey
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddJourney}
            >
              <Text style={styles.emptyButtonText}>Add Journey</Text>
            </TouchableOpacity>
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
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
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
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
