// src/navigation/BottomTabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../types';
import MatchesScreen from '../screens/MatchesScreen';
import ClassementsScreen from '../screens/ClassementsScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#E63946',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
        headerShown: false,
      }}>
      <Tab.Screen
        name="Matchs"
        component={MatchesScreen}
        options={{ title: 'Matchs' }}
      />
      <Tab.Screen
        name="Classements"
        component={ClassementsScreen}
        options={{ title: 'Classements' }}
      />
    </Tab.Navigator>
  );
}
