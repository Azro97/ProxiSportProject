// src/services/tournoiService.ts

import { Tournoi } from '../models/Tournoi';
import { Inscription } from '../models/Inscription';
import { supabase } from './supabase';
import { MOCK_TOURNOIS, MOCK_INSCRIPTIONS } from './mock/mockData';

const USE_MOCK = false; // cut over to Supabase

function toTournoi(row: any): Tournoi {
  return {
    id: row.id,
    nom: row.nom,
    sport: row.sport,
    description: row.description,
    photoUrl: row.photo_url ?? undefined,
    terrain_id: row.terrain_id,
    terrain_nom: row.terrain_nom,
    terrain_ville: row.terrain_ville,
    organisateur_id: row.organisateur_id,
    organisateur_nom: row.organisateur_nom,
    dateDebut: new Date(row.date_debut),
    dateFin: new Date(row.date_fin),
    dateClotureInscription: new Date(row.date_cloture_inscription),
    prixInscription: row.prix_inscription,
    maxEquipes: row.max_equipes,
    equipesInscrites: row.equipes_inscrites,
    tailleEquipe: row.taille_equipe,
    statut: row.statut,
    region: row.region,
    departement: row.departement,
  };
}

function toInscription(row: any): Inscription {
  return {
    id: row.id,
    tournoi_id: row.tournoi_id,
    equipe_id: row.equipe_id,
    equipe_nom: row.equipe_nom,
    capitaine_uid: row.capitaine_uid,
    capitaine_email: row.capitaine_email,
    membres: row.membres,
    dateInscription: new Date(row.date_inscription),
    statut: row.statut,
    stripe_payment_intent_id: row.stripe_payment_intent_id ?? undefined,
    montant_payé: row.montant_paye ?? undefined,
  };
}

export async function getTournois(sport?: string | null, region?: string | null): Promise<Tournoi[]> {
  if (USE_MOCK) {
    let list = [...MOCK_TOURNOIS];
    if (sport)  list = list.filter(t => t.sport === sport);
    if (region) list = list.filter(t => t.region === region);
    return list.sort((a, b) => a.dateDebut.getTime() - b.dateDebut.getTime());
  }

  let query = supabase.from('tournois').select('*');
  if (sport)  query = query.eq('sport', sport);
  if (region) query = query.eq('region', region);
  const { data, error } = await query.order('date_debut', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toTournoi);
}

export async function getTournoiById(id: string): Promise<Tournoi | null> {
  if (USE_MOCK) return MOCK_TOURNOIS.find(t => t.id === id) ?? null;

  const { data, error } = await supabase.from('tournois').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toTournoi(data) : null;
}

/** Get all inscriptions for a given tournament */
export async function getInscriptionsByTournoi(tournoiId: string): Promise<Inscription[]> {
  if (USE_MOCK) {
    return MOCK_INSCRIPTIONS.filter(i => i.tournoi_id === tournoiId)
      .sort((a, b) => b.dateInscription.getTime() - a.dateInscription.getTime());
  }

  const { data, error } = await supabase
    .from('inscriptions')
    .select('*')
    .eq('tournoi_id', tournoiId)
    .order('date_inscription', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toInscription);
}

/** Add a new tournament (mock: push in-memory; prod: insert into Supabase) */
export async function createTournoi(data: Omit<Tournoi, 'id' | 'equipesInscrites'>): Promise<string> {
  if (USE_MOCK) {
    const id = 'to_' + Date.now();
    MOCK_TOURNOIS.push({ ...data, id, equipesInscrites: 0 });
    return id;
  }

  const id = 'to_' + Date.now();
  const { error } = await supabase.from('tournois').insert({
    id,
    nom: data.nom,
    sport: data.sport,
    description: data.description,
    photo_url: data.photoUrl,
    terrain_id: data.terrain_id,
    terrain_nom: data.terrain_nom,
    terrain_ville: data.terrain_ville,
    organisateur_id: data.organisateur_id,
    organisateur_nom: data.organisateur_nom,
    date_debut: data.dateDebut.toISOString(),
    date_fin: data.dateFin.toISOString(),
    date_cloture_inscription: data.dateClotureInscription.toISOString(),
    prix_inscription: data.prixInscription,
    max_equipes: data.maxEquipes,
    equipes_inscrites: 0,
    taille_equipe: data.tailleEquipe,
    statut: data.statut,
    region: data.region,
    departement: data.departement,
  });
  if (error) throw error;
  return id;
}

/** Format price from centimes to readable string — ex: 3000 → "30,00 €" */
export function formatPrix(centimes: number): string {
  if (centimes === 0) return 'Gratuit';
  return (centimes / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Register a team to a tournament (mock: push in-memory; prod: atomic RPC — see supabase/policies.sql) */
export async function createInscription(data: {
  tournoi_id: string;
  equipe_nom: string;
  capitaine_email: string;
  membres: string[];
  montant_payé: number;
}): Promise<string> {
  if (USE_MOCK) {
    const id = 'ins_' + Date.now();
    MOCK_INSCRIPTIONS.push({
      id,
      tournoi_id: data.tournoi_id,
      equipe_id: 'eq_' + Date.now(),
      equipe_nom: data.equipe_nom,
      capitaine_uid: 'user_mock',
      capitaine_email: data.capitaine_email,
      membres: data.membres,
      dateInscription: new Date(),
      statut: 'confirmée',
      montant_payé: data.montant_payé,
    });
    // increment equipesInscrites on the tournament
    const t = MOCK_TOURNOIS.find(t => t.id === data.tournoi_id);
    if (t) t.equipesInscrites = (t.equipesInscrites ?? 0) + 1;
    return id;
  }

  // create_inscription() inserts the row AND increments tournois.equipes_inscrites
  // atomically in one transaction — see supabase/policies.sql.
  const { data: id, error } = await supabase.rpc('create_inscription', {
    p_tournoi_id: data.tournoi_id,
    p_equipe_nom: data.equipe_nom,
    p_capitaine_email: data.capitaine_email,
    p_membres: data.membres,
    p_montant_paye: data.montant_payé,
  });
  if (error) throw error;
  return id as string;
}
