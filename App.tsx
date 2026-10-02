// App.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as Sentry from '@sentry/react-native';
// captureConsoleIntegration lives in @sentry/core, not re-exported from the
// react-native package's own top-level index in this SDK version.
import { captureConsoleIntegration } from '@sentry/core';
import { STRIPE_PUBLISHABLE_KEY, SENTRY_DSN } from '@env';
import RootNavigator from './src/navigation/RootNavigator';
import LocationProvider from './src/providers/LocationProvider';
import AuthProvider from './src/providers/AuthProvider';
import GpsIntroScreen from './src/screens/onboarding/GpsIntroScreen';

// Runs once at module load, before the component tree renders. If SENTRY_DSN
// is still the .env.example placeholder, Sentry just no-ops/warns locally —
// it does not throw or block the app. See CLAUDE.md's "Error monitoring
// (Sentry)" section for setup and the full list of what this does and doesn't
// cover yet (native symbol upload is NOT configured — see that section).
Sentry.init({
  dsn: SENTRY_DSN,
  // Forwards every console.error() we already log throughout the app (see
  // the 2026-10-02 error-logging pass in every screen's catch block) to
  // Sentry automatically, with zero further per-file changes needed.
  integrations: [captureConsoleIntegration({ levels: ['error'] })],
  tracesSampleRate: 0, // no performance/transaction tracing — errors only, by design
});

// Deliberately dependency-light: no theme store, no shared components, no
// hooks. This is the last-resort screen when something else in the tree has
// already crashed, so it must not itself depend on anything that could also
// be broken.
function ErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <View style={fallbackStyles.root}>
      <Text style={fallbackStyles.title}>Une erreur inattendue est survenue</Text>
      <Text style={fallbackStyles.body}>
        L'application a rencontré un problème et a été signalée automatiquement. Réessayez.
      </Text>
      <TouchableOpacity style={fallbackStyles.button} onPress={resetError} activeOpacity={0.85}>
        <Text style={fallbackStyles.buttonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const fallbackStyles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#ffffff' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  body: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: '#6366f1' },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});

function App() {
  // null = still checking AsyncStorage (loading), false = show intro, true = show app
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('gpsIntroSeen').then(v => {
      setIntroSeen(v === 'true');
    });
  }, []);

  // While checking storage, render nothing (avoids flash)
  if (introSeen === null) return null;

  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <SafeAreaProvider>
        {!introSeen ? (
          <GpsIntroScreen onDone={() => setIntroSeen(true)} />
        ) : (
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <AuthProvider>
              <LocationProvider>
                <RootNavigator />
              </LocationProvider>
            </AuthProvider>
          </StripeProvider>
        )}
      </SafeAreaProvider>
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(App);
