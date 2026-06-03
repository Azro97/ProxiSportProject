// src/services/terrainsService.ts

import { Terrain } from '../models/Terrain';
import { haversineDistance } from '../utils/geo';
import { MOCK_TERRAINS } from './mock/mockData';

// TODO: set to false and configure google-services.json to use real Firestore
const USE_MOCK = __DEV__;

export async function getTerrainsByLocation(
  lat: number,
  lng: number,
  rayonKm: number,
): Promise<Terrain[]> {
  let all: Terrain[];

  if (USE_MOCK) {
    all = MOCK_TERRAINS;
  } else {
    const firestore = (await import('@react-native-firebase/firestore')).default;
    const snapshot = await firestore().collection('terrains').get();
    all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Terrain));
  }

  // Geographic radius filter is client-side (Haversine) — see CLAUDE.md §6
  return all.filter(t => haversineDistance(lat, lng, t.lat, t.lng) <= rayonKm);
}

export async function getTerrainById(id: string): Promise<Terrain | null> {
  if (USE_MOCK) {
    return MOCK_TERRAINS.find(t => t.id === id) ?? null;
  }

  const firestore = (await import('@react-native-firebase/firestore')).default;
  const doc = await firestore().collection('terrains').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Terrain;
}
