// src/navigation/RootNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import BottomTabNavigator from './BottomTabNavigator';
import AdminNavigator from './AdminNavigator';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
import MatchDetailScreen from '../screens/matchDetail/MatchDetailScreen';
import TeamDetailScreen from '../screens/classements/TeamDetailScreen';
import TournoiDetailScreen from '../screens/tournois/TournoiDetailScreen';
import ClassementsScreen from '../screens/classements/ClassementsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs"          component={BottomTabNavigator} />
        <Stack.Screen name="MatchDetail"       component={MatchDetailScreen}   options={{ headerShown: false }} />
        <Stack.Screen name="TeamDetail"        component={TeamDetailScreen}     options={{ headerShown: false }} />
        <Stack.Screen name="TournoiDetail"     component={TournoiDetailScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="RechercheEquipes"  component={ClassementsScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="AdminLogin"        component={AdminLoginScreen}     options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="AdminMain"         component={AdminNavigator}       options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
