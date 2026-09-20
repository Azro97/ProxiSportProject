// supabase/functions/delete-account/index.ts
// Deno Edge Function. Invoked by a signed-in RN client (src/services/authService.ts
// deleteAccount()) — supabase.functions.invoke() automatically forwards the
// caller's session JWT in the Authorization header.
//
// Required for App Store compliance: Apple Guideline 5.1.1(v) requires apps
// that support account creation to also support account deletion.
//
// Deploy: npx supabase functions deploy delete-account
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are all
// auto-injected by the platform — no secrets to set for this one.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async req => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing Authorization header' }), { status: 401 });
    }

    // Identify the caller from their own session JWT — never trust a
    // client-supplied user id, always derive it server-side.
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ ok: false, error: 'Not authenticated' }), { status: 401 });
    }

    // inscriptions.capitaine_uid is `on delete set null` (see schema.sql), so
    // deleting the auth user automatically preserves their past
    // registrations as guest-like rows rather than deleting registration
    // history — no extra cleanup needed here.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);
    if (deleteError) {
      return new Response(JSON.stringify({ ok: false, error: deleteError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
