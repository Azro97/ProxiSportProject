// src/services/equipesService.ts

import { Equipe } from '../models/Equipe';
import { supabase } from './supabase';

// Session-level cache — only read once per app launch
let _equipesCache: Equipe[] | null = null;

function toEquipe(row: any): Equipe {
  return {
    id: row.id,
    nom: row.nom,
    sport: row.sport,
    region: row.region,
    departement: row.departement,
  };
}

export async function getAllEquipes(): Promise<Equipe[]> {
  if (_equipesCache) return _equipesCache;
  const { data, error } = await supabase.from('equipes').select('id, nom, sport, region, departement');
  if (error) throw error;
  _equipesCache = (data ?? []).map(toEquipe);
  return _equipesCache;
}

export async function getEquipeById(id: string): Promise<Equipe | null> {
  const { data, error } = await supabase
    .from('equipes')
    .select('id, nom, sport, region, departement')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toEquipe(data) : null;
}

export async function getEquipesBySport(sport: string): Promise<Equipe[]> {
  const { data, error } = await supabase
    .from('equipes')
    .select('id, nom, sport, region, departement')
    .eq('sport', sport);
  if (error) throw error;
  return (data ?? []).map(toEquipe);
}

/**
 * Search equipes by name, region or departement (case-insensitive, substring).
 */
export async function searchEquipes(query: string): Promise<Equipe[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Real server-side search — strip characters that are meaningful to
  // PostgREST's or()/ilike filter syntax (%, _, comma, parens) before
  // interpolating the term.
  const safe = q.replace(/[%_,()]/g, '');
  const { data, error } = await supabase
    .from('equipes')
    .select('id, nom, sport, region, departement')
    .or(`nom.ilike.%${safe}%,region.ilike.%${safe}%,departement.ilike.%${safe}%`);
  if (error) throw error;
  return (data ?? []).map(toEquipe);
}
