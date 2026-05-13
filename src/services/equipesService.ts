// src/services/equipesService.ts

import { Equipe } from '../models/Equipe';
import { MOCK_EQUIPES } from './mockData';

// TODO: set to false and configure google-services.json to use real Firestore
const USE_MOCK = __DEV__;

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
