// src/stores/filtresStore.ts
// Multi-select filter store for the Matchs screen.
// Rule: setting Sport auto-selects the nearest region from GPS, resets divisions.
// Toggling regions resets divisions.
// date: null means "all dates" (TOUS chip selected). See CLAUDE.md §5.

import { create } from 'zustand';
import { Filtre, Division, DivisionGroupe, DIVISION_GROUPS } from '../models/Filtre';
import { getNearestRegion } from '../utils/geo';
import { useLocationStore } from './locationStore';

type FiltresStore = Filtre & {
  setSport: (s: string) => void;             // resets regions, divisions, date→null
  toggleRegion: (r: string) => void;         // adds/removes region, resets divisions
  clearRegions: () => void;                  // select all regions (Tous)
  toggleDivision: (d: Division) => void;        // adds/removes a specific level
  toggleDivisionGroup: (g: DivisionGroupe) => void; // selects/deselects all 3 in a group
  clearDivisions: () => void;                    // select all divisions (Tous)
  setDate: (d: Date | null) => void;         // null = all dates
  reset: () => void;
};

const initialState: Filtre = {
  sport: null,
  regions: [],
  departement: null,
  divisions: [],
  date: null,
};

export const useFiltresStore = create<FiltresStore>(set => ({
  ...initialState,

  setSport: sport => {
    // Auto-detect the user's region from GPS on first sport selection.
    const { lat, lng } = useLocationStore.getState();
    const detectedRegion = (lat !== null && lng !== null)
      ? getNearestRegion(lat, lng)
      : null;
    set({
      sport,
      regions: detectedRegion ? [detectedRegion] : [],
      departement: null,
      divisions: [],
      date: null,
    });
  },

  toggleRegion: region =>
    set(state => {
      const exists = state.regions.includes(region);
      const regions = exists
        ? state.regions.filter(r => r !== region)
        : [...state.regions, region];
      return { regions, divisions: [] }; // reset divisions when region selection changes
    }),

  clearRegions: () => set({ regions: [], divisions: [] }),

  toggleDivision: division =>
    set(state => {
      const exists = state.divisions.includes(division);
      const divisions = exists
        ? state.divisions.filter(d => d !== division)
        : [...state.divisions, division];
      return { divisions };
    }),

  toggleDivisionGroup: groupe =>
    set(state => {
      const subs = DIVISION_GROUPS[groupe];
      const allSelected = subs.every(d => state.divisions.includes(d));
      if (allSelected) {
        // Deselect all in group
        return { divisions: state.divisions.filter(d => !subs.includes(d)) };
      } else {
        // Select all in group (add any missing)
        const merged = [...state.divisions, ...subs.filter(d => !state.divisions.includes(d))];
        return { divisions: merged };
      }
    }),

  clearDivisions: () => set({ divisions: [] }),

  setDate: date => set({ date }),

  reset: () => set({ ...initialState }),
}));
