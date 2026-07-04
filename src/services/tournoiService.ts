// src/services/tournoiService.ts

import { Tournoi } from '../models/Tournoi';
import { MOCK_TOURNOIS } from './mock/mockData';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const USE_MOCK = __DEV__;

export async function getTournois(sport?: string | null, region?: string | null): Promise<Tournoi[]> {
  if (USE_MOCK) {
    let list = [...MOCK_TOURNOIS];
    if (sport)  list = list.filter(t => t.sport === sport);
    if (region) list = list.filter(t => t.region === region);
    return list.sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime());
  }
  const firestore = (await import('@react-native-firebase/firestore')).default;
  const snap = await firestore().collection('tournois').orderBy('dateDebut', 'asc').get();
  return snap.docs.map(doc => toTournoi(doc));
}

export async function getTournoiById(id: string): Promise<Tournoi | null> {
  if (USE_MOCK) return MOCK_TOURNOIS.find(t => t.id === id) ?? null;
  const firestore = (await import('@react-native-firebase/firestore')).default;
  const doc = await firestore().collection('tournois').doc(id).get();
  if (!doc.exists) return null;
  return toTournoi(doc as FirebaseFirestoreTypes.QueryDocumentSnapshot);
}

function toTournoi(doc: FirebaseFirestoreTypes.QueryDocumentSnapshot): Tournoi {
  const d = doc.data();
  return {
    ...d,
    id: doc.id,
    dateDebut: (d.dateDebut as FirebaseFirestoreTypes.Timestamp).toDate(),
    dateFin: (d.dateFin as FirebaseFirestoreTypes.Timestamp).toDate(),
    dateClotureInscription: (d.dateClotureInscription as FirebaseFirestoreTypes.Timestamp).toDate(),
  } as Tournoi;
}

/** Format price from centimes to readable string — ex: 3000 → "30,00 €" */
export function formatPrix(centimes: number): string {
  if (centimes === 0) return 'Gratuit';
  return (centimes / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
