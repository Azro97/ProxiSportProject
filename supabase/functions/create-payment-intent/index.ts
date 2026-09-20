// supabase/functions/create-payment-intent/index.ts
// Deno Edge Function. Invoked by the RN client (src/services/paymentService.ts
// createPaymentIntent()) when a user taps "Payer" on a PAID tournoi (free
// tournois never call this — they go straight through createInscription()).
//
// Deploy: npx supabase functions deploy create-payment-intent
// Secret: npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are all
// auto-injected by the platform.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;

Deno.serve(async req => {
  try {
    const { tournoi_id, equipe_nom, capitaine_email, membres } = await req.json();
    if (!tournoi_id || !equipe_nom || !capitaine_email || !Array.isArray(membres)) {
      return new Response(JSON.stringify({ ok: false, error: 'Champs manquants.' }), { status: 400 });
    }

    // Identify the caller from their OWN session JWT, same pattern as
    // delete-account — but unlike delete-account, no user is NOT an error:
    // guest checkout must keep working exactly like create_inscription() does
    // today. Absence of a real session just means capitaineUid stays null.
    const authHeader = req.headers.get('Authorization');
    let capitaineUid: string | null = null;
    if (authHeader) {
      const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await callerClient.auth.getUser();
      capitaineUid = userData?.user?.id ?? null;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Amount ALWAYS derived here — never accepted from the client.
    const { data: tournoi, error: tournoiError } = await supabase
      .from('tournois')
      .select('prix_inscription, statut, date_cloture_inscription')
      .eq('id', tournoi_id)
      .single();
    if (tournoiError || !tournoi) {
      return new Response(JSON.stringify({ ok: false, error: 'Tournoi introuvable.' }), { status: 404 });
    }

    const montant = tournoi.prix_inscription;
    if (!montant || montant <= 0) {
      return new Response(JSON.stringify({ ok: false, error: 'Ce tournoi est gratuit.' }), { status: 400 });
    }
    if (tournoi.statut !== 'ouvert' || new Date(tournoi.date_cloture_inscription) < new Date()) {
      return new Response(JSON.stringify({ ok: false, error: 'Inscriptions closes pour ce tournoi.' }), { status: 400 });
    }

    // Atomic, row-locked capacity check + insert (statut = 'en_attente_paiement')
    // + equipes_inscrites increment — see create_pending_inscription_paiement
    // in supabase/policies.sql. This is what actually prevents oversell:
    // nobody can start paying for a spot that doesn't exist.
    const { data: inscriptionId, error: rpcError } = await supabase.rpc(
      'create_pending_inscription_paiement',
      {
        p_tournoi_id: tournoi_id,
        p_equipe_nom: equipe_nom,
        p_capitaine_email: capitaine_email,
        p_membres: membres,
        p_capitaine_uid: capitaineUid,
        p_montant_paye: montant,
      },
    );
    if (rpcError) {
      return new Response(JSON.stringify({ ok: false, error: rpcError.message }), { status: 409 });
    }

    // Stripe REST API from Deno: plain fetch, form-encoded, secret key as
    // Bearer auth — same "raw fetch, no SDK" approach already used for Resend
    // in send-inscription-confirmation. The Idempotency-Key ties this call to
    // the reservation so a retried request can't create a second PaymentIntent.
    const body = new URLSearchParams({
      amount: String(montant),
      currency: 'eur',
      'automatic_payment_methods[enabled]': 'true',
      'metadata[inscription_id]': inscriptionId as string,
      'metadata[tournoi_id]': tournoi_id,
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `pi_create_${inscriptionId}`,
      },
      body,
    });

    if (!stripeRes.ok) {
      // Compensate — release the reservation so the spot isn't stuck.
      await supabase.rpc('release_pending_inscription', { p_inscription_id: inscriptionId });
      return new Response(JSON.stringify({ ok: false, error: `Stripe error: ${await stripeRes.text()}` }), { status: 502 });
    }

    const paymentIntent = await stripeRes.json();

    const { error: updateError } = await supabase
      .from('inscriptions')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', inscriptionId);
    if (updateError) {
      await supabase.rpc('release_pending_inscription', { p_inscription_id: inscriptionId });
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), { status: 500 });
    }

    // Only the client_secret + our own id go back — never the secret key or
    // any other PaymentIntent field.
    return new Response(
      JSON.stringify({ ok: true, clientSecret: paymentIntent.client_secret, inscriptionId }),
      { status: 200 },
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
