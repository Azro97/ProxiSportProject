import { Tournoi, TournoiStatut } from '../models/Tournoi';

// Mirrors the server-side check in supabase/functions/create-payment-intent
// and create_inscription(): a tournoi whose close date has passed is closed
// for registration regardless of what statut still says in the DB (seed data
// or an admin-set statut can drift from the date without this).
export function getEffectiveStatut(tournoi: Pick<Tournoi, 'statut' | 'dateClotureInscription'>): TournoiStatut {
  const closureDatePassed = tournoi.dateClotureInscription < new Date();
  return tournoi.statut === 'ouvert' && closureDatePassed ? 'terminé' : tournoi.statut;
}
