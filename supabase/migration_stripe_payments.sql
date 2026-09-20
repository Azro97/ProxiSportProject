-- One-off migration: run ONCE against the already-live Supabase project
-- (Supabase Studio → SQL Editor). Self-contained — do not also run
-- policies.sql, its unchanged "create policy" statements will error with
-- "already exists" on a project that's already bootstrapped (same caveat as
-- the two prior migration files).
--
-- What it does:
-- 1. Adds a real CHECK constraint on inscriptions.statut (previously a bare
--    text column, the 3-value union only existed as a TS type) and a
--    defense-in-depth CHECK on tournois keeping equipes_inscrites within
--    [0, max_equipes] — real oversell prevention happens via row-locking in
--    the RPCs below, this is just a backstop.
-- 2. Adds a partial unique index on inscriptions.stripe_payment_intent_id so
--    two rows can never point at the same Stripe PaymentIntent.
-- 3. Adds a capacity check to the existing create_inscription() RPC (free
--    tournaments) — today it increments equipes_inscrites with no check at
--    all, which the new CHECK constraint above would otherwise turn into a
--    raw constraint-violation error instead of a friendly "Tournoi complet."
-- 4. Adds three new RPCs for the paid-registration flow — all service_role
--    only, never client-callable (see comments below and in policies.sql).

begin;

alter table inscriptions
  add constraint inscriptions_statut_check
  check (statut in ('en_attente_paiement', 'confirmée', 'annulée'));

alter table tournois
  add constraint tournois_equipes_inscrites_check
  check (equipes_inscrites >= 0 and equipes_inscrites <= max_equipes);

create unique index inscriptions_stripe_payment_intent_id_uidx
  on inscriptions (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ── create_inscription: add the capacity check that was always missing ──────

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
grant execute on function create_inscription to anon, authenticated;

-- ── Stripe payment RPCs — service_role only ──────────────────────────────────

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

commit;
