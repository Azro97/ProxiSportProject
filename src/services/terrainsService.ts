// src/services/terrainsService.ts

import { Terrain } from '../models/Terrain';
import { supabase } from './supabase';

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
  const { data, error } = await supabase
    .from('terrains')
    .select('id, nom, adresse, ville, lat, lng')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toTerrain(data) : null;
}
