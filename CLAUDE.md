# CLAUDE.md

> Guidance file for Claude Code when working on this repository.
> Read this **fully** before any non-trivial edit. The architecture and filter logic here are deliberate — do not "improve" them without asking.

---

## 1. Project overview

**Application Sportive Régionale** — a mobile app that lets users discover sports matches happening near them, on real fields/stadiums, across 4 sports: **Football, Basketball, Handball, Volleyball**.

The app has **two main screens** behind a tab bar, after a one-time GPS permission prompt at launch:

- **Carte** — fullscreen Google Maps with field markers around the user's GPS position. Tapping a marker opens a modal listing matches at that field.
- **Matchs** — a filtered list of matches grouped by division and sorted by kickoff time.

There is **no auth, no signup, no user profile** in the consumer app. Admins enter matches/teams/fields through a separate path (out of scope for the mobile app — see UC8/UC9, treat as backend-only).

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | **React Native + Expo (managed workflow)** |
| Language | **TypeScript** (strict mode) |
| Navigation | `@react-navigation/native` + bottom tabs |
| Maps | `react-native-maps` (Expo config plugin) |
| Geolocation | `expo-location` |
| Backend | **Firebase Firestore** (read-only from the app) |
| State | **Zustand** (one store per concern — see §5) |
| Data fetching | Direct Firestore SDK calls wrapped in services (no React Query for v1) |
| Styling | StyleSheet + a small `theme.ts` for sport colors |

> Do not introduce Redux, MobX, GraphQL, or a custom backend layer. If something seems to need it, flag it first.

---

## 3. Folder structure

```
src/
├── app/                  # Navigation, root providers, app entry
│   ├── App.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── TabNavigator.tsx
│   └── providers/
├── screens/
│   ├── carte/
│   │   ├── CarteScreen.tsx
│   │   ├── components/   # MarkerSport, TerrainModal, SportFloatingFilter
│   │   └── hooks/
│   └── matchs/
│       ├── MatchsScreen.tsx
│       ├── components/   # SportSelector, GeoFilter, DateFilter, MatchCard, MatchGroupList
│       └── hooks/
├── components/           # Cross-screen reusable UI only
├── services/             # Firestore access layer — see §6
│   ├── firebase.ts
│   ├── terrainsService.ts
│   ├── matchsService.ts
│   └── equipesService.ts
├── stores/               # Zustand stores — see §5
│   ├── filtresStore.ts
│   └── locationStore.ts
├── models/               # TS types mirroring Firestore docs
│   ├── Terrain.ts
│   ├── Equipe.ts
│   ├── Match.ts
│   └── Filtre.ts
├── utils/                # date helpers, grouping, geo math
└── theme.ts              # sport colors, spacing, typography tokens
```

**Rules:**
- Screens own their feature-specific components (`screens/<feature>/components/`). Only promote to `src/components/` when used by 2+ screens.
- Services never import from `stores/` or `screens/` — one-way dependency: `screens → stores → services → firebase`.
- `models/` contains pure TS types only, no logic.

---

## 4. Domain model (Firestore)

Three top-level collections. Schemas mirror the conception doc exactly — **do not rename fields**, the data is already seeded with these names.

### `terrains/{id}`
```ts
{
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  lat: number;
  lng: number;
  sports: string[];      // e.g. ["foot", "basket"]
}
```

### `equipes/{id}`
```ts
{
  id: string;
  nom: string;
  sport: string;
  region: string;
  departement: string;
}
```

### `matchs/{id}`
```ts
{
  id: string;
  sport: string;          // "foot" | "basket" | "hand" | "volley"
  equipeA_id: string;
  equipeA_nom: string;    // denormalized for list rendering
  equipeB_id: string;
  equipeB_nom: string;    // denormalized
  terrain_id: string;
  dateHeure: Timestamp;   // Firestore Timestamp, convert to Date in services
  division: string;       // "Nationale" | "Régionale" | "Départementale"
  region: string;
  departement: string;
}
```

> `equipeA_nom` / `equipeB_nom` are denormalized on purpose — match cards render without joining `equipes`. Keep them in sync if you ever write matches from the app (you won't, in v1).

---

## 5. State management — filter cascade

The **Matchs screen** uses a strict cascading filter order. This is a product requirement, not a UX suggestion:

```
1. Sport       →  unlocks Région
2. Région      →  unlocks Division (Nationale / Régionale / Départementale)
3. Division    →  unlocks Date (Aujourd'hui / Lun / Mar / … / picker JJ/MM)
4. Date        →  triggers fetch
```

Each level is **disabled** in the UI until the previous one is set. Never show all filters active simultaneously.

### `filtresStore.ts` (Zustand) — shape
```ts
type Filtres = {
  sport: string | null;
  region: string | null;
  departement: string | null;
  division: 'Nationale' | 'Régionale' | 'Départementale' | null;
  date: Date | null;
  jourSemaine: string | null;
};

type FiltresStore = Filtres & {
  setSport: (s: string) => void;          // resets region, division, date
  setRegion: (r: string, d?: string) => void;  // resets division, date
  setDivision: (d: Filtres['division']) => void;  // resets date
  setDate: (d: Date) => void;
  reset: () => void;
};
```

Setting a higher-level filter **must reset all lower-level filters** — this is the part that's easy to get wrong. Centralize that logic in the store, not in components.

### `locationStore.ts`
Holds `{ lat, lng, status: 'idle' | 'granted' | 'denied' }`. Set once at app launch via `expo-location`. Carte screen reads from it; if denied, fall back to a default region centroid (do not block the app).

---

## 6. Services layer

All Firestore reads go through `services/*.ts`. Components and stores **never** call `firebase/firestore` directly.

Required functions (signatures fixed — match the class diagram):

```ts
// terrainsService.ts
getTerrainsByLocation(lat: number, lng: number, rayonKm: number): Promise<Terrain[]>
getTerrainById(id: string): Promise<Terrain | null>

// matchsService.ts
getMatchs(filtres: Filtre): Promise<Match[]>
getMatchsByTerrain(terrainId: string): Promise<Match[]>
grouperParDivision(matchs: Match[]): Record<string, Match[]>
grouperParDate(matchs: Match[]): Record<string, Match[]>
```

**Query rules:**
- Apply `where` clauses in this priority order: `sport`, `region`/`departement`, `division`, then a date range on `dateHeure`. This matches Firestore's composite index efficiency.
- For "Aujourd'hui" / weekday filters, compute start-of-day and end-of-day in **local time**, then pass as Firestore `Timestamp`. Do not filter on the client after fetch.
- Geographic radius filtering on `terrains` is done client-side (Haversine in `utils/geo.ts`) — Firestore geoqueries are out of scope for v1.

---

## 7. Screens — what each must do

### CarteScreen
- Centers on user GPS (`locationStore`); fallback to a default if permission denied.
- Renders one `Marker` per terrain returned by `getTerrainsByLocation`.
- Marker color = first sport in `terrain.sports[]` (use `theme.sportColors`).
- Tapping a marker opens `TerrainModal` showing the terrain name + the matches at that terrain (`getMatchsByTerrain`).
- Floating sport filter chips (Foot / Basket / Hand / Volley) filter visible markers — this filter is **independent** of the Matchs screen filter store (it's a local UI state on Carte).

### MatchsScreen
- Renders the 4 cascading filter rows from §5. Each row is disabled until the previous is set.
- Once `date` is set, fetches via `getMatchs(filtres)`, groups via `grouperParDivision`, sorts each group by `dateHeure` ascending.
- `MatchCard` displays: `equipeA_nom vs equipeB_nom`, time, terrain name + ville, division.

---

## 8. Conventions

- **TypeScript strict** is on. No `any`. Use `unknown` + narrowing if you must.
- **Functional components only**, hooks for everything.
- **One default export per file**, named the same as the file.
- File naming: PascalCase for components (`MatchCard.tsx`), camelCase for everything else (`matchsService.ts`, `useFiltres.ts`).
- Keep components under ~200 lines. Extract sub-components or hooks past that.
- French is the user-facing language (labels, screen titles). Code identifiers stay in English **except** the domain words already in French in the spec (`terrains`, `equipes`, `matchs`, `filtres`, `division`, `dateHeure`, `region`, `departement`) — those stay French to match Firestore.
- Inline comments and special markers (`// TODO`, `// NOTE`) must be preserved during edits.

---

## 9. When editing files

Per the user's working preferences:

- **Never edit the same file in place when shipping a fix.** Produce a **new file with the same name**, fully written, with the fix applied. The user will swap it in.
- For a logic/TS error in a screen file, return the **complete `.tsx`**, not a diff or a snippet.
- For large files where a full rewrite is overkill, return the affected method(s) **plus** an unambiguous indication of where they go (which class/file, between which existing markers).
- Before any backend/service change, walk the dependency chain (model → service → store → screen) and call out which layers are impacted.
- Root-cause first, fix second. Don't patch symptoms.

---

## 10. Out of scope for v1 — do not add

- Authentication / user accounts
- Push notifications
- Offline mode / caching beyond what RN gives for free
- Match detail screen with stats (UC7 stops at the modal/list level for v1)
- Admin flows in the mobile app (UC8, UC9 are backend-only)
- Internationalization framework — strings are inline French

If the user asks for any of these, confirm scope before scaffolding.

---

## 11. Useful commands

```bash
# install
npm install

# run
npx expo start

# type-check
npx tsc --noEmit

# lint (once configured)
npm run lint
```

---

## 12. Quick reference — the filter contract

This is the single most violated rule, so it lives at the bottom for visibility:

> **Setting filter level N resets all levels > N. The UI for levels > N is disabled until level N is set. The fetch only fires when all 4 levels (sport, region, division, date) are set.**

If a change to the Matchs screen seems to need an exception to this rule, stop and ask.
