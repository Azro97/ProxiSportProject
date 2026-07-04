// src/services/matchsService.ts

import { Match } from '../models/Match';
import { Filtre } from '../models/Filtre';
import { startOfDay, endOfDay, isSameDay } from '../utils/date';
import { MOCK_MATCHES, MOCK_REGIONS, MOCK_DEPARTEMENTS, getFreshMockMatches } from './mock/mockData';
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

  if (filtres.sport)               query = query.where('sport', '==', filtres.sport);
  if (filtres.regions.length > 0)  query = query.where('region', 'in', filtres.regions);
  if (filtres.departement)         query = query.where('departement', '==', filtres.departement);
  if (filtres.divisions.length > 0) query = query.where('division', 'in', filtres.divisions);
  // date null = all dates; otherwise filter by day range
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
  let results = getFreshMockMatches();
  if (filtres.sport)               results = results.filter(m => m.sport === filtres.sport);
  if (filtres.regions.length > 0)  results = results.filter(m => filtres.regions.includes(m.region));
  if (filtres.departement)         results = results.filter(m => m.departement === filtres.departement);
  if (filtres.divisions.length > 0) results = results.filter(m => filtres.divisions.includes(m.division as any));
  // date null = all dates
  if (filtres.date) results = results.filter(m => isSameDay(m.dateHeure, filtres.date!));
  return results;
}

export async function getMatchsByTerrain(terrainId: string): Promise<Match[]> {
  if (USE_MOCK) {
    return getFreshMockMatches()
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

/** Returns the set of terrain IDs that have at least one match for the given sport. */
export async function getTerrainIdsForSport(sport: string): Promise<Set<string>> {
  if (USE_MOCK) {
    const ids = getFreshMockMatches()
      .filter(m => m.sport === sport)
      .map(m => m.terrain_id);
    return new Set(ids);
  }

  const firestore = (await import('@react-native-firebase/firestore')).default;
  const snapshot = await firestore()
    .collection('matchs')
    .where('sport', '==', sport)
    .get();
  return new Set(snapshot.docs.map(doc => doc.data().terrain_id as string));
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

/**
 * All matches (past + upcoming) involving a given team, sorted newest first.
 * Firestore runs two queries (equipeA_id / equipeB_id) and merges.
 */
export async function getMatchsByEquipe(equipeId: string): Promise<Match[]> {
  if (USE_MOCK) {
    return getFreshMockMatches()
      .filter(m => m.equipeA_id === equipeId || m.equipeB_id === equipeId)
      .sort((a, b) => b.dateHeure.getTime() - a.dateHeure.getTime());
  }

  const firestore = (await import('@react-native-firebase/firestore')).default;
  const [snapA, snapB] = await Promise.all([
    firestore().collection('matchs').where('equipeA_id', '==', equipeId).get(),
    firestore().collection('matchs').where('equipeB_id', '==', equipeId).get(),
  ]);

  const toMatch = (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot): Match => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dateHeure: (data.dateHeure as FirebaseFirestoreTypes.Timestamp).toDate(),
    } as Match;
  };

  const seen = new Set<string>();
  const matches: Match[] = [];
  for (const doc of [...snapA.docs, ...snapB.docs]) {
    if (!seen.has(doc.id)) {
      seen.add(doc.id);
      matches.push(toMatch(doc));
    }
  }
  return matches.sort((a, b) => b.dateHeure.getTime() - a.dateHeure.getTime());
}

/**
 * Past (played) matches, sorted most recent first.
 * Both sport and equipeId are optional — omit to get all results.
 */
export async function getMatchsJoues(sport?: string, equipeId?: string): Promise<Match[]> {
  const now = new Date();
  if (USE_MOCK) {
    let results = getFreshMockMatches().filter(m => m.dateHeure < now);
    if (sport)    results = results.filter(m => m.sport === sport);
    if (equipeId) results = results.filter(m => m.equipeA_id === equipeId || m.equipeB_id === equipeId);
    return results.sort((a, b) => b.dateHeure.getTime() - a.dateHeure.getTime());
  }

  const firestore = (await import('@react-native-firebase/firestore')).default;
  type FSQuery = FirebaseFirestoreTypes.Query<FirebaseFirestoreTypes.DocumentData>;
  let query: FSQuery = firestore().collection('matchs') as FSQuery;
  query = query.where('dateHeure', '<', firestore.Timestamp.fromDate(now));
  if (sport) query = query.where('sport', '==', sport);
  const snapshot = await query.orderBy('dateHeure', 'desc').get();
  const all = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      dateHeure: (data.dateHeure as FirebaseFirestoreTypes.Timestamp).toDate(),
    } as Match;
  });
  if (!equipeId) return all;
  return all.filter(m => m.equipeA_id === equipeId || m.equipeB_id === equipeId);
}
