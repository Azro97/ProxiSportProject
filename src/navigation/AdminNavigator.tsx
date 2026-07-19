// src/navigation/AdminNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../types';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminTournoiDetailScreen from '../screens/admin/AdminTournoiDetailScreen';
import AdminCreateTournoiScreen from '../screens/admin/AdminCreateTournoiScreen';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard"       component={AdminDashboardScreen} />
      <Stack.Screen name="AdminTournoiDetail"   component={AdminTournoiDetailScreen} />
      <Stack.Screen name="AdminCreateTournoi"   component={AdminCreateTournoiScreen} />
    </Stack.Navigator>
  );
}
