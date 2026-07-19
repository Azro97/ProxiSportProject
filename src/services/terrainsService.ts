// src/services/terrainsService.ts

import { Terrain } from '../models/Terrain';
import { haversineDistance } from '../utils/geo';
import { supabase } from './supabase';
import { MOCK_TERRAINS } from './mock/mockData';

const USE_MOCK = false; // cut over to Supabase — see supabase/policies.sql (nearby_terrains)

function toTerrain(row: any): Terrain {
  return {
    id: row.id,
    nom: row.nom,
    adresse: row.adresse,
    ville: row.ville,
    lat: row.lat,
    lng: row.lng,
  };
}

export async function getTerrainsByLocation(
  lat: number,
  lng: number,
  rayonKm: number,
): Promise<Terrain[]> {
  if (USE_MOCK) {
    // Geographic radius filter is client-side (Haversine) — see CLAUDE.md §6
    return MOCK_TERRAINS.filter(t => haversineDistance(lat, lng, t.lat, t.lng) <= rayonKm);
  }

  // Indexed radius search via PostGIS — see supabase/policies.sql (nearby_terrains)
  const { data, error } = await supabase.rpc('nearby_terrains', {
    in_lat: lat,
    in_lng: lng,
    in_radius_km: rayonKm,
  });
  if (error) throw error;
  return (data ?? []).map(toTerrain);
}

export async function getTerrainById(id: string): Promise<Terrain | null> {
  if (USE_MOCK) {
    return MOCK_TERRAINS.find(t => t.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('terrains')
    .select('id, nom, adresse, ville, lat, lng')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toTerrain(data) : null;
}
