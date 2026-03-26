/**
 * Passport Screen - Stats and achievements
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useJourneyStore } from '../../stores/journeyStore';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';

export default function PassportScreen() {
  const stats = useJourneyStore((state) => state.stats);
  const savedJourneys = useJourneyStore((state) => state.savedJourneys);

  // Calculate stats
  const totalDistance = savedJourneys.reduce((acc, j) => acc + (j.distance || 0), 0);
  const totalDuration = savedJourneys.reduce((acc, j) => {
    if (j.scheduledArrival && j.scheduledDeparture) {
      return acc + (new Date(j.scheduledArrival).getTime() - new Date(j.scheduledDeparture).getTime());
    }
    return acc;
  }, 0);

  const achievements = [
    {
      id: 'first',
      title: 'First Journey',
      description: 'Track your first train',
      icon: 'train-outline',
      unlocked: savedJourneys.length >= 1,
    },
    {
      id: 'traveler',
      title: 'Frequent Traveler',
      description: 'Track 10 journeys',
      icon: 'calendar-outline',
      unlocked: savedJourneys.length >= 10,
    },
    {
      id: 'explorer',
      title: 'Explorer',
      description: 'Visit 5 different stations',
      icon: 'map-outline',
      unlocked: new Set(savedJourneys.flatMap(j => [j.origin.id, j.destination.id])).size >= 5,
    },
    {
      id: 'punctual',
      title: 'On Time',
      description: '5 journeys without delays',
      icon: 'time-outline',
      unlocked: savedJourneys.filter(j => j.status === 'ON_TIME').length >= 5,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Passport</Text>
        <Text style={styles.subtitle}>Your travel statistics</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{savedJourneys.length}</Text>
          <Text style={styles.statLabel}>Journeys</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{Math.round(totalDistance / 1000)}</Text>
          <Text style={styles.statLabel}>km Traveled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {Math.round(totalDuration / (1000 * 60 * 60))}
          </Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {stats.onTimePercentage}%
          </Text>
          <Text style={styles.statLabel}>On Time</Text>
        </View>
      </View>

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsContainer}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.achievementCard,
              !achievement.unlocked && styles.achievementLocked,
            ]}
          >
            <View
              style={[
                styles.achievementIcon,
                achievement.unlocked && styles.achievementIconUnlocked,
              ]}
            >
              <Ionicons
                name={achievement.icon as any}
                size={24}
                color={achievement.unlocked ? COLORS.text : COLORS.textSecondary}
              />
            </View>
            <View style={styles.achievementInfo}>
              <Text
                style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.achievementTextLocked,
                ]}
              >
                {achievement.title}
              </Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
            </View>
            {achievement.unlocked && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={COLORS.success}
              />
            )}
          </View>
        ))}
      </View>

      {/* Favorite Routes */}
      <Text style={styles.sectionTitle}>Favorite Routes</Text>
      <View style={styles.routesContainer}>
        {savedJourneys.length === 0 ? (
          <View style={styles.emptyRoutes}>
            <Text style={styles.emptyText}>
              No routes yet. Start tracking journeys to see your favorites!
            </Text>
          </View>
        ) : (
          // Group by route and count
          Object.entries(
            savedJourneys.reduce((acc, j) => {
              const key = `${j.origin.name} → ${j.destination.name}`;
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([route, count]) => (
              <View key={route} style={styles.routeCard}>
                <Text style={styles.routeText}>{route}</Text>
                <View style={styles.routeBadge}>
                  <Text style={styles.routeCount}>{count}x</Text>
                </View>
              </View>
            ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
  subtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  achievementsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconUnlocked: {
    backgroundColor: COLORS.primary,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  achievementTextLocked: {
    color: COLORS.textSecondary,
  },
  achievementDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  routesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyRoutes: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  routeBadge: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  routeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
