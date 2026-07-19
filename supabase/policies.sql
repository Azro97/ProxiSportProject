-- ProxiSport — RLS policies + RPC functions
-- Run after schema.sql. The app has no end-user auth (see CLAUDE.md — no
-- signup/login in v1); these policies reproduce the same public-read /
-- narrow-write exposure the app already has, no more, no less.

alter table regions       enable row level security;
alter table departements  enable row level security;
alter table terrains      enable row level security;
alter table equipes       enable row level security;
alter table matchs        enable row level security;
alter table tournois      enable row level security;
alter table inscriptions  enable row level security;

create policy "public read" on regions      for select using (true);
create policy "public read" on departements for select using (true);
create policy "public read" on terrains     for select using (true);
create policy "public read" on equipes      for select using (true);
create policy "public read" on matchs       for select using (true);
create policy "public read" on tournois     for select using (true);
create policy "public read" on inscriptions for select using (true);

-- Admin tournament creation (adminStore's login gate is client-side only,
-- same trust level Firestore would have had with an open ruleset).
create policy "public insert" on tournois for insert with check (true);

-- Inscriptions has NO direct insert policy — the only write path is the
-- create_inscription() RPC below, so the equipes_inscrites counter can
-- never drift out of sync (this fixes a real bug in the old Firestore
-- code, where the prod branch never incremented it — see tournoiService.ts).

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
as $$
declare
  v_id text := 'ins_' || floor(extract(epoch from clock_timestamp()) * 1000)::text;
begin
  insert into inscriptions (
    id, tournoi_id, equipe_id, equipe_nom, capitaine_email, membres, statut, montant_paye
  ) values (
    v_id, p_tournoi_id, 'eq_' || v_id, p_equipe_nom, p_capitaine_email, p_membres, 'confirmée', p_montant_paye
  );

  update tournois set equipes_inscrites = equipes_inscrites + 1 where id = p_tournoi_id;

  return v_id;
end;
$$;
grant execute on function create_inscription to anon;
