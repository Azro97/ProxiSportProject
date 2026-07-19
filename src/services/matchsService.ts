// src/services/matchsService.ts

import { Match } from '../models/Match';
import { Filtre } from '../models/Filtre';
import { startOfDay, endOfDay } from '../utils/date';
import { supabase } from './supabase';

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

export async function getMatchsByTerrain(terrainId: string): Promise<Match[]> {
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
  const { data, error } = await supabase
    .from('matchs')
    .select('terrain_id')
    .eq('sport', sport);
  if (error) throw error;
  return new Set((data ?? []).map((row: any) => row.terrain_id as string));
}

export async function getMatchById(id: string): Promise<Match | null> {
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

type RegionRow = { id: string; nom: string };

// Session-level cache — regions/departements don't change at runtime, and
// there are only 6 regions / ~25 departements total, so one fetch per app
// launch is enough.
let _regionsCache: RegionRow[] | null = null;
const _departementsCache: Record<string, string[]> = {};

async function fetchRegionRows(): Promise<RegionRow[]> {
  if (_regionsCache) return _regionsCache;
  const { data, error } = await supabase.from('regions').select('id, nom').order('nom');
  if (error) throw error;
  _regionsCache = data ?? [];
  return _regionsCache;
}

/** Returns the list of available regions. */
export async function getRegions(): Promise<string[]> {
  const rows = await fetchRegionRows();
  return rows.map(r => r.nom);
}

/** Returns the list of departements for a given region (by region name). */
export async function getDepartements(region: string): Promise<string[]> {
  if (_departementsCache[region]) return _departementsCache[region];

  const rows = await fetchRegionRows();
  const regionRow = rows.find(r => r.nom === region);
  if (!regionRow) return [];

  const { data, error } = await supabase
    .from('departements')
    .select('nom')
    .eq('region_id', regionRow.id)
    .order('nom');
  if (error) throw error;

  const noms = (data ?? []).map((d: any) => d.nom);
  _departementsCache[region] = noms;
  return noms;
}

/**
 * All matches (past + upcoming) involving a given team, sorted newest first.
 */
export async function getMatchsByEquipe(equipeId: string): Promise<Match[]> {
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
  let query = supabase.from('matchs').select('*').lt('date_heure', now.toISOString());
  if (sport) query = query.eq('sport', sport);
  if (equipeId) query = query.or(`equipe_a_id.eq.${equipeId},equipe_b_id.eq.${equipeId}`);
  const { data, error } = await query.order('date_heure', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toMatch);
}
