// src/services/paymentService.ts
// Only called for tournaments with prixInscription > 0 — free tournaments
// call createInscription() (in tournoiService.ts) directly and never touch
// this file. Amount and capitaine_uid are deliberately NOT parameters here:
// both are derived server-side by the create-payment-intent Edge Function,
// matching createInscription()'s existing "server derives it, client never
// supplies it" convention.

import { supabase } from './supabase';
import { withTimeout } from './withTimeout';

export interface CreatePaymentIntentParams {
  tournoi_id: string;
  equipe_nom: string;
  capitaine_email: string;
  membres: string[];
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  inscriptionId: string;
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams,
): Promise<CreatePaymentIntentResult> {
  const { data, error } = await withTimeout(
    supabase.functions.invoke('create-payment-intent', { body: params }),
  );
  if (error) throw error;
  if (!data?.ok || !data?.clientSecret || !data?.inscriptionId) {
    throw new Error(data?.error ?? 'Réponse invalide du serveur de paiement.');
  }
  return { clientSecret: data.clientSecret, inscriptionId: data.inscriptionId };
}
