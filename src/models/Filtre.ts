// src/models/Filtre.ts

export type Division = 'Nationale' | 'Régionale' | 'Départementale';

export interface Filtre {
  sport: string | null;
  region: string | null;
  departement: string | null;
  division: Division | null;
  date: Date | null;
  jourSemaine: string | null;
}
