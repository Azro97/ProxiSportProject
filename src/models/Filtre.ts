// src/models/Filtre.ts

export type Division = 'Nationale' | 'Régionale' | 'Départementale';

export interface Filtre {
  sport: string | null;
  regions: string[];          // multi-select
  departement: string | null;
  divisions: Division[];      // multi-select
  date: Date;                 // always set — defaults to today
}
