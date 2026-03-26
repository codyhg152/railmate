/**
 * Home / My Trains screen
 * Shows saved journeys with beautiful train cards and pull-to-refresh
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJourneyStore } from '../../stores/journeyStore';
import { TrainCard } from '../../components/TrainCard';
import { TrainCardSkeleton } from '../../components/SkeletonLoader';
import { NoJourneysEmptyState, ErrorEmptyState } from '../../components/EmptyState';
import { COLORS } from '../../lib/constants';
import { format, isToday, isFuture, isPast, startOfDay } from 'date-fns';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

export default function HomeScreen() {
  const router = useRouter();
  const savedJourneys = useJourneyStore((state) => state.savedJourneys);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAddJourney = () => {
    router.push('/search');
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, would refresh journey data
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  // Group journeys by date
  const today = new Date();
  const todaysJourneys = savedJourneys.filter((j) => {
    const depDate = new Date(j.scheduledDeparture);
    return isToday(depDate);
  });

  const upcomingJourneys = savedJourneys.filter((j) => {
    const depDate = new Date(j.scheduledDeparture);
    return isFuture(depDate) && !isToday(depDate);
  });

  const pastJourneys = savedJourneys.filter((j) => {
    const depDate = new Date(j.scheduledDeparture);
    return isPast(depDate) && !isToday(depDate);
  });

  // Active journeys (departed but not arrived)
  const activeJourneys = savedJourneys.filter((j) => 
    j.status === 'DEPARTED' || j.status === 'BOARDING'
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Railmate</Text>
        </View>
        <ScrollView style={styles.scrollView}>
          {[1, 2, 3].map((i) => (
            <TrainCardSkeleton key={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View>
          <Text style={styles.title}>Railmate</Text>
          <Text style={styles.subtitle}>
            {savedJourneys.length > 0 
              ? `${savedJourneys.length} journey${savedJourneys.length !== 1 ? 'ies' : 'y'} tracked`
              : 'Track your trains'
            }
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddJourney}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Active Journeys */}
        {activeJourneys.length > 0 && (
          <Animated.View entering={FadeInUp.delay(100)}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionTitle}>ACTIVE NOW</Text>
              </View>
            </View>
            {activeJourneys.map((journey, index) => (
              <TrainCard 
                key={journey.id} 
                journey={journey} 
                index={index}
              />
            ))}
          </Animated.View>
        )}

        {/* Today's Journeys */}
        {todaysJourneys.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={styles.sectionTitle}>TODAY</Text>
            {todaysJourneys.map((journey, index) => (
              <TrainCard 
                key={journey.id} 
                journey={journey} 
                index={index + activeJourneys.length}
              />
            ))}
          </Animated.View>
        )}

        {/* Upcoming Journeys */}
        {upcomingJourneys.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300)}>
            <Text style={styles.sectionTitle}>UPCOMING</Text>
            {upcomingJourneys.map((journey, index) => (
              <TrainCard 
                key={journey.id} 
                journey={journey}
                index={index + activeJourneys.length + todaysJourneys.length}
              />
            ))}
          </Animated.View>
        )}

        {/* Past Journeys */}
        {pastJourneys.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400)}>
            <Text style={styles.sectionTitle}>PAST</Text>
            {pastJourneys.slice(0, 3).map((journey, index) => (
              <TrainCard 
                key={journey.id} 
                journey={journey}
                showProgress={false}
                index={index + activeJourneys.length + todaysJourneys.length + upcomingJourneys.length}
              />
            ))}
          </Animated.View>
        )}

        {/* Empty State */}
        {savedJourneys.length === 0 && (
          <Animated.View entering={FadeInUp.delay(200)} style={styles.emptyContainer}>
            <NoJourneysEmptyState onAdd={handleAddJourney} />
          </Animated.View>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyContainer: {
    flex: 1,
    marginTop: 40,
  },
  bottomPadding: {
    height: 100,
  },
});
