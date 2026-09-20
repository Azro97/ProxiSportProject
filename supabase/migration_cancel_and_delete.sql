-- One-off migration: run ONCE against the live Supabase project (Studio →
-- SQL Editor). Adds cancel_inscription() — the RPC that lets a signed-in
-- user cancel their own tournament registration from "Mes inscriptions".
-- Self-contained, matches the pattern of migration_auth_capitaine_uid.sql.
--
-- Guests cannot cancel via this RPC (grant is to "authenticated" only, not
-- "anon") — there's no identity to check ownership against for a guest
-- registration (capitaine_uid is null), so this is the correct restriction,
-- not an oversight. A guest who needs to cancel would go through support.
--
-- Ownership check: only the row's own capitaine_uid = auth.uid() can be
-- cancelled — a signed-in user can never cancel someone else's registration,
-- including another signed-in user's or a guest's (capitaine_uid is null for
-- guests, which never equals a real auth.uid()).

begin;

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

commit;
