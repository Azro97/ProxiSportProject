// src/navigation/BottomTabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Map, List, Trophy } from 'lucide-react-native';
import { BottomTabParamList } from '../types';
import CarteScreen from '../screens/carte/CarteScreen';
import MatchsScreen from '../screens/matchs/MatchsScreen';
import TournoiListScreen from '../screens/tournois/TournoiListScreen';
import ClassementsScreen from '../screens/classements/ClassementsScreen';
import { useColors } from '../hooks/useColors';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.textSecondary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: colors.borderHairline,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 0.5,
          fontWeight: '600',
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconProps = { color, size: size - 2, strokeWidth: 1.8 };
          if (route.name === 'Carte')       return <Map {...iconProps} />;
          if (route.name === 'Matchs')      return <List {...iconProps} />;
          if (route.name === 'Tournois')    return <Trophy {...iconProps} />;
          if (route.name === 'Classements') return <Trophy {...iconProps} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Carte" component={CarteScreen} options={{ title: 'Carte' }} />
      <Tab.Screen name="Matchs" component={MatchsScreen} options={{ title: 'Matchs' }} />
      <Tab.Screen name="Tournois" component={TournoiListScreen} options={{ title: 'Tournois' }} />
      <Tab.Screen name="Classements" component={ClassementsScreen} options={{ title: 'Classements' }} />
    </Tab.Navigator>
  );
}
