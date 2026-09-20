// src/models/Filtre.ts

/** Specific competition levels — stored on each Match document. */
export type Division =
  | 'Nationale 1' | 'Nationale 2' | 'Nationale 3'
  | 'Régionale 1' | 'Régionale 2' | 'Régionale 3'
  | 'Départementale 1' | 'Départementale 2' | 'Départementale 3'
  | 'Juniors M21' | 'Excellence M18' | 'Honneur M18' | '4x4 M18';

/** Top-level grouping label shown in the filter UI. */
export type DivisionGroupe = 'Nationale' | 'Régionale' | 'Départementale' | 'Jeunes';

/** Maps each group to its specific sub-levels. "Jeunes" holds youth (M18/M21) categories
 *  separately from the senior Nationale/Régionale/Départementale ladder, since they're not
 *  comparable levels — a "Excellence M18" match shouldn't mix into an adult division filter. */
export const DIVISION_GROUPS: Record<DivisionGroupe, Division[]> = {
  'Nationale':      ['Nationale 1',     'Nationale 2',     'Nationale 3'],
  'Régionale':      ['Régionale 1',     'Régionale 2',     'Régionale 3'],
  'Départementale': ['Départementale 1','Départementale 2','Départementale 3'],
  'Jeunes':         ['Juniors M21', 'Excellence M18', 'Honneur M18', '4x4 M18'],
};

export const DIVISION_GROUPE_NAMES = Object.keys(DIVISION_GROUPS) as DivisionGroupe[];

export interface Filtre {
  sport: string | null;
  regions: string[];          // multi-select; empty = Tous
  departement: string | null;
  divisions: Division[];      // multi-select specific levels; empty = Tous
  date: Date | null;          // null = all dates (TOUS chip selected)
}
