-- ProxiSport — RLS policies + RPC functions
-- Run after schema.sql. The app has no MANDATORY end-user auth — browsing
-- (terrains/matchs/tournois) stays fully public. Supabase Auth (email/password)
-- is optional and only used by create_inscription() below, to let a signed-in
-- user's registrations be attributed to their account; guests (anon key, no
-- session) still register exactly as before with capitaine_uid left null.

alter table regions       enable row level security;
alter table departements  enable row level security;
alter table terrains      enable row level security;
alter table equipes       enable row level security;
alter table matchs        enable row level security;
alter table tournois      enable row level security;
alter table inscriptions  enable row level security;

-- drop-then-create makes this file safe to re-run wholesale (Postgres has no
-- "create policy if not exists"; re-running the bare create statements
-- against an already-provisioned project fails with "policy ... already
-- exists").
drop policy if exists "public read" on regions;
drop policy if exists "public read" on departements;
drop policy if exists "public read" on terrains;
drop policy if exists "public read" on equipes;
drop policy if exists "public read" on matchs;
drop policy if exists "public read" on tournois;
drop policy if exists "public read" on inscriptions;

create policy "public read" on regions      for select using (true);
create policy "public read" on departements for select using (true);
create policy "public read" on terrains     for select using (true);
create policy "public read" on equipes      for select using (true);
create policy "public read" on matchs       for select using (true);
create policy "public read" on tournois     for select using (true);
create policy "public read" on inscriptions for select using (true);

-- Admin tournament/team creation (adminStore's login gate is client-side
-- only, same trust level Firestore would have had with an open ruleset).
-- Team creation is deliberately admin-only in the app UI (AdminCreateEquipeScreen,
-- reachable only through the admin dashboard) — normal users can search/view
-- equipes but must never be able to spin up an "official" club team
-- themselves, since equipes are the teams real scheduled league matches
-- reference (matchs.equipe_a_id/equipe_b_id).
drop policy if exists "public insert" on tournois;
create policy "public insert" on tournois for insert with check (true);
drop policy if exists "public insert" on equipes;
create policy "public insert" on equipes for insert with check (true);

-- Inscriptions has NO direct insert policy — the only write path is the
-- create_inscription() RPC below, so the equipes_inscrites counter can
-- never drift out of sync (this fixes a real bug in the old Firestore
-- code, where the prod branch never incremented it — see tournoiService.ts).
--
-- SELECT stays public here deliberately: AdminTournoiDetailScreen reads this
-- table with the anon key (admin login is a client-side-only check, not a
-- real Supabase session), so scoping SELECT to capitaine_uid = auth.uid()
-- would silently break the admin dashboard's inscriptions list. Revisit only
-- once admin has a real Supabase identity.

-- ── nearby_terrains: indexed radius search (replaces client-side Haversine) ──

create or replace function nearby_terrains(
  in_lat double precision,
  in_lng double precision,
  in_radius_km double precision
)
returns setof terrains
language sql
stable
as $$
  select t.*
  from terrains t
  where ST_DWithin(
    t.geog,
    ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326)::geography,
    in_radius_km * 1000
  )
  order by t.geog <-> ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326)::geography;
$$;
grant execute on function nearby_terrains to anon;

-- ── create_inscription: atomic insert + equipes_inscrites increment ─────────
--
-- capitaine_uid is derived server-side from auth.uid() — never a client
-- param. auth.uid() reads the request.jwt.claims GUC that PostgREST sets
-- before invoking the function, based on the caller's Authorization header;
-- SECURITY DEFINER only changes whose privileges are used for permission
-- checks, it does not touch that GUC. So: anon-key calls (guests) naturally
-- yield NULL, and calls made with a signed-in user's session (supabase-js
-- swaps in the session JWT automatically) naturally yield their real uid —
-- with zero change needed at the call site in tournoiService.ts.

create or replace function create_inscription(
  p_tournoi_id text,
  p_equipe_nom text,
  p_capitaine_email text,
  p_membres text[],
  p_montant_paye integer
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id  text := 'ins_' || floor(extract(epoch from clock_timestamp()) * 1000)::text;
  v_uid uuid := auth.uid();
  v_max integer;
  v_current integer;
begin
  -- Row-lock + capacity check, same pattern as create_pending_inscription_paiement()
  -- below — without this, tournois_equipes_inscrites_check (schema.sql) would
  -- just turn overselling into a raw constraint-violation error instead of a
  -- friendly one.
  select max_equipes, equipes_inscrites into v_max, v_current
  from tournois where id = p_tournoi_id for update;

  if v_max is null then
    raise exception 'Tournoi introuvable.';
  end if;
  if v_current >= v_max then
    raise exception 'Tournoi complet.';
  end if;

  insert into inscriptions (
    id, tournoi_id, equipe_id, equipe_nom, capitaine_uid, capitaine_email, membres, statut, montant_paye
  ) values (
    v_id, p_tournoi_id, 'eq_' || v_id, p_equipe_nom, v_uid, p_capitaine_email, p_membres, 'confirmée', p_montant_paye
  );

  update tournois set equipes_inscrites = equipes_inscrites + 1 where id = p_tournoi_id;

  return v_id;
end;
$$;
-- Grant to BOTH roles: anon (guest checkout) and authenticated (signed-in
-- users) — Supabase treats them as separate, non-inheriting roles, so
-- granting only "anon" would make every signed-in user's first registration
-- fail with a permission error.
grant execute on function create_inscription to anon, authenticated;

-- ── cancel_inscription: signed-in users cancelling their own registration ───
--
-- Grant is to "authenticated" ONLY (not "anon") — guests have no identity to
-- check ownership against (capitaine_uid is null for guest rows), so guest
-- self-service cancellation is deliberately unsupported here, not an
-- oversight. The ownership check (capitaine_uid = auth.uid()) means a
-- signed-in user can never cancel anyone else's registration.

create or replace function cancel_inscription(p_inscription_id text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tournoi_id text;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Vous devez être connecté pour annuler une inscription.';
  end if;

  select tournoi_id into v_tournoi_id
  from inscriptions
  where id = p_inscription_id
    and capitaine_uid = v_uid
    and statut <> 'annulée';

  if v_tournoi_id is null then
    raise exception 'Inscription introuvable ou déjà annulée.';
  end if;

  update inscriptions set statut = 'annulée' where id = p_inscription_id;
  update tournois set equipes_inscrites = greatest(equipes_inscrites - 1, 0) where id = v_tournoi_id;
end;
$$;
grant execute on function cancel_inscription to authenticated;

-- ── Stripe payment RPCs ──────────────────────────────────────────────────────
--
-- These three are service_role-only — never anon/authenticated. Unlike
-- create_inscription/cancel_inscription (which derive auth.uid() themselves
-- from the caller's own JWT), these accept capitaine_uid / trigger
-- confirmation directly as parameters, which is only safe because the
-- create-payment-intent and stripe-webhook Edge Functions are the only
-- callers, and they've already done their own server-side verification
-- (the caller's real JWT, Stripe's webhook signature) before invoking these.
-- A client-callable version accepting these same params would let anyone
-- forge someone else's capitaine_uid or fake a payment confirmation.

-- Atomic reservation for a PAID registration: locks the tournoi row, checks
-- capacity, inserts the PENDING inscription, increments the counter — one
-- transaction. This is what actually prevents oversell (nobody can start
-- paying for a spot that doesn't exist), which is why equipes_inscrites is
-- incremented here and NOT again at confirmation time.
create or replace function create_pending_inscription_paiement(
  p_tournoi_id text,
  p_equipe_nom text,
  p_capitaine_email text,
  p_membres text[],
  p_capitaine_uid uuid,
  p_montant_paye integer
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id text := 'ins_' || floor(extract(epoch from clock_timestamp()) * 1000)::text;
  v_max integer;
  v_current integer;
begin
  select max_equipes, equipes_inscrites into v_max, v_current
  from tournois where id = p_tournoi_id for update;

  if v_max is null then
    raise exception 'Tournoi introuvable.';
  end if;
  if v_current >= v_max then
    raise exception 'Tournoi complet.';
  end if;

  insert into inscriptions (
    id, tournoi_id, equipe_id, equipe_nom, capitaine_uid, capitaine_email, membres, statut, montant_paye
  ) values (
    v_id, p_tournoi_id, 'eq_' || v_id, p_equipe_nom, p_capitaine_uid, p_capitaine_email, p_membres,
    'en_attente_paiement', p_montant_paye
  );

  update tournois set equipes_inscrites = equipes_inscrites + 1 where id = p_tournoi_id;
  return v_id;
end;
$$;
revoke all on function create_pending_inscription_paiement from public;
grant execute on function create_pending_inscription_paiement to service_role;

-- Compensating release — used by create-payment-intent when the Stripe API
-- call fails right after reserving, by stripe-webhook on a genuine
-- payment_intent.canceled event, or (optionally, not built yet) a periodic
-- sweep for abandoned checkouts. Idempotent: no-ops if the row isn't still
-- pending (already confirmed, already released, or doesn't exist).
create or replace function release_pending_inscription(p_inscription_id text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tournoi_id text;
begin
  select tournoi_id into v_tournoi_id
  from inscriptions
  where id = p_inscription_id and statut = 'en_attente_paiement'
  for update;

  if v_tournoi_id is null then
    return;
  end if;

  update inscriptions set statut = 'annulée' where id = p_inscription_id;
  update tournois set equipes_inscrites = greatest(equipes_inscrites - 1, 0) where id = v_tournoi_id;
end;
$$;
revoke all on function release_pending_inscription from public;
grant execute on function release_pending_inscription to service_role;

-- Called only by stripe-webhook on payment_intent.succeeded. Only ever flips
-- statut — equipes_inscrites was already incremented at reservation time
-- above, so a redelivered Stripe event (at-least-once delivery) is a safe,
-- idempotent no-op here rather than a double-increment.
create or replace function confirm_inscription_paiement(
  p_stripe_payment_intent_id text,
  p_montant_paye integer
)
returns table(inscription_id text, already_confirmed boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id text;
  v_statut text;
begin
  select id, statut into v_id, v_statut
  from inscriptions where stripe_payment_intent_id = p_stripe_payment_intent_id
  for update;

  if v_id is null then
    raise exception 'Aucune inscription pour ce paiement (%).', p_stripe_payment_intent_id;
  end if;

  if v_statut = 'confirmée' then
    return query select v_id, true;
    return;
  end if;

  if v_statut = 'annulée' then
    raise exception 'Inscription % déjà annulée — paiement % à réconcilier manuellement.', v_id, p_stripe_payment_intent_id;
  end if;

  update inscriptions set statut = 'confirmée', montant_paye = coalesce(p_montant_paye, montant_paye) where id = v_id;
  return query select v_id, false;
end;
$$;
revoke all on function confirm_inscription_paiement from public;
grant execute on function confirm_inscription_paiement to service_role;
