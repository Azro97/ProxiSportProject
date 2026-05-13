// src/stores/filtresStore.ts
// Cascading filter store for the Matchs screen.
// Rule: setting level N resets all levels > N. See CLAUDE.md §5 and §12.

import { create } from 'zustand';
import { Filtre, Division } from '../models/Filtre';

type FiltresStore = Filtre & {
  setSport: (s: string) => void;         // resets region, departement, division, date
  setRegion: (r: string, d?: string) => void; // resets division, date
  setDivision: (d: Division) => void;    // resets date
  setDate: (d: Date) => void;
  reset: () => void;
};

const initialState: Filtre = {
  sport: null,
  region: null,
  departement: null,
  division: null,
  date: null,
  jourSemaine: null,
};

export const useFiltresStore = create<FiltresStore>(set => ({
  ...initialState,

  setSport: sport =>
    set({ sport, region: null, departement: null, division: null, date: null, jourSemaine: null }),

  setRegion: (region, departement) =>
    set({ region, departement: departement ?? null, division: null, date: null, jourSemaine: null }),

  setDivision: division =>
    set({ division, date: null, jourSemaine: null }),

  setDate: date => set({ date }),

  reset: () => set(initialState),
}));
