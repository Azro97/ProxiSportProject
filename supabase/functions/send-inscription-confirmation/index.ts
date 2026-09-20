// supabase/functions/send-inscription-confirmation/index.ts
// Deno Edge Function. Invoked by the RN client (src/services/tournoiService.ts
// createInscription()) right after a successful create_inscription() RPC call,
// best-effort — a failed send here must never fail the registration itself.
//
// Deploy: npx supabase functions deploy send-inscription-confirmation
// Secret: npx supabase secrets set RESEND_API_KEY=<your Resend API key>
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Verified sending domain in production; Resend's shared test address in dev.
const FROM_ADDRESS = 'ProxiSport <onboarding@resend.dev>';
const ACCENT = '#3b82f6';

// Team/member names are free-text user input — escape before interpolating
// into HTML so a team calling itself "<script>..." can't inject markup into
// the email.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmail(data: {
  teamName: string;
  membres: string[];
  tournoiNom: string;
  dateStr: string;
  terrainNom: string;
  terrainVille: string;
  montant: string;
  ticketId: string;
}) {
  const teamName = escapeHtml(data.teamName);
  const tournoiNom = escapeHtml(data.tournoiNom);
  const terrainNom = escapeHtml(data.terrainNom);
  const terrainVille = escapeHtml(data.terrainVille);
  const membresStr = escapeHtml(data.membres.join(', '));
  const { dateStr, montant, ticketId } = data;

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirmation d'inscription</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      ${teamName} est inscrite à ${tournoiNom} — voici votre confirmation et votre numéro de billet.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background-color:${ACCENT}; padding:28px 32px; text-align:center;">
                <span style="font-size:20px; font-weight:800; color:#ffffff; letter-spacing:0.3px;">🏆 ProxiSport</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 0 32px; text-align:center;">
                <div style="width:56px; height:56px; line-height:56px; border-radius:28px; background-color:#dcfce7; color:#16a34a; font-size:28px; font-weight:700; margin:0 auto 16px auto;">&#10003;</div>
                <div style="font-size:22px; font-weight:800; color:#111827; margin-bottom:6px;">Inscription confirmée</div>
                <div style="font-size:14px; color:#6b7280;">Votre équipe est bien enregistrée</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border-radius:12px;">
                  <tr>
                    <td style="padding:20px;">
                      <div style="font-size:17px; font-weight:700; color:#111827; padding-bottom:8px;">${tournoiNom}</div>
                      <div style="font-size:14px; color:#4b5563; padding-bottom:4px;">&#128197; ${dateStr}</div>
                      <div style="font-size:14px; color:#4b5563;">&#128205; ${terrainNom}, ${terrainVille}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1.5px dashed #d1d5db; border-radius:12px;">
                  <tr>
                    <td style="padding:20px;">
                      <div style="font-size:11px; font-weight:700; letter-spacing:0.6px; text-transform:uppercase; color:#9ca3af; padding-bottom:4px;">Équipe</div>
                      <div style="font-size:15px; font-weight:600; color:#111827; padding-bottom:14px;">${teamName}</div>
                      <div style="font-size:11px; font-weight:700; letter-spacing:0.6px; text-transform:uppercase; color:#9ca3af; padding-bottom:4px;">Membres</div>
                      <div style="font-size:14px; color:#374151; padding-bottom:14px;">${membresStr}</div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">
                        <tr>
                          <td style="font-size:13px; color:#6b7280; padding-top:14px;">Montant réglé</td>
                          <td style="font-size:15px; font-weight:700; color:#111827; text-align:right; padding-top:14px;">${montant}</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px; color:#6b7280; padding-top:6px;">N&deg; de billet</td>
                          <td style="font-size:13px; font-family:'Courier New',monospace; color:#111827; text-align:right; padding-top:6px;">${ticketId}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 32px 32px; text-align:center;">
                <div style="font-size:12px; color:#9ca3af; line-height:18px;">
                  Conservez cet email comme preuve d'inscription.<br/>
                  Ceci est un message automatique, merci de ne pas y répondre.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Inscription confirmée !

${data.teamName} est inscrite à ${data.tournoiNom}.

Date : ${dateStr}
Lieu : ${data.terrainNom}, ${data.terrainVille}

Membres : ${data.membres.join(', ')}
Montant réglé : ${montant}
N° de billet : ${ticketId}

Conservez cet email comme preuve d'inscription.
Ceci est un message automatique, merci de ne pas y répondre.`;

  return { html, text };
}

Deno.serve(async req => {
  try {
    const { inscriptionId } = await req.json();
    if (!inscriptionId || typeof inscriptionId !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'inscriptionId is required' }), { status: 400 });
    }

    // Service-role client: re-fetch everything server-side by id rather than
    // trusting client-passed display data (stale cache, or a tampered request
    // body printing the wrong tournament/date on the ticket). This also means
    // the email path never depends on inscriptions/tournois RLS.
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: inscription, error } = await supabase
      .from('inscriptions')
      .select(`
        id, equipe_nom, capitaine_email, membres, montant_paye,
        tournois ( nom, date_debut, terrain_nom, terrain_ville )
      `)
      .eq('id', inscriptionId)
      .single();

    if (error || !inscription) {
      return new Response(JSON.stringify({ ok: false, error: error?.message ?? 'inscription not found' }), { status: 404 });
    }

    const tournoi = Array.isArray(inscription.tournois) ? inscription.tournois[0] : inscription.tournois;
    const dateStr = tournoi?.date_debut
      ? new Date(tournoi.date_debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const montant = typeof inscription.montant_paye === 'number'
      ? (inscription.montant_paye / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
      : 'Gratuit';

    const { html, text } = buildEmail({
      teamName: inscription.equipe_nom,
      membres: inscription.membres ?? [],
      tournoiNom: tournoi?.nom ?? 'Tournoi',
      dateStr,
      terrainNom: tournoi?.terrain_nom ?? '',
      terrainVille: tournoi?.terrain_ville ?? '',
      montant,
      ticketId: inscription.id,
    });

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: inscription.capitaine_email,
        subject: `Inscription confirmée — ${tournoi?.nom ?? 'Tournoi'}`,
        html,
        text,
      }),
    });

    if (!emailRes.ok) {
      const body = await emailRes.text();
      return new Response(JSON.stringify({ ok: false, error: `Resend error: ${body}` }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
