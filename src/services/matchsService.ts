// src/services/matchsService.ts

import { Match } from '../models/Match';
import { Filtre } from '../models/Filtre';
import { startOfDay, endOfDay, isSameDay } from '../utils/date';
import { MOCK_MATCHES, MOCK_REGIONS, MOCK_DEPARTEMENTS } from './mockData';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// TODO: set to false and configure google-services.json to use real Firestore
const USE_MOCK = __DEV__;

/**
 * Fetch matches from Firestore applying filters in priority order:
 * sport → region/departement → division → date range.
 * All 4 filters must be set before this is called (enforced by the store cascade).
 */
export async function getMatchs(filtres: Filtre): Promise<Match[]> {
  if (USE_MOCK) {
    return filterMockMatchs(filtres);
  }

  const firestoreModule = await import('@react-native-firebase/firestore');
  const firestore = firestoreModule.default;

  type FSQuery = FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>;

  let query: FSQuery = firestore().collection('matchs') as FSQuery;

  if (filtres.sport)       query = query.where('sport', '==', filtres.sport);
  if (filtres.region)      query = query.where('region', '==', filtres.region);
  if (filtres.departement) query = query.where('departement', '==', filtres.departement);
  if (filtres.division)    query = query.where('division', '==', filtres.division);
  if (filtres.date) {
    const start = startOfDay(filtres.date);
    const end = endOfDay(filtres.date);
    query = query
      .where('dateHeure', '>=', firestore.Timestamp.fromDate(start))
      .where('dateHeure', '<=', firestore.Timestamp.fromDate(end));
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dateHeure: (data.dateHeure as FirebaseFirestoreTypes.Timestamp).toDate(),
    } as Match;
  });
}

function filterMockMatchs(filtres: Filtre): Match[] {
  let results = [...MOCK_MATCHES];
  if (filtres.sport)       results = results.filter(m => m.sport === filtres.sport);
  if (filtres.region)      results = results.filter(m => m.region === filtres.region);
  if (filtres.departement) results = results.filter(m => m.departement === filtres.departement);
  if (filtres.division)    results = results.filter(m => m.division === filtres.division);
  if (filtres.date)        results = results.filter(m => isSameDay(m.dateHeure, filtres.date!));
  return results;
}

export async function getMatchsByTerrain(terrainId: string): Promise<Match[]> {
  if (USE_MOCK) {
    return MOCK_MATCHES
      .filter(m => m.terrain_id === terrainId)
      .sort((a, b) => a.dateHeure.getTime() - b.dateHeure.getTime());
  }

  const firestore = (await import('@react-native-firebase/firestore')).default;
  const snapshot = await firestore()
    .collection('matchs')
    .where('terrain_id', '==', terrainId)
    .orderBy('dateHeure', 'asc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dateHeure: (data.dateHeure as { toDate: () => Date }).toDate(),
    } as Match;
  });
}

export async function getMatchById(id: string): Promise<Match | null> {
  if (USE_MOCK) {
    return MOCK_MATCHES.find(m => m.id === id) ?? null;
  }

  const firestore = (await import('@react-native-firebase/firestore')).default;
  const doc = await firestore().collection('matchs').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    ...data,
    id: doc.id,
    dateHeure: (data.dateHeure as { toDate: () => Date }).toDate(),
  } as Match;
}

export function grouperParDivision(matchs: Match[]): Record<string, Match[]> {
  return matchs.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.division;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});
}

export function grouperParDate(matchs: Match[]): Record<string, Match[]> {
  return matchs.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.dateHeure.toLocaleDateString('fr-FR');
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});
}

/** Returns the list of available regions. */
export function getRegions(): string[] {
  // TODO: fetch distinct values from Firestore when USE_MOCK is false
  return MOCK_REGIONS;
}

/** Returns the list of departements for a given region. */
export function getDepartements(region: string): string[] {
  return MOCK_DEPARTEMENTS[region] ?? [];
}
