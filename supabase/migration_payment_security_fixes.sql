-- One-off migration: run ONCE against the already-live Supabase project
-- (Supabase Studio -> SQL Editor, or `npx supabase db query --linked -f ...`).
--
-- Fixes two real security gaps left open by migration_stripe_payments.sql,
-- both documented in CLAUDE.md's "Payment (Stripe)" section:
--
-- 1. create_inscription(...) never checked that the tournoi was actually
--    free. It's granted to anon/authenticated, so anyone with the public
--    anon key could call it directly for a PAID tournoi and get a
--    'confirmée' registration having paid nothing.
--
-- 2. cancel_inscription(...) could cancel an 'en_attente_paiement' row, not
--    just a confirmed one. If a user cancelled while a Stripe PaymentIntent
--    was genuinely still in flight and the payment then completed anyway,
--    confirm_inscription_paiement would find the row already 'annulée' and
--    raise its "deja annulee - paiement a reconcilier manuellement"
--    exception -- a real charge with no registration to show for it.

begin;

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
  v_prix integer;
begin
  select max_equipes, equipes_inscrites, prix_inscription into v_max, v_current, v_prix
  from tournois where id = p_tournoi_id for update;

  if v_max is null then
    raise exception 'Tournoi introuvable.';
  end if;
  if v_prix > 0 then
    raise exception 'Ce tournoi nécessite un paiement — utilisez le flux de paiement.';
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
    and statut = 'confirmée'
  for update;

  if v_tournoi_id is null then
    raise exception 'Inscription introuvable, déjà annulée, ou paiement en cours (patientez qu''il se termine avant d''annuler).';
  end if;

  update inscriptions set statut = 'annulée' where id = p_inscription_id;
  update tournois set equipes_inscrites = greatest(equipes_inscrites - 1, 0) where id = v_tournoi_id;
end;
$$;
grant execute on function cancel_inscription to authenticated;

commit;
