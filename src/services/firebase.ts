// src/services/firebase.ts
// Mock Firebase service — replace with real Firebase config when ready.

import { Match, Sport, Division } from '../types';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const REGIONS = ['Île-de-France', 'Occitanie', 'Auvergne-Rhône-Alpes', 'Bretagne', 'PACA'];

const DEPARTEMENTS: Record<string, string[]> = {
  'Île-de-France': ['Paris (75)', 'Seine-et-Marne (77)', 'Yvelines (78)', 'Essonne (91)', 'Hauts-de-Seine (92)'],
  'Occitanie': ['Hérault (34)', 'Haute-Garonne (31)', 'Gard (30)', 'Aude (11)'],
  'Auvergne-Rhône-Alpes': ['Rhône (69)', 'Isère (38)', 'Ain (01)', 'Savoie (73)'],
  'Bretagne': ['Finistère (29)', 'Ille-et-Vilaine (35)', 'Morbihan (56)', 'Côtes-d\'Armor (22)'],
  'PACA': ['Bouches-du-Rhône (13)', 'Var (83)', 'Alpes-Maritimes (06)'],
};

const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    sport: 'Football',
    region: 'Île-de-France',
    departement: 'Paris (75)',
    division: 'Nationale',
    dateHeure: new Date().toISOString(),
    domicile: 'Paris FC',
    exterieur: 'Red Star',
    lieu: 'Stade Charléty, Paris',
    statut: 'À venir',
  },
  {
    id: '2',
    sport: 'Football',
    region: 'Île-de-France',
    departement: 'Hauts-de-Seine (92)',
    division: 'Régionale',
    dateHeure: new Date().toISOString(),
    domicile: 'Antony FC',
    exterieur: 'Boulogne FC',
    scoreDomicile: 1,
    scoreExterieur: 2,
    lieu: 'Stade Antony',
    statut: 'Terminé',
  },
  {
    id: '3',
    sport: 'Basketball',
    region: 'Occitanie',
    departement: 'Hérault (34)',
    division: 'Nationale',
    dateHeure: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    domicile: 'Montpellier Basket',
    exterieur: 'Nîmes Basket',
    lieu: 'Palais des Sports, Montpellier',
    statut: 'À venir',
  },
  {
    id: '4',
    sport: 'Handball',
    region: 'Bretagne',
    departement: 'Finistère (29)',
    division: 'Départementale',
    dateHeure: new Date(Date.now() + 2 * 86400000).toISOString(),
    domicile: 'Brest HB',
    exterieur: 'Quimper HB',
    lieu: 'Gymnase Brest',
    statut: 'À venir',
  },
  {
    id: '5',
    sport: 'Rugby',
    region: 'Occitanie',
    departement: 'Haute-Garonne (31)',
    division: 'Régionale',
    dateHeure: new Date(Date.now() + 3 * 86400000).toISOString(),
    domicile: 'Toulouse XIII',
    exterieur: 'Carcassonne XIII',
    lieu: 'Ernest Wallon, Toulouse',
    statut: 'À venir',
  },
  {
    id: '6',
    sport: 'Volleyball',
    region: 'PACA',
    departement: 'Bouches-du-Rhône (13)',
    division: 'Nationale',
    dateHeure: new Date().toISOString(),
    domicile: 'Marseille VB',
    exterieur: 'Nice VB',
    lieu: 'Palais des Sports, Marseille',
    statut: 'En cours',
    scoreDomicile: 2,
    scoreExterieur: 1,
  },
];

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export function getRegions(): string[] {
  return REGIONS;
}

export function getDepartements(region: string): string[] {
  return DEPARTEMENTS[region] ?? [];
}

export function getMatchById(id: string): Match | undefined {
  return MOCK_MATCHES.find(m => m.id === id);
}

export function getMatches(filters: {
  sport?: Sport;
  region?: string;
  division?: Division;
  date?: string; // ISO date string (YYYY-MM-DD) or 'today'
}): Match[] {
  let results = [...MOCK_MATCHES];

  if (filters.sport) {
    results = results.filter(m => m.sport === filters.sport);
  }
  if (filters.region) {
    results = results.filter(m => m.region === filters.region);
  }
  if (filters.division) {
    results = results.filter(m => m.division === filters.division);
  }
  if (filters.date) {
    const today = new Date().toISOString().slice(0, 10);
    const targetDate = filters.date === 'today' ? today : filters.date;
    results = results.filter(m => {
      const matchDate = new Date(m.dateHeure as string).toISOString().slice(0, 10);
      return matchDate === targetDate;
    });
  }

  return results;
}
