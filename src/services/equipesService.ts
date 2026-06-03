// src/services/equipesService.ts

import { Equipe } from '../models/Equipe';
import { MOCK_EQUIPES } from './mock/mockData';

// TODO: set to false and configure google-services.json to use real Firestore
const USE_MOCK = __DEV__;

// Session-level cache — Firestore is only read once per app launch
let _equipesCache: Equipe[] | null = null;

export async function getAllEquipes(): Promise<Equipe[]> {
  if (_equipesCache) return _equipesCache;
  if (USE_MOCK) {
    _equipesCache = [...MOCK_EQUIPES];
    return _equipesCache;
  }
  const firestore = (await import('@react-native-firebase/firestore')).default;
  const snapshot = await firestore().collection('equipes').get();
  _equipesCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipe));
  return _equipesCache;
}

export async function getEquipeById(id: string): Promise<Equipe | null> {
  if (USE_MOCK) {
    return MOCK_EQUIPES.find(e => e.id === id) ?? null;
  }

  const firestore = (await import('@react-native-firebase/firestore')).default;
  const doc = await firestore().collection('equipes').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Equipe;
}

export async function getEquipesBySport(sport: string): Promise<Equipe[]> {
  if (USE_MOCK) {
    return MOCK_EQUIPES.filter(e => e.sport === sport);
  }

  const firestore = (await import('@react-native-firebase/firestore')).default;
  const snapshot = await firestore()
    .collection('equipes')
    .where('sport', '==', sport)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipe));
}

/**
 * Search equipes by name, region or departement (case-insensitive, substring).
 * Falls back to full client-side filter on Firestore (no full-text index needed for v1).
 */
export async function searchEquipes(query: string): Promise<Equipe[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (USE_MOCK) {
    return MOCK_EQUIPES.filter(
      e =>
        e.nom.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q) ||
        e.departement.toLowerCase().includes(q),
    );
  }

  // Firestore has no full-text search — fetch all and filter client-side
  const firestore = (await import('@react-native-firebase/firestore')).default;
  const snapshot = await firestore().collection('equipes').get();
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Equipe))
    .filter(
      e =>
        e.nom.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q) ||
        e.departement.toLowerCase().includes(q),
    );
}
