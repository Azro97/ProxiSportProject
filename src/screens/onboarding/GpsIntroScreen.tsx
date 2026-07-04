// src/screens/onboarding/GpsIntroScreen.tsx
// Shown on first launch only. Asks for GPS permission before the OS dialog fires.
// Persists 'gpsIntroSeen' in AsyncStorage so it never appears again.

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import { MapPin } from 'lucide-react-native';
import { useColors } from '../../hooks/useColors';
import { useLocationStore } from '../../stores/locationStore';

interface Props {
  onDone: () => void;
}

export default function GpsIntroScreen({ onDone }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setLocation, setStatus } = useLocationStore();

  const ringScale   = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 1.8, duration: 1600, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0,   duration: 1600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  async function markSeen() {
    await AsyncStorage.setItem('gpsIntroSeen', 'true');
    onDone();
  }

  async function handleAllow() {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Accès à votre position',
            message:
              'ProxiSport utilise votre position pour afficher les terrains, matchs et tournois autour de vous.',
            buttonPositive: 'Autoriser',
            buttonNegative: 'Refuser',
          }
        );
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          Geolocation.getCurrentPosition(
            pos => setLocation(pos.coords.latitude, pos.coords.longitude),
            () => setStatus('denied'),
            { enableHighAccuracy: false, timeout: 10000 }
          );
        } else {
          setStatus('denied');
        }
      }
    } catch {
      setStatus('denied');
    } finally {
      await markSeen();
    }
  }

  return (
    <View style={[
      styles.root,
      {
        backgroundColor: colors.bgApp,
        paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 24,
      },
    ]}>

      {/* ── Animated GPS dot ─────────────────────────────────────── */}
      <View style={styles.graphic}>
        <Animated.View style={[
          styles.ring,
          {
            borderColor: colors.userPosition,
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
          },
        ]} />
        <View style={[styles.dot, { backgroundColor: colors.userPosition }]}>
          <MapPin size={30} color="#fff" strokeWidth={2.5} />
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* ── Copy ─────────────────────────────────────────────────── */}
      <Text style={[styles.eyebrow, { color: colors.userPosition }]}>PROXISPORT</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Autour{'\n'}de vous
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Activez la localisation pour découvrir les terrains, matchs et tournois près de chez vous.
      </Text>

      {/* ── Buttons ──────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.btnPrimary, { backgroundColor: colors.textPrimary }]}
        onPress={handleAllow}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnPrimaryText, { color: colors.textInvert }]}>
          Autoriser la localisation
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={markSeen}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnSecondaryText, { color: colors.textTertiary }]}>
          Passer pour l'instant
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 28,
  },
  graphic: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 210,
    marginTop: 16,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
  },
  dot: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  title: {
    fontSize: 50,
    fontWeight: '900',
    lineHeight: 54,
    letterSpacing: 0.3,
    marginBottom: 18,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 36,
  },
  btnPrimary: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnSecondary: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 14,
  },
});
