-- One-off migration: run ONCE against the already-live Supabase project
-- (Supabase Studio → SQL Editor, or `npx supabase db execute` if the CLI is
-- linked). This is NOT part of the schema.sql/policies.sql/seed.sql bootstrap
-- flow — those files have already been updated to match this new shape for
-- any FUTURE fresh project, but a fresh bootstrap does not touch this
-- project's existing data, so this script brings the live DB in line.
--
-- Self-contained: this is the ONLY file you need to run for the auth
-- migration — do not also run policies.sql, its "create policy" statements
-- are unchanged and will error with "already exists" on a project that's
-- already bootstrapped.
--
-- What it does:
-- 1. Changes inscriptions.capitaine_uid from a free-text column (defaulting
--    to the placeholder 'user_mock', with junk values like 'u1'/'b1' in
--    seeded rows) into a nullable uuid FK to auth.users — null meaning
--    "guest registration, no account". None of the existing values are
--    valid UUIDs, so they are all nulled out first (every pre-existing
--    registration becomes a guest registration, which is accurate: no real
--    auth existed when they were created).
-- 2. Replaces create_inscription() so it derives capitaine_uid from
--    auth.uid() server-side instead of never setting it, and grants execute
--    to "authenticated" as well as "anon" (both statements are idempotent —
--    safe to re-run this whole file if needed).

begin;

alter table inscriptions alter column capitaine_uid drop default;
alter table inscriptions alter column capitaine_uid drop not null;
update inscriptions set capitaine_uid = null;
alter table inscriptions alter column capitaine_uid type uuid using capitaine_uid::uuid;
alter table inscriptions
  add constraint inscriptions_capitaine_uid_fkey
  foreign key (capitaine_uid) references auth.users(id) on delete set null;
create index if not exists inscriptions_capitaine_uid_idx on inscriptions (capitaine_uid);

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
begin
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

commit;
