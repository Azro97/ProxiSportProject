// src/navigation/BottomTabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, List, Trophy } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabParamList } from '../types';
import CarteScreen from '../screens/carte/CarteScreen';
import MatchsScreen from '../screens/matchs/MatchsScreen';
import TournoiListScreen from '../screens/tournois/TournoiListScreen';
import { useColors } from '../hooks/useColors';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          height: 54 + (insets.bottom > 0 ? insets.bottom : 0),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 0.4,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconProps = { color, size: size - 2, strokeWidth: 1.8 };
          if (route.name === 'Carte')    return <Map {...iconProps} />;
          if (route.name === 'Matchs')   return <List {...iconProps} />;
          if (route.name === 'Tournois') return <Trophy {...iconProps} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Carte" component={CarteScreen} options={{ title: 'Carte' }} />
      <Tab.Screen name="Matchs" component={MatchsScreen} options={{ title: 'Matchs' }} />
      <Tab.Screen name="Tournois" component={TournoiListScreen} options={{ title: 'Tournois' }} />
    </Tab.Navigator>
  );
}
