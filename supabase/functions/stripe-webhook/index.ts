// supabase/functions/stripe-webhook/index.ts
// Stripe calls this directly, server-to-server — never the RN client.
//
// Deploy WITHOUT JWT verification (Stripe carries no Supabase session):
//   npx supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets:
//   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
//   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
// Register in Stripe Dashboard → Webhooks → Add endpoint:
//   https://<project-ref>.functions.supabase.co/stripe-webhook
//   events: payment_intent.succeeded, payment_intent.canceled

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17?target=deno';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async req => {
  const signature = req.headers.get('Stripe-Signature');
  const rawBody = await req.text(); // MUST be the raw body — the signature is computed over these exact bytes.
  if (!signature) {
    return new Response('Missing Stripe-Signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody, signature, STRIPE_WEBHOOK_SECRET, undefined, cryptoProvider,
    );
  } catch (err) {
    return new Response(`Signature verification failed: ${err}`, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;

        // Idempotent: equipes_inscrites was already incremented at
        // reservation time (create_pending_inscription_paiement), so this
        // only ever flips statut. A redelivered event (Stripe's at-least-once
        // delivery) just returns already_confirmed: true and does nothing further.
        const { data, error } = await supabase
          .rpc('confirm_inscription_paiement', {
            p_stripe_payment_intent_id: pi.id,
            p_montant_paye: pi.amount_received ?? pi.amount,
          })
          .single();

        if (error) {
          console.error('[stripe-webhook] confirm failed', pi.id, error.message);
          break; // logged for manual reconciliation — no inscription found / already annulée
        }

        if (data && !data.already_confirmed) {
          try {
            await supabase.functions.invoke('send-inscription-confirmation', {
              body: { inscriptionId: data.inscription_id },
            });
          } catch (emailErr) {
            console.warn('[stripe-webhook] confirmation email failed', emailErr);
          }
        }
        break;
      }

      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const inscriptionId = pi.metadata?.inscription_id;
        if (inscriptionId) {
          await supabase.rpc('release_pending_inscription', { p_inscription_id: inscriptionId });
        }
        break;
      }

      default:
        // payment_intent.payment_failed is deliberately NOT handled here —
        // PaymentSheet lets the user retry the SAME PaymentIntent after a
        // card decline; releasing the spot on first failure would risk
        // handing it to someone else mid-retry.
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    // Non-2xx → Stripe retries the delivery with backoff.
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
