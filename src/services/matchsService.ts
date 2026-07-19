// src/services/matchsService.ts

import { Match } from '../models/Match';
import { Filtre } from '../models/Filtre';
import { startOfDay, endOfDay, isSameDay } from '../utils/date';
import { supabase } from './supabase';
import { MOCK_MATCHES, MOCK_REGIONS, MOCK_DEPARTEMENTS, getFreshMockMatches } from './mock/mockData';

const USE_MOCK = false; // cut over to Supabase

function toMatch(row: any): Match {
  return {
    id: row.id,
    sport: row.sport,
    equipeA_id: row.equipe_a_id,
    equipeA_nom: row.equipe_a_nom,
    equipeB_id: row.equipe_b_id,
    equipeB_nom: row.equipe_b_nom,
    terrain_id: row.terrain_id,
    dateHeure: new Date(row.date_heure),
    division: row.division,
    region: row.region,
    departement: row.departement,
    statut: row.statut ?? undefined,
    scoreA: row.score_a ?? undefined,
    scoreB: row.score_b ?? undefined,
  };
}

/**
 * Fetch matches applying filters in priority order:
 * sport → region/departement → division → date range.
 * All 4 filters must be set before this is called (enforced by the store cascade).
 */
export async function getMatchs(filtres: Filtre): Promise<Match[]> {
  if (USE_MOCK) {
    return filterMockMatchs(filtres);
  }

  let query = supabase.from('matchs').select('*');

  if (filtres.sport)                query = query.eq('sport', filtres.sport);
  if (filtres.regions.length > 0)   query = query.in('region', filtres.regions);
  if (filtres.departement)          query = query.eq('departement', filtres.departement);
  if (filtres.divisions.length > 0) query = query.in('division', filtres.divisions);
  // date null = all dates; otherwise filter by day range
  if (filtres.date) {
    query = query
      .gte('date_heure', startOfDay(filtres.date).toISOString())
      .lte('date_heure', endOfDay(filtres.date).toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toMatch);
}

function filterMockMatchs(filtres: Filtre): Match[] {
  let results = getFreshMockMatches();
  if (filtres.sport)               results = results.filter(m => m.sport === filtres.sport);
  if (filtres.regions.length > 0)  results = results.filter(m => filtres.regions.includes(m.region));
  if (filtres.departement)         results = results.filter(m => m.departement === filtres.departement);
  if (filtres.divisions.length > 0) results = results.filter(m => filtres.divisions.includes(m.division as any));
  // date null = all dates
  if (filtres.date) results = results.filter(m => isSameDay(m.dateHeure, filtres.date!));
  return results;
}

export async function getMatchsByTerrain(terrainId: string): Promise<Match[]> {
  if (USE_MOCK) {
    return getFreshMockMatches()
      .filter(m => m.terrain_id === terrainId)
      .sort((a, b) => a.dateHeure.getTime() - b.dateHeure.getTime());
  }

  const { data, error } = await supabase
    .from('matchs')
    .select('*')
    .eq('terrain_id', terrainId)
    .order('date_heure', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toMatch);
}

/** Returns the set of terrain IDs that have at least one match for the given sport. */
export async function getTerrainIdsForSport(sport: string): Promise<Set<string>> {
  if (USE_MOCK) {
    const ids = getFreshMockMatches()
      .filter(m => m.sport === sport)
      .map(m => m.terrain_id);
    return new Set(ids);
  }

  const { data, error } = await supabase
    .from('matchs')
    .select('terrain_id')
    .eq('sport', sport);
  if (error) throw error;
  return new Set((data ?? []).map((row: any) => row.terrain_id as string));
}

export async function getMatchById(id: string): Promise<Match | null> {
  if (USE_MOCK) {
    return MOCK_MATCHES.find(m => m.id === id) ?? null;
  }

  const { data, error } = await supabase.from('matchs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toMatch(data) : null;
}

export function grouperParDivision(matchs: Match[]): Record<string, Match[]> {
  return matchs.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.division;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});
}

export function grouperParDate(matchs: Match[]): Record<string, Match[]> {
  return matchs.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.dateHeure.toLocaleDateString('fr-FR');
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});
}

/**
 * Returns the list of available regions. Served as static app config rather
 * than a backend query — French administrative regions don't change at
 * runtime, and this function is synchronous (not a Promise) so it must stay
 * that way regardless of USE_MOCK to avoid breaking every screen that calls it.
 */
export function getRegions(): string[] {
  return MOCK_REGIONS;
}

/** Returns the list of departements for a given region. Same rationale as getRegions(). */
export function getDepartements(region: string): string[] {
  return MOCK_DEPARTEMENTS[region] ?? [];
}

/**
 * All matches (past + upcoming) involving a given team, sorted newest first.
 */
export async function getMatchsByEquipe(equipeId: string): Promise<Match[]> {
  if (USE_MOCK) {
    return getFreshMockMatches()
      .filter(m => m.equipeA_id === equipeId || m.equipeB_id === equipeId)
      .sort((a, b) => b.dateHeure.getTime() - a.dateHeure.getTime());
  }

  const { data, error } = await supabase
    .from('matchs')
    .select('*')
    .or(`equipe_a_id.eq.${equipeId},equipe_b_id.eq.${equipeId}`)
    .order('date_heure', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toMatch);
}

/**
 * Past (played) matches, sorted most recent first.
 * Both sport and equipeId are optional — omit to get all results.
 */
export async function getMatchsJoues(sport?: string, equipeId?: string): Promise<Match[]> {
  const now = new Date();
  if (USE_MOCK) {
    let results = getFreshMockMatches().filter(m => m.dateHeure < now);
    if (sport)    results = results.filter(m => m.sport === sport);
    if (equipeId) results = results.filter(m => m.equipeA_id === equipeId || m.equipeB_id === equipeId);
    return results.sort((a, b) => b.dateHeure.getTime() - a.dateHeure.getTime());
  }

  let query = supabase.from('matchs').select('*').lt('date_heure', now.toISOString());
  if (sport) query = query.eq('sport', sport);
  if (equipeId) query = query.or(`equipe_a_id.eq.${equipeId},equipe_b_id.eq.${equipeId}`);
  const { data, error } = await query.order('date_heure', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toMatch);
}
