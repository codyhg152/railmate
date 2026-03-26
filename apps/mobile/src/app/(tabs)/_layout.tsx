/**
 * Tab navigation layout - Flighty-style
 * Main tabs: Flights, Airports, Profile
 */
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'rgba(0,0,0,0.95)',
          borderTopColor: '#1C1C1E',
          borderTopWidth: 1,
          height: 83,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerShown: false, // Hide header - we'll do custom in each screen
      }}
    >
      {/* Main screen - Combined map + list like Flighty */}
      <Tabs.Screen
        name="flights"
        options={{
          title: 'Journeys',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="train-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Airports/Stations - Airport info like Flighty */}
      <Tabs.Screen
        name="airports"
        options={{
          title: 'Airports',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* Profile/Stats - Travel stats like Flighty Passport */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
