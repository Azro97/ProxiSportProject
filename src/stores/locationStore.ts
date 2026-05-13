// src/stores/locationStore.ts
// Holds GPS coordinates set once at app launch via LocationProvider.
// Both CarteScreen and MatchsScreen read from this store.

import { create } from 'zustand';

type LocationStatus = 'idle' | 'granted' | 'denied';

type LocationStore = {
  lat: number | null;
  lng: number | null;
  status: LocationStatus;
  setLocation: (lat: number, lng: number) => void;
  setStatus: (status: LocationStatus) => void;
};

// Fallback when GPS is denied — Paris centroid
export const DEFAULT_LAT = 48.8566;
export const DEFAULT_LNG = 2.3522;

export const useLocationStore = create<LocationStore>(set => ({
  lat: null,
  lng: null,
  status: 'idle',
  setLocation: (lat, lng) => set({ lat, lng, status: 'granted' }),
  setStatus: status => set({ status }),
}));
