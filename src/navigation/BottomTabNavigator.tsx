// src/navigation/BottomTabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { BottomTabParamList } from '../types';
import CarteScreen from '../screens/carte/CarteScreen';
import MatchsScreen from '../screens/matchs/MatchsScreen';
import ClassementsScreen from '../screens/ClassementsScreen';
import { theme } from '../theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Carte: '🗺️',
            Matchs: '⚽',
            Classements: '🏆',
          };
          return <Text style={{ fontSize: size - 2 }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Carte" component={CarteScreen} options={{ title: 'Carte' }} />
      <Tab.Screen name="Matchs" component={MatchsScreen} options={{ title: 'Matchs' }} />
      <Tab.Screen name="Classements" component={ClassementsScreen} options={{ title: 'Classements' }} />
    </Tab.Navigator>
  );
}
