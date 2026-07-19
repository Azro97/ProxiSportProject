// src/services/tournoiService.ts

import { Tournoi } from '../models/Tournoi';
import { Inscription } from '../models/Inscription';
import { MOCK_TOURNOIS, MOCK_INSCRIPTIONS } from './mock/mockData';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const USE_MOCK = true; // always mock for demo

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

/** Get all inscriptions for a given tournament */
export async function getInscriptionsByTournoi(tournoiId: string): Promise<Inscription[]> {
  if (USE_MOCK) {
    return MOCK_INSCRIPTIONS.filter(i => i.tournoi_id === tournoiId)
      .sort((a, b) => b.dateInscription.getTime() - a.dateInscription.getTime());
  }
  const firestore = (await import('@react-native-firebase/firestore')).default;
  const snap = await firestore()
    .collection('inscriptions')
    .where('tournoi_id', '==', tournoiId)
    .orderBy('dateInscription', 'desc')
    .get();
  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      ...d,
      id: doc.id,
      dateInscription: (d.dateInscription as FirebaseFirestoreTypes.Timestamp).toDate(),
    } as Inscription;
  });
}

/** Add a new tournament (mock: push in-memory; prod: write to Firestore) */
export async function createTournoi(data: Omit<Tournoi, 'id' | 'equipesInscrites'>): Promise<string> {
  if (USE_MOCK) {
    const id = 'to_' + Date.now();
    MOCK_TOURNOIS.push({ ...data, id, equipesInscrites: 0 });
    return id;
  }
  const firestore = (await import('@react-native-firebase/firestore')).default;
  const ref = await firestore().collection('tournois').add({
    ...data,
    equipesInscrites: 0,
    dateDebut: data.dateDebut,
    dateFin: data.dateFin,
    dateClotureInscription: data.dateClotureInscription,
  });
  return ref.id;
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

/** Register a team to a tournament (mock: push in-memory; prod: write to Firestore) */
export async function createInscription(data: {
  tournoi_id: string;
  equipe_nom: string;
  capitaine_email: string;
  membres: string[];
  montant_payé: number;
}): Promise<string> {
  if (USE_MOCK) {
    const id = 'ins_' + Date.now();
    MOCK_INSCRIPTIONS.push({
      id,
      tournoi_id: data.tournoi_id,
      equipe_id: 'eq_' + Date.now(),
      equipe_nom: data.equipe_nom,
      capitaine_uid: 'user_mock',
      capitaine_email: data.capitaine_email,
      membres: data.membres,
      dateInscription: new Date(),
      statut: 'confirmée',
      montant_payé: data.montant_payé,
    });
    // increment equipesInscrites on the tournament
    const t = MOCK_TOURNOIS.find(t => t.id === data.tournoi_id);
    if (t) t.equipesInscrites = (t.equipesInscrites ?? 0) + 1;
    return id;
  }
  const firestore = (await import('@react-native-firebase/firestore')).default;
  const ref = await firestore().collection('inscriptions').add({
    ...data,
    capitaine_uid: 'user_mock',
    equipe_id: 'eq_' + Date.now(),
    dateInscription: new Date(),
    statut: 'confirmée',
  });
  return ref.id;
}
