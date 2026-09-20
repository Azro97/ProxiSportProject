// App.tsx

import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import RootNavigator from './src/navigation/RootNavigator';
import LocationProvider from './src/providers/LocationProvider';
import AuthProvider from './src/providers/AuthProvider';
import GpsIntroScreen from './src/screens/onboarding/GpsIntroScreen';

export default function App() {
  // null = still checking AsyncStorage (loading), false = show intro, true = show app
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('gpsIntroSeen').then(v => {
      setIntroSeen(v === 'true');
    });
  }, []);

  // While checking storage, render nothing (avoids flash)
  if (introSeen === null) return null;

  if (!introSeen) {
    return (
      <SafeAreaProvider>
        <GpsIntroScreen onDone={() => setIntroSeen(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <AuthProvider>
          <LocationProvider>
            <RootNavigator />
          </LocationProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
