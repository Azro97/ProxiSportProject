// src/stores/filtresStore.ts
// Multi-select filter store for the Matchs screen.
// Rule: setting Sport resets regions + divisions. Toggling regions resets divisions.
// Date defaults to today and is always set. See CLAUDE.md §5.

import { create } from 'zustand';
import { Filtre, Division } from '../models/Filtre';

type FiltresStore = Filtre & {
  setSport: (s: string) => void;          // resets regions, divisions, date→today
  toggleRegion: (r: string) => void;      // adds/removes region, resets divisions
  toggleDivision: (d: Division) => void;  // adds/removes division
  setDate: (d: Date) => void;
  reset: () => void;
};

const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const initialState: Filtre = {
  sport: null,
  regions: [],
  departement: null,
  divisions: [],
  date: today(),
};

export const useFiltresStore = create<FiltresStore>(set => ({
  ...initialState,

  setSport: sport =>
    set({ sport, regions: [], departement: null, divisions: [], date: today() }),

  toggleRegion: region =>
    set(state => {
      const exists = state.regions.includes(region);
      const regions = exists
        ? state.regions.filter(r => r !== region)
        : [...state.regions, region];
      return { regions, divisions: [] }; // reset divisions when region selection changes
    }),

  toggleDivision: division =>
    set(state => {
      const exists = state.divisions.includes(division);
      const divisions = exists
        ? state.divisions.filter(d => d !== division)
        : [...state.divisions, division];
      return { divisions };
    }),

  setDate: date => set({ date }),

  reset: () => set({ ...initialState, date: today() }),
}));
