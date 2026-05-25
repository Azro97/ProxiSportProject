// src/models/Filtre.ts

/** Specific competition levels — stored on each Match document. */
export type Division =
  | 'Nationale 1' | 'Nationale 2' | 'Nationale 3'
  | 'Régionale 1' | 'Régionale 2' | 'Régionale 3'
  | 'Départementale 1' | 'Départementale 2' | 'Départementale 3';

/** Top-level grouping label shown in the filter UI. */
export type DivisionGroupe = 'Nationale' | 'Régionale' | 'Départementale';

/** Maps each group to its three specific sub-levels. */
export const DIVISION_GROUPS: Record<DivisionGroupe, Division[]> = {
  'Nationale':      ['Nationale 1',     'Nationale 2',     'Nationale 3'],
  'Régionale':      ['Régionale 1',     'Régionale 2',     'Régionale 3'],
  'Départementale': ['Départementale 1','Départementale 2','Départementale 3'],
};

export const DIVISION_GROUPE_NAMES = Object.keys(DIVISION_GROUPS) as DivisionGroupe[];

export interface Filtre {
  sport: string | null;
  regions: string[];          // multi-select; empty = Tous
  departement: string | null;
  divisions: Division[];      // multi-select specific levels; empty = Tous
  date: Date | null;          // null = all dates (TOUS chip selected)
}
