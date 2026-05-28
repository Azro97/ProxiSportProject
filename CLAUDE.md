# CLAUDE.md

> Guidance file for Claude Code when working on this repository.
> Read this **fully** before any non-trivial edit. The architecture and filter logic here are deliberate — do not "improve" them without asking.

---

## ⏸️ RESUME HERE (session interrupted 2026-05-28)

### Upgrade status
- ✅ `npm install` — RN 0.76.9, 943 packages
- ✅ `npx tsc --noEmit` — zero TypeScript errors
- ✅ Metro bundler: `npx react-native start --reset-cache` (start it before building)
- ✅ Emulator: `emulator-5554` — start before building

### Android build fixes applied (all permanent)

**`android/settings.gradle`** — two fixes:
1. Line 2: `apply plugin: "com.facebook.react.settings"` → `plugins { id("com.facebook.react.settings") }` (required in settings files to resolve from `pluginManagement { includeBuild }`)
2. Added `includeBuild("../node_modules/@react-native/gradle-plugin")` at top level (enables composite-build substitution for `buildscript` classpath)

**`android/build.gradle`** — explicit classpath versions (required when `--project-cache-dir` is used, as `ReactRootProjectPlugin` version injection doesn't apply):
```groovy
classpath("com.android.tools.build:gradle:8.6.0")
classpath("com.facebook.react:react-native-gradle-plugin:0.76.9")
```

**`android/gradlew.bat`** — `--project-cache-dir C:\Temp\pp-gradle` baked in permanently (fixes Windows ATOMIC_MOVE crash when project path contains spaces).

### How to build & install
```powershell
# Build (do NOT use installDebug — adb install hangs; install manually instead)
cd "C:\Users\User\Documents\Mobile Apps\DatingApp\ProxiSportProject\android"
.\gradlew.bat app:assembleDebug

# Install manually
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "app\build\outputs\apk\debug\app-debug.apk"

# Launch
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -n "com.PP/.MainActivity"
```

### Once app is verified running — commit
```powershell
cd "C:\Users\User\Documents\Mobile Apps\DatingApp\ProxiSportProject"
git add -A
git commit -m "chore: upgrade RN 0.72.7 -> 0.76.9, SDK 33->35, AGP 7->8.6; fix settings.gradle plugin block + includeBuild; explicit classpath versions; Windows ATOMIC_MOVE fix via project-cache-dir"
git push
```

### Constraints
- `adb` not in PATH — use `& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"` directly
- `react-native-maps` pinned to `1.20.0` — do not upgrade
- `android-36` junction in SDK platforms — harmless, ignore

---

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
│   ├── locationStore.ts
│   └── themeStore.ts     # dark/light mode toggle (added session 2025-05-25)
├── hooks/                # Shared custom hooks
│   └── useColors.ts      # returns active ColorPalette from themeStore
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
- Marker color = active sport filter chip (`sportColors[sportFilter]`); grey (`colors.textMuted`) when no filter. Marker key is `${terrain.id}-${sportFilter ?? 'all'}` to force unmount/remount on sport change (react-native-maps doesn't re-render on prop-only changes alone).
- Tapping a marker opens `TerrainModal` showing the terrain name + the matches at that terrain (`getMatchsByTerrain`).
- Each match row in `TerrainModal` is tappable: closes the modal then navigates to `MatchDetail`.
- Floating sport filter chips (Foot / Basket / Hand / Volley) filter visible markers — this filter is **independent** of the Matchs screen filter store (local UI state on Carte).

> ⚠️ `terrain.sports` has been removed from the `Terrain` model. Sport badges in `TerrainModal` are derived from the actual matches at that terrain (`[...new Set(matchs.map(m => m.sport))]`). Do not re-add `terrain.sports`.

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

> ⚠️ Java 17 is **required**. Java 21 (bundled with Android Studio) breaks the build. Do not use `C:\Program Files\Android\Android Studio\jbr` as `JAVA_HOME`.

In **Android Studio SDK Manager**, verify these are installed:
- Android SDK Platform **35** (vanilla — no `.1` or `-2` suffix)
- Android SDK Build-Tools **37.0.0** (or 36.1.0; 35.0.0 is not needed)
- NDK (Side by side) **26.1.10909125**
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

**Ask Azro for this file** — it contains the Firebase project credentials. Without it the app won't compile (Firebase Gradle plugin requires it at build time).

For local dev without live Firebase, a placeholder can be used (mock data is used when `__DEV__ === true`):

```json
{
  "project_info": { "project_number": "000000000000", "project_id": "proxisport-placeholder", "storage_bucket": "proxisport-placeholder.appspot.com" },
  "client": [{ "client_info": { "mobilesdk_app_id": "1:000000000000:android:0000000000000000", "android_client_info": { "package_name": "com.PP" } }, "api_key": [{ "current_key": "placeholder" }], "services": { "appinvite_service": { "other_platform_oauth_client": [] } } }],
  "configuration_version": "1"
}
```

### Create `android/keystore.properties` + `android/app/release.keystore` (release builds only)

> ⚠️ **Not needed for local dev** — only required if you are building a release APK for the Play Store.

**Ask Azro for both files** (never shared via GitHub — they are gitignored). Place them at:
- `android/keystore.properties`
- `android/app/release.keystore`

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

## 14. Pre-launch upgrade roadmap

> ✅ **React Native upgrade COMPLETE** — upgraded 0.72.7 → 0.76.9 (session 2026-05-28). See §15 changelog.

The app now runs **React Native 0.76.9** targeting **SDK 35** with AGP 8.6 + Gradle 8.10.2.

### Priority 2 — Further package upgrades (optional)

| Package | Current | Notes |
|---|---|---|
| `react-native-maps` | 1.20.0 (pinned) | 1.21+ requires react ≥ 18.3.1; upgrade when RN allows react 18.3 |
| `react-native-screens` | ^3.34.0 | Can upgrade to 4.x when ready |
| `@react-native-firebase/*` | ^20.5.0 | 21.x available — low priority |
| `typescript` | 5.0.4 | Can upgrade to 5.8.x — no breaking changes expected |

### Priority 3 — Android build cleanup ✅ Done

All AGP 7.x workarounds removed as part of the RN 0.76 upgrade:
- Gradle upgraded to 8.10.2
- AGP upgraded to 8.6.0
- Kotlin 1.9.24 set explicitly
- Flipper removed

### Priority 4 — iOS support

iOS has not been tested or configured. Before iOS launch:
- Add `ios/GoogleService-Info.plist` from Firebase Console
- Run `npx pod-install` inside `ios/`
- Test on Xcode simulator — **requires macOS** (Xcode cannot run on Windows; no workaround exists)
  - Alternatives if you don't own a Mac:
    - **Cloud Mac**: MacStadium / MacinCloud — rent a remote Mac for builds
    - **GitHub Actions**: use a `macos-latest` runner to build the IPA in CI
    - **EAS Build** (`eas build --platform ios`): Expo's cloud Mac servers build for you (requires migrating to EAS workflow)
- `@react-native-community/geolocation` iOS permission strings must be added to `Info.plist`

---

This is the single most violated rule, so it lives at the bottom for visibility:

> **`setSport` resets everything. `toggleRegion` resets divisions. `date` is never null. Fetch fires when sport + ≥1 region + ≥1 division are all set.**

If a change to the Matchs screen seems to need an exception to this rule, stop and ask.

---

## 15. Changelog — session history

### Session: 2026-05-25 — Light mode + Dark mode toggle

#### 1. Removed `terrain.sports` field
- **`src/models/Terrain.ts`** — removed `sports: string[]` field. Terrain is now pure location data (`id, nom, adresse, ville, lat, lng`).
- **`src/services/mockData.ts`** — removed all `sports: [...]` arrays from every terrain object (21 terrains).
- **`src/screens/carte/components/TerrainModal.tsx`** — sport badges now derived from `[...new Set(matchs.map(m => m.sport))]` (actual match data) instead of `terrain.sports`.
- **Rationale**: `terrain.sports` could drift out of sync with actual match data (a match at a gymnasium for a sport not listed in `terrain.sports`). Removing it ensures sports shown on a terrain are always accurate.

#### 2. Map pin colors per sport filter
- **`src/screens/carte/CarteScreen.tsx`** — `<Marker>` key changed to compound `${terrain.id}-${sportFilter ?? 'all'}` to force unmount/remount on sport change (react-native-maps doesn't re-render on prop-only changes).
- `pinColor` now uses `sportColors[sportFilter]` when a filter is active, `colors.textMuted` (grey) when showing all.

#### 3. MatchDetailScreen full redesign
- **`src/screens/MatchDetailScreen.tsx`** — complete UI overhaul:
  - Custom back button (no native header — `headerShown: false` in RootNavigator).
  - Hero section: sport-colored top strip + sport chip + division pill + VS block with team names.
  - Info cards section: Date & heure, Terrain (fetched via `getTerrainById`), Localisation, Compétition.
  - Uses `useSafeAreaInsets` for safe area padding.
- **`src/navigation/RootNavigator.tsx`** — set `headerShown: false` for MatchDetail route.

#### 4. Map overlays switched to white/light style
- Dark map style (`customMapStyle`) was attempted but silently ignored on Android without a Maps Styling-enabled API key. Feature was permanently rolled back.
- **`src/screens/carte/CarteScreen.tsx`** — header card, FAB now use white bg + grey borders + elevation shadows for visibility on the standard (white) map.
- **`src/screens/carte/components/SportFloatingFilter.tsx`** — chips use white bg (inactive) / solid sport color (active) with grey borders.

#### 5. Full app light mode — theme.ts refactored
- **`src/theme.ts`** — complete rewrite:
  - Added `lightColors` (white/light palette) and `darkColors` (dark palette) as separate named exports.
  - Added `ColorPalette` type (derived from `typeof lightColors`) for use in `makeStyles(colors: ColorPalette)` pattern.
  - `colors` kept as a backward-compat alias pointing to `lightColors`.
  - `sportColorsSoft` opacity reduced from `0.15` → `0.12` for light backgrounds.
  - `radii` export: `{ chip:999, tag:10, input:12, card:16, sheet:24, cta:14 }`.
  - Removed duplicate `radii` + `theme` declarations that caused Metro `SyntaxError: Identifier 'radii' has already been declared`.

#### 6. Dark mode toggle — themeStore + useColors hook
- **`src/stores/themeStore.ts`** *(new file)* — Zustand store with `isDark: boolean` + `toggleTheme()`.
- **`src/hooks/useColors.ts`** *(new file)* — `useColors()` hook returns `darkColors` or `lightColors` based on `themeStore.isDark`.
- All StyleSheets converted from `const styles = StyleSheet.create({...})` (static, module-level) to `function makeStyles(colors: ColorPalette)` (dynamic, called inside component with `useMemo`).

#### 7. Files converted to dynamic theming (useColors hook)
All files below now import `useColors()` instead of the static `colors` constant:

| File | Change |
|---|---|
| `src/navigation/BottomTabNavigator.tsx` | Inline `tabBarStyle` using `colors.*`, removed static StyleSheet |
| `src/screens/ClassementsScreen.tsx` | `makeStyles(colors)`, removed hardcoded hex strings |
| `src/screens/matchs/MatchsScreen.tsx` | `makeStyles`, `makeEmptyStyles`, dynamic `StatusBar barStyle` |
| `src/screens/MatchDetailScreen.tsx` | `makeStyles`, dynamic `StatusBar barStyle`, fixed rgba fallbacks |
| `src/screens/carte/CarteScreen.tsx` | `makeStyles`, dynamic `StatusBar`, removed hardcoded hex strings |
| `src/screens/carte/components/TerrainModal.tsx` | `makeStyles` |
| `src/screens/carte/components/SportFloatingFilter.tsx` | `makeStyles`, removed hardcoded `#ffffff`/`#374151`/`#d1d5db` |
| `src/screens/matchs/components/MatchCard.tsx` | `makeStyles` |
| `src/screens/matchs/components/MatchGroupList.tsx` | `makeStyles` |
| `src/screens/matchs/components/SportSelector.tsx` | `makeStyles` |
| `src/screens/matchs/components/DateFilter.tsx` | `makeStyles`, replaced `require('../../../theme').sportColors` with direct import |
| `src/screens/matchs/components/GeoFilter.tsx` | `makeStyles`, replaced `require('../../../theme').sportColors` with direct import |
| `src/screens/matchs/components/AffinerFilter.tsx` | `makeStyles` |

#### 8. Dark mode toggle button — Matchs screen header
- **`src/screens/matchs/MatchsScreen.tsx`** — added a circular `TouchableOpacity` button in the top-right of the header.
  - Shows **Moon** icon in light mode → tap to switch to dark.
  - Shows **Sun** icon in dark mode → tap to switch to light.
  - `StatusBar barStyle` switches between `"dark-content"` (light mode) and `"light-content"` (dark mode) everywhere.

#### Architecture rule added
- `makeStyles(colors: ColorPalette)` pattern is now the standard for all components. Never use module-level `StyleSheet.create` with `colors.*` tokens — colors are resolved at render time from the active theme.

---

### Session: 2026-05-28 — Play Store blockers + RN 0.72.7 → 0.76.9 upgrade

#### 1. Release keystore generated
- **`android/app/release.keystore`** *(gitignored)* — RSA 2048, 10 000-day validity, alias `proxiSport`, owner `Azro Lamfi`. **Ask Azro for the file and passwords — never commit it.**
- **`android/keystore.properties`** *(gitignored)* — contains `storeFile`, `storePassword`, `keyAlias`, `keyPassword`. **Also ask Azro — never commit it.**
- **`.gitignore`** — confirmed `*.keystore` (except `debug.keystore`) and `android/keystore.properties` are ignored.

#### 2. `android/app/build.gradle` — release signing + Proguard
- Keystore loaded at top of file via `def keystorePropertiesFile = rootProject.file("keystore.properties")`.
- `signingConfigs.release` uses `keystoreProperties.*` values (falls back to no-op if file is absent — debug builds unaffected).
- `buildTypes.release.minifyEnabled true`, `enableProguardInReleaseBuilds = true` (was `false`).
- JSC dependency removed — Hermes is the only JS engine in RN 0.76+.
- Native modules applied with try/catch to avoid build failure if file is temporarily missing.

#### 3. React Native upgrade: 0.72.7 → 0.76.9

##### Why
RN 0.72.7 uses AGP 7.x which cannot target SDK 35+ (required by Play Store from August 2025). Upgrading to RN 0.76 brings AGP 8.x + Gradle 8.10.2, enabling SDK 35.

##### `package.json` changes
| Package | Before | After |
|---|---|---|
| `react-native` | `0.72.7` | `0.76.9` |
| `react` | `18.3.2` | `18.2.0` (required by RN 0.76.9) |
| `react-native-maps` | `^1.14.0` | `1.20.0` (exact pin — 1.21+ requires react ≥ 18.3.1) |
| `react-native-safe-area-context` | `^4.7.4` | `^4.11.0` |
| `react-native-screens` | `^3.22.1` | `^3.34.0` |
| `react-native-svg` | `^14.x` | `^15.0.0` |
| `@react-native-firebase/app` | `^18.7.3` | `^20.5.0` |
| `@react-native-firebase/firestore` | `^18.7.3` | `^20.5.0` |
| `@react-native/babel-preset` | *(absent)* | `^0.76.9` |
| `@react-native/eslint-config` | *(absent)* | `^0.76.9` |
| `@react-native/metro-config` | *(absent)* | `^0.76.9` |
| `@react-native/typescript-config` | *(absent)* | `^0.76.9` |
| `@react-native-community/cli` | *(absent)* | `14.1.2` (devDep — required to run `react-native run-android`) |

##### `android/build.gradle` changes
```gradle
buildToolsVersion = "37.0.0"   // was "30.0.3" (35.0.0 not installed, 37.0.0 backward-compat)
minSdkVersion = 24              // unchanged
compileSdkVersion = 35          // was 33
targetSdkVersion = 35           // was 33
ndkVersion = "26.1.10909125"    // was "23.1.7779620"
kotlinVersion = "1.9.24"        // was not set
```
AGP classpath: `com.android.tools.build:gradle:8.6.0` (was `7.4.2`).

##### `android/gradle/wrapper/gradle-wrapper.properties`
`distributionUrl` changed to `gradle-8.10.2-all.zip` (was `gradle-8.5-all.zip`).

##### `android/gradle.properties`
- Removed Flipper (`FLIPPER_VERSION` line).
- Added `android.suppressUnsupportedCompileSdk=35`.
- Added `newArchEnabled=false`, `hermesEnabled=true`, `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`.

##### `android/settings.gradle`
Rewritten to RN 0.76 format:
```gradle
pluginManagement { includeBuild("../node_modules/@react-native/gradle-plugin") }
apply plugin: "com.facebook.react.settings"
extensions.configure(com.facebook.react.ReactSettingsExtension){ ex -> ex.autolinkLibrariesFromCommand() }
rootProject.name = 'PP'
include ':app'
```

##### `babel.config.js`
Preset changed from `module:metro-react-native-babel-preset` to `module:@react-native/babel-preset`.

#### 4. SDK 35 setup (Android)
- `android-35` (vanilla, no suffix) installed via Android Studio SDK Manager.
- Build-tools `35.0.0` was not available — using `37.0.0` (backward compatible).
- `android-36` junction was created pointing to `android-36.1` during earlier experiments but was causing aapt2 errors (Android 16 resource format incompatible with AGP 7.x). Left in place after RN upgrade succeeded.

#### 5. Environment notes (updated)
> ⚠️ The §12 environment setup table is now outdated. For RN 0.76, install:
> - **Android SDK Platform 35** (vanilla — no `.1` or `-2` suffix)
> - **Build-Tools 37.0.0** (or 36.1.0 — both work; 35.0.0 is not needed)
> - **NDK 26.1.10909125** (not 23.1.7779620)
> - **AGP 8.6.0** is bundled — Java 17 still required
> - `@react-native-community/cli` must be in `devDependencies` (RN 0.76 no longer bundles it)

#### 6. TypeScript — zero errors after upgrade
`npx tsc --noEmit` returned no errors after all package upgrades. No source file changes were needed for the RN 0.76 migration.

