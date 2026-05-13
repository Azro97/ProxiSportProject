// src/services/mockData.ts
// Development mock data. Used by all services when USE_MOCK is true.
// Replace with real Firestore data when google-services.json is configured.

import { Terrain } from '../models/Terrain';
import { Match } from '../models/Match';
import { Equipe } from '../models/Equipe';

export const MOCK_REGIONS = [
  'Île-de-France',
  'Occitanie',
  'Auvergne-Rhône-Alpes',
  'Bretagne',
  'PACA',
];

export const MOCK_DEPARTEMENTS: Record<string, string[]> = {
  'Île-de-France': ['Paris (75)', 'Seine-et-Marne (77)', 'Yvelines (78)', 'Essonne (91)', 'Hauts-de-Seine (92)'],
  'Occitanie': ['Hérault (34)', 'Haute-Garonne (31)', 'Gard (30)', 'Aude (11)'],
  'Auvergne-Rhône-Alpes': ['Rhône (69)', 'Isère (38)', 'Ain (01)', 'Savoie (73)'],
  'Bretagne': ['Finistère (29)', 'Ille-et-Vilaine (35)', 'Morbihan (56)', "Côtes-d'Armor (22)"],
  'PACA': ['Bouches-du-Rhône (13)', 'Var (83)', 'Alpes-Maritimes (06)'],
};

export const MOCK_TERRAINS: Terrain[] = [
  {
    id: 't1',
    nom: 'Stade Charléty',
    adresse: '17 Avenue Pierre de Coubertin',
    ville: 'Paris',
    lat: 48.8196,
    lng: 2.3453,
    sports: ['foot'],
  },
  {
    id: 't2',
    nom: 'Palais des Sports de Paris',
    adresse: '1 Pl. de la Porte de Versailles',
    ville: 'Paris',
    lat: 48.8320,
    lng: 2.2891,
    sports: ['basket', 'hand', 'volley'],
  },
  {
    id: 't3',
    nom: 'Gymnase Montpellier Sud',
    adresse: '10 Rue du Mas de Verchant',
    ville: 'Montpellier',
    lat: 43.5897,
    lng: 3.8897,
    sports: ['basket', 'hand'],
  },
  {
    id: 't4',
    nom: 'Stade du Roudourou',
    adresse: 'Rue du Stade',
    ville: 'Guingamp',
    lat: 48.5590,
    lng: -3.1558,
    sports: ['foot'],
  },
  {
    id: 't5',
    nom: 'Palais des Sports de Marseille',
    adresse: '23 Rue Nerthe',
    ville: 'Marseille',
    lat: 43.2850,
    lng: 5.3845,
    sports: ['volley', 'basket'],
  },
];

// Helper: create a Date relative to now
const d = (offsetDays: number, hour: number, min: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, min, 0, 0);
  return date;
};

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    sport: 'foot',
    equipeA_id: 'e1',
    equipeA_nom: 'Paris FC',
    equipeB_id: 'e2',
    equipeB_nom: 'Red Star',
    terrain_id: 't1',
    dateHeure: d(0, 20, 0),
    division: 'Nationale',
    region: 'Île-de-France',
    departement: 'Paris (75)',
  },
  {
    id: 'm2',
    sport: 'foot',
    equipeA_id: 'e3',
    equipeA_nom: 'Antony FC',
    equipeB_id: 'e4',
    equipeB_nom: 'Boulogne FC',
    terrain_id: 't1',
    dateHeure: d(0, 18, 0),
    division: 'Régionale',
    region: 'Île-de-France',
    departement: 'Hauts-de-Seine (92)',
  },
  {
    id: 'm3',
    sport: 'basket',
    equipeA_id: 'e5',
    equipeA_nom: 'Montpellier Basket',
    equipeB_id: 'e6',
    equipeB_nom: 'Nîmes Basket',
    terrain_id: 't3',
    dateHeure: d(1, 20, 30),
    division: 'Nationale',
    region: 'Occitanie',
    departement: 'Hérault (34)',
  },
  {
    id: 'm4',
    sport: 'hand',
    equipeA_id: 'e7',
    equipeA_nom: 'Brest HB',
    equipeB_id: 'e8',
    equipeB_nom: 'Quimper HB',
    terrain_id: 't4',
    dateHeure: d(2, 19, 0),
    division: 'Départementale',
    region: 'Bretagne',
    departement: 'Finistère (29)',
  },
  {
    id: 'm5',
    sport: 'volley',
    equipeA_id: 'e9',
    equipeA_nom: 'Marseille VB',
    equipeB_id: 'e10',
    equipeB_nom: 'Nice VB',
    terrain_id: 't5',
    dateHeure: d(0, 21, 0),
    division: 'Nationale',
    region: 'PACA',
    departement: 'Bouches-du-Rhône (13)',
  },
  {
    id: 'm6',
    sport: 'basket',
    equipeA_id: 'e11',
    equipeA_nom: 'Paris Basket',
    equipeB_id: 'e12',
    equipeB_nom: 'Lyon Basket',
    terrain_id: 't2',
    dateHeure: d(1, 19, 0),
    division: 'Nationale',
    region: 'Île-de-France',
    departement: 'Paris (75)',
  },
  {
    id: 'm7',
    sport: 'foot',
    equipeA_id: 'e13',
    equipeA_nom: 'Marseille FC',
    equipeB_id: 'e14',
    equipeB_nom: 'Toulon FC',
    terrain_id: 't5',
    dateHeure: d(3, 20, 0),
    division: 'Régionale',
    region: 'PACA',
    departement: 'Bouches-du-Rhône (13)',
  },
  {
    id: 'm8',
    sport: 'hand',
    equipeA_id: 'e15',
    equipeA_nom: 'Paris HB',
    equipeB_id: 'e16',
    equipeB_nom: 'Créteil HB',
    terrain_id: 't2',
    dateHeure: d(0, 20, 0),
    division: 'Régionale',
    region: 'Île-de-France',
    departement: 'Paris (75)',
  },
];

export const MOCK_EQUIPES: Equipe[] = [
  { id: 'e1', nom: 'Paris FC', sport: 'foot', region: 'Île-de-France', departement: 'Paris (75)' },
  { id: 'e2', nom: 'Red Star', sport: 'foot', region: 'Île-de-France', departement: 'Paris (75)' },
  { id: 'e3', nom: 'Antony FC', sport: 'foot', region: 'Île-de-France', departement: 'Hauts-de-Seine (92)' },
  { id: 'e4', nom: 'Boulogne FC', sport: 'foot', region: 'Île-de-France', departement: 'Hauts-de-Seine (92)' },
  { id: 'e5', nom: 'Montpellier Basket', sport: 'basket', region: 'Occitanie', departement: 'Hérault (34)' },
  { id: 'e6', nom: 'Nîmes Basket', sport: 'basket', region: 'Occitanie', departement: 'Gard (30)' },
  { id: 'e7', nom: 'Brest HB', sport: 'hand', region: 'Bretagne', departement: 'Finistère (29)' },
  { id: 'e8', nom: 'Quimper HB', sport: 'hand', region: 'Bretagne', departement: 'Finistère (29)' },
  { id: 'e9', nom: 'Marseille VB', sport: 'volley', region: 'PACA', departement: 'Bouches-du-Rhône (13)' },
  { id: 'e10', nom: 'Nice VB', sport: 'volley', region: 'PACA', departement: 'Alpes-Maritimes (06)' },
];
