/**
 * Passport Screen - Stats and achievements
 * Flighty-inspired design with beautiful stats cards
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useJourneyStore } from '../../stores/journeyStore';
import { COLORS } from '../../lib/constants';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

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

  const onTimeJourneys = savedJourneys.filter(j => j.status === 'ON_TIME' || j.status === 'ARRIVED').length;
  const delayedJourneys = savedJourneys.filter(j => j.status === 'DELAYED').length;
  const uniqueStations = new Set(savedJourneys.flatMap(j => [j.origin.id, j.destination.id])).size;

  const achievements: Achievement[] = [
    {
      id: 'first',
      title: 'First Journey',
      description: 'Track your first train',
      icon: 'train-outline',
      unlocked: savedJourneys.length >= 1,
      progress: Math.min(savedJourneys.length, 1),
      maxProgress: 1,
    },
    {
      id: 'traveler',
      title: 'Frequent Traveler',
      description: 'Track 10 journeys',
      icon: 'calendar-outline',
      unlocked: savedJourneys.length >= 10,
      progress: savedJourneys.length,
      maxProgress: 10,
    },
    {
      id: 'explorer',
      title: 'Explorer',
      description: 'Visit 10 different stations',
      icon: 'map-outline',
      unlocked: uniqueStations >= 10,
      progress: uniqueStations,
      maxProgress: 10,
    },
    {
      id: 'punctual',
      title: 'On Time',
      description: '10 journeys without delays',
      icon: 'time-outline',
      unlocked: onTimeJourneys >= 10,
      progress: onTimeJourneys,
      maxProgress: 10,
    },
    {
      id: 'distance',
      title: 'Long Distance',
      description: 'Travel 1000 km total',
      icon: 'speedometer-outline',
      unlocked: totalDistance >= 1000000,
      progress: Math.round(totalDistance / 1000),
      maxProgress: 1000,
    },
    {
      id: 'veteran',
      title: 'Train Veteran',
      description: 'Track 50 journeys',
      icon: 'ribbon-outline',
      unlocked: savedJourneys.length >= 50,
      progress: savedJourneys.length,
      maxProgress: 50,
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View>
          <Text style={styles.title}>Passport</Text>
          <Text style={styles.subtitle}>Your travel statistics</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Level {Math.floor(savedJourneys.length / 10) + 1}</Text>
        </View>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View entering={FadeInUp.delay(100)} style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(0,122,255,0.15)' }]}>
            <Ionicons name="train" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>{savedJourneys.length}</Text>
          <Text style={styles.statLabel}>Journeys</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
            <Ionicons name="navigate" size={24} color={COLORS.success} />
          </View>
          <Text style={styles.statNumber}>{Math.round(totalDistance / 1000)}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(255,149,0,0.15)' }]}>
            <Ionicons name="time" size={24} color={COLORS.warning} />
          </View>
          <Text style={styles.statNumber}>
            {Math.round(totalDuration / (1000 * 60 * 60))}
          </Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(90,200,250,0.15)' }]}>
            <Ionicons name="location" size={24} color={COLORS.info} />
          </View>
          <Text style={styles.statNumber}>{uniqueStations}</Text>
          <Text style={styles.statLabel}>Stations</Text>
        </View>
      </Animated.View>

      {/* Performance Stats */}
      <Animated.View entering={FadeInUp.delay(200)} style={styles.performanceCard}>
        <Text style={styles.sectionTitle}>Performance</Text>
        
        <View style={styles.performanceRow}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>
              {savedJourneys.length > 0 
                ? Math.round((onTimeJourneys / savedJourneys.length) * 100) 
                : 100}%
            </Text>
            <Text style={styles.performanceLabel}>On Time</Text>
          </View>
          
          <View style={styles.performanceDivider} />
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>{delayedJourneys}</Text>
            <Text style={styles.performanceLabel}>Delayed</Text>
          </View>
          
          <View style={styles.performanceDivider} />
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceValue}>
              {savedJourneys.length > 0
                ? Math.round(totalDistance / savedJourneys.length / 1000)
                : 0}
            </Text>
            <Text style={styles.performanceLabel}>Avg km</Text>
          </View>
        </View>
      </Animated.View>

      {/* Achievements */}
      <Animated.View entering={FadeInUp.delay(300)}>
        <View style={styles.achievementsHeader}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.achievementsProgress}>
            {unlockedCount}/{achievements.length} Unlocked
          </Text>
        </View>
        
        <View style={styles.achievementsContainer}>
          {achievements.map((achievement, index) => (
            <Animated.View 
              key={achievement.id}
              entering={FadeInUp.delay(400 + index * 50)}
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
                
                {/* Progress bar */}
                {achievement.progress !== undefined && achievement.maxProgress && (
                  <View style={styles.achievementProgressContainer}>
                    <View style={styles.achievementProgressBar}>
                      <View 
                        style={[
                          styles.achievementProgressFill,
                          { 
                            width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%`,
                            backgroundColor: achievement.unlocked ? COLORS.success : COLORS.primary,
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.achievementProgressText}>
                      {achievement.progress}/{achievement.maxProgress}
                    </Text>
                  </View>
                )}
              </View>
              
              {achievement.unlocked && (
                <View style={styles.unlockedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
              )}
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Favorite Routes */}
      <Animated.View entering={FadeInUp.delay(600)}>
        <Text style={styles.sectionTitle}>Favorite Routes</Text>
        <View style={styles.routesContainer}>
          {savedJourneys.length === 0 ? (
            <View style={styles.emptyRoutes}>
              <Ionicons name="map-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No routes yet</Text>
              <Text style={styles.emptyText}>
                Start tracking journeys to see your favorites!
              </Text>
            </View>
          ) : (
            Object.entries(
              savedJourneys.reduce((acc, j) => {
                const key = `${j.origin.name} → ${j.destination.name}`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([route, count], index) => (
                <Animated.View 
                  key={route}
                  entering={FadeInUp.delay(700 + index * 50)}
                  style={styles.routeCard}
                >
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeText}>{route}</Text>
                    <View style={styles.routeMeta}>
                      <Ionicons name="repeat" size={14} color={COLORS.textTertiary} />
                      <Text style={styles.routeMetaText}>{count} trips</Text>
                    </View>
                  </View>
                  <View style={styles.routeBadge}>
                    <Text style={styles.routeCount}>{count}x</Text>
                  </View>
                </Animated.View>
              ))
          )}
        </View>
      </Animated.View>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
    fontSize: 17,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  levelBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 40) / 2 - 4,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  performanceCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  performanceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  performanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },
  achievementsProgress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  achievementLocked: {
    opacity: 0.7,
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
    fontWeight: '700',
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
  achievementProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  achievementProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2C2C2E',
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  unlockedBadge: {
    marginLeft: 8,
  },
  routesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyRoutes: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  routeMetaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  routeBadge: {
    backgroundColor: 'rgba(0,122,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  routeCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bottomPadding: {
    height: 40,
  },
});
