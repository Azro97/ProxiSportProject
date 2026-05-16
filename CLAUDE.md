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
| Framework | **React Native (bare workflow, no Expo)** |
| Language | **TypeScript** (strict mode) |
| Navigation | `@react-navigation/native` + bottom tabs + native stack |
| Maps | `react-native-maps` |
| Geolocation | `@react-native-community/geolocation` + `PermissionsAndroid` (Android) |
| Backend | **Firebase Firestore** via `@react-native-firebase/firestore` (read-only from the app) |
| State | **Zustand** (one store per concern — see §5) |
| Data fetching | Direct Firestore SDK calls wrapped in services (no React Query for v1) |
| Styling | StyleSheet + a small `theme.ts` for sport colors |

> Do not introduce Redux, MobX, GraphQL, expo-location, or a custom backend layer. If something seems to need it, flag it first.

---

## 3. Folder structure

```
src/
├── app/                  # Root providers
│   └── providers/
│       └── LocationProvider.tsx
├── navigation/
│   ├── RootNavigator.tsx
│   └── BottomTabNavigator.tsx
├── screens/
│   ├── carte/
│   │   ├── CarteScreen.tsx
│   │   ├── components/   # TerrainModal, SportFloatingFilter
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

## 5. State management — filter logic

The **Matchs screen** uses a cascading filter with **multi-select** on regions and divisions:

```
1. Sport       →  single-select — unlocks Région row
2. Région      →  multi-select  — unlocks Division row (resets divisions when toggled)
3. Division    →  multi-select  — unlocks results
4. Date        →  always visible, defaults to today, manually editable
```

Fetch fires as soon as `sport` + at least one `region` + at least one `division` are set.  
Date is **always set** — it defaults to today on init and on sport change.

### `filtresStore.ts` (Zustand) — shape
```ts
type Filtre = {
  sport: string | null;
  regions: string[];       // multi-select
  departement: string | null;
  divisions: Division[];   // multi-select
  date: Date;              // never null — defaults to today
};

type FiltresStore = Filtre & {
  setSport: (s: string) => void;           // resets regions, divisions, date→today
  toggleRegion: (r: string) => void;       // add/remove region, resets divisions
  toggleDivision: (d: Division) => void;   // add/remove division
  setDate: (d: Date) => void;
  reset: () => void;
};
```

**Rules:**
- `setSport` resets `regions`, `divisions`, and resets `date` to today.
- `toggleRegion` resets `divisions` (region scope change invalidates division selection).
- `date` is initialised to `today()` (midnight local time) — never `null`.
- Do not add a `jourSemaine` field; it was removed.

### `locationStore.ts`
Holds `{ lat, lng, status: 'idle' | 'granted' | 'denied' }`. Set once at app launch via `@react-native-community/geolocation`. Carte screen reads from it; if denied, fall back to Paris centroid (do not block the app).

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
- Apply `where` clauses in this priority order: `sport`, `regions` (use `'in'` operator), `departement`, `divisions` (use `'in'` operator), then a date range on `dateHeure`.
- `date` is always set — always apply start-of-day / end-of-day range, no null check needed.
- For the mock path, use `Array.includes()` to filter against `regions[]` and `divisions[]`.
- Geographic radius filtering on `terrains` is done client-side (Haversine in `utils/geo.ts`) — Firestore geoqueries are out of scope for v1.

---

## 7. Screens — what each must do

### CarteScreen
- Centers on user GPS (`locationStore`); fallback to Paris centroid if permission denied.
- Renders one `Marker` per terrain returned by `getTerrainsByLocation`.
- Marker color = first sport in `terrain.sports[]` (use `theme.sportColors`).
- Tapping a marker opens `TerrainModal` showing the terrain name + the matches at that terrain (`getMatchsByTerrain`).
- Each match row in `TerrainModal` is tappable: closes the modal then navigates to `MatchDetail`.
- Floating sport filter chips (Foot / Basket / Hand / Volley) filter visible markers — this filter is **independent** of the Matchs screen filter store (local UI state on Carte).

### MatchsScreen
- Row 1: Sport selector (single-select).
- Row 2: Region chips (multi-select, visible after sport). Tapping a chip toggles it; toggling any chip resets divisions.
- Row 3: Division chips (multi-select, visible after ≥1 region selected).
- Row 4: Date chips (always visible, defaults to today, 7 upcoming days).
- Fetch fires as soon as sport + ≥1 region + ≥1 division are set (date always has a value).
- Results grouped via `grouperParDivision`, each group sorted by `dateHeure` ascending.
- `MatchCard` is tappable → navigates to `MatchDetail` screen.

### MatchDetailScreen
- Receives `{ matchId }` from navigation params.
- Loads match via `getMatchById`, shows teams, date, division, region, département.
- All user-facing strings use correct French UTF-8 characters (é, è, à, ê, etc.) — never use placeholder `?` or mojibake.

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

# run (Android)
npx react-native run-android

# run (iOS)
npx react-native run-ios

# start Metro bundler
npx react-native start

# type-check
npx tsc --noEmit

# lint (once configured)
npm run lint
```

---

## 12. Environment setup (new machine — Windows)

### Prerequisites (install once)

| Tool | How |
|---|---|
| **Node.js LTS** | https://nodejs.org |
| **Android Studio** | https://developer.android.com/studio |
| **Java 17** (JDK) | `winget install Microsoft.OpenJDK.17` in PowerShell |
| **Git** | https://git-scm.com |

> ⚠️ Java 17 is **required**. Java 21 (bundled with Android Studio) breaks AGP 7.x (`jlink` crash). Do not use `C:\Program Files\Android\Android Studio\jbr` as `JAVA_HOME`.

In **Android Studio SDK Manager**, verify these are installed:
- Android SDK Platform **33**
- Android SDK Build-Tools **33.0.0**
- NDK (Side by side) **23.1.7779620**
- CMake **3.22.1**

### Set JAVA_HOME permanently (Windows)

1. Search **"Edit system environment variables"** → Environment Variables
2. Under **User variables** → New: `JAVA_HOME` = `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot` *(adjust if different)*
3. Edit `Path` → Add `%JAVA_HOME%\bin`
4. Restart your terminal

### First-time project setup

```powershell
git clone https://github.com/Azro97/ProxiSportProject.git
cd ProxiSportProject
npm install
```

### Create `android/local.properties` (not in git — machine-specific)

Create the file `android/local.properties` with your SDK path (replace `YourUsername`):

```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Create `android/app/google-services.json` (not in git — secret)

Obtain the real file from the Firebase Console. For local dev without live Firebase, use this placeholder (mock data is used when `__DEV__ === true`):

```json
{
  "project_info": { "project_number": "000000000000", "project_id": "proxisport-placeholder", "storage_bucket": "proxisport-placeholder.appspot.com" },
  "client": [{ "client_info": { "mobilesdk_app_id": "1:000000000000:android:0000000000000000", "android_client_info": { "package_name": "com.PP" } }, "api_key": [{ "current_key": "placeholder" }], "services": { "appinvite_service": { "other_platform_oauth_client": [] } } }],
  "configuration_version": "1"
}
```

### Run the app

Start an AVD in Android Studio → Device Manager, then:

```powershell
# Terminal 1 — Metro bundler
npx react-native start

# Terminal 2 — build & install on emulator
npx react-native run-android
```

First build takes 5–10 minutes (downloads Gradle deps, Firebase BOM, etc.). Subsequent builds take ~30–60 seconds.

---

## 13. Known pending items (v1)

- **Firebase production config**: All 3 services (`matchsService`, `terrainsService`, `equipesService`) use `USE_MOCK = __DEV__`. To switch to real Firestore, set `USE_MOCK = false` and replace `android/app/google-services.json` with the real Firebase file.
- **`getRegions()` / `getDepartements()`**: Currently return hardcoded mock arrays. When `USE_MOCK` is false, these should fetch distinct values from Firestore (or be pre-seeded as a config collection).
- **Firestore composite indexes**: The multi-field `'in'` queries on `regions` + `divisions` + `dateHeure` will require composite indexes in the Firebase console before going to production.
- **`ClassementsScreen`**: Shows "Disponible prochainement" — out of scope for v1.

---

This is the single most violated rule, so it lives at the bottom for visibility:

> **`setSport` resets everything. `toggleRegion` resets divisions. `date` is never null. Fetch fires when sport + ≥1 region + ≥1 division are all set.**

If a change to the Matchs screen seems to need an exception to this rule, stop and ask.
