-- ProxiSport — Supabase schema
-- Mirrors src/models/*.ts. Columns are snake_case (internal DB detail); each
-- service's row-mapper translates to/from the camelCase TS field names —
-- see CLAUDE.md for why the TS-facing names themselves must never change.

create extension if not exists postgis;

-- ── Reference data ──────────────────────────────────────────────────────────

create table regions (
  id  text primary key,
  nom text not null unique
);

create table departements (
  id        text primary key,
  region_id text not null references regions(id),
  nom       text not null
);

-- ── Terrains (geo-indexed for radius search) ────────────────────────────────

create table terrains (
  id      text primary key,
  nom     text not null,
  adresse text not null,
  ville   text not null,
  lat     double precision not null,
  lng     double precision not null,
  geog    geography(Point, 4326)
            generated always as (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) stored
);
create index terrains_geog_idx on terrains using gist (geog);

-- ── Equipes ──────────────────────────────────────────────────────────────────

create table equipes (
  id          text primary key,
  nom         text not null,
  sport       text not null,
  region      text not null,
  departement text not null
);
create index equipes_sport_idx on equipes (sport);

-- ── Matchs ───────────────────────────────────────────────────────────────────

create table matchs (
  id           text primary key,
  sport        text not null,
  equipe_a_id  text not null references equipes(id),
  equipe_a_nom text not null,
  equipe_b_id  text not null references equipes(id),
  equipe_b_nom text not null,
  terrain_id   text not null references terrains(id),
  date_heure   timestamptz not null,
  division     text not null,
  region       text not null,
  departement  text not null,
  statut       text,
  score_a      integer,
  score_b      integer
);
create index matchs_sport_idx      on matchs (sport);
create index matchs_region_idx     on matchs (region);
create index matchs_division_idx   on matchs (division);
create index matchs_date_heure_idx on matchs (date_heure);
create index matchs_terrain_idx    on matchs (terrain_id);
create index matchs_equipe_a_idx   on matchs (equipe_a_id);
create index matchs_equipe_b_idx   on matchs (equipe_b_id);

-- ── Tournois ─────────────────────────────────────────────────────────────────

create table tournois (
  id                       text primary key,
  nom                      text not null,
  sport                    text not null,
  description              text not null,
  photo_url                text,
  terrain_id               text references terrains(id),
  terrain_nom              text not null,
  terrain_ville            text not null,
  organisateur_id          text not null,
  organisateur_nom         text not null,
  date_debut               timestamptz not null,
  date_fin                 timestamptz not null,
  date_cloture_inscription timestamptz not null,
  prix_inscription         integer not null,
  max_equipes              integer not null,
  equipes_inscrites        integer not null default 0,
  taille_equipe            integer not null,
  statut                   text not null,
  region                   text not null,
  departement              text not null
);
create index tournois_sport_idx  on tournois (sport);
create index tournois_region_idx on tournois (region);

-- ── Inscriptions ─────────────────────────────────────────────────────────────

create table inscriptions (
  id                       text primary key,
  tournoi_id               text not null references tournois(id),
  equipe_id                text not null,
  equipe_nom               text not null,
  capitaine_uid            text not null default 'user_mock',
  capitaine_email          text not null,
  membres                  text[] not null,
  date_inscription         timestamptz not null default now(),
  statut                   text not null,
  stripe_payment_intent_id text,
  montant_paye             integer
);
create index inscriptions_tournoi_idx on inscriptions (tournoi_id);
