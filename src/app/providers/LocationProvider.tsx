// src/app/providers/LocationProvider.tsx
// Requests GPS permission once at app launch and writes to locationStore.
// If permission is denied, falls back to DEFAULT_LAT/LNG (Paris centroid).

import React, { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useLocationStore, DEFAULT_LAT, DEFAULT_LNG } from '../../stores/locationStore';

type Props = { children: React.ReactNode };

export default function LocationProvider({ children }: Props) {
  const { setLocation, setStatus } = useLocationStore();

  useEffect(() => {
    void requestLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestLocation() {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Accès à votre localisation',
            message:
              'Cette application utilise votre position pour afficher les terrains et matchs proches de vous.',
            buttonPositive: 'Autoriser',
            buttonNegative: 'Refuser',
          },
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          setStatus('denied');
          setLocation(DEFAULT_LAT, DEFAULT_LNG);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        pos => setLocation(pos.coords.latitude, pos.coords.longitude),
        () => {
          setStatus('denied');
          setLocation(DEFAULT_LAT, DEFAULT_LNG);
        },
        { enableHighAccuracy: false, timeout: 10000 },
      );
    } catch {
      setStatus('denied');
      setLocation(DEFAULT_LAT, DEFAULT_LNG);
    }
  }

  return <>{children}</>;
}
