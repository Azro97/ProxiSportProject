# CLAUDE.md

## Prerequisites

1. Android emulator running (Pixel, API 35, x86_64)
2. NDK `30.0.14904198` installed — SDK Manager → SDK Tools → NDK (Side by side)
3. Gradle cache dir exists (Windows): `New-Item -ItemType Directory -Force -Path C:\Temp\pp-gradle`
4. Dependencies installed: `npm install` (also auto-applies patches via postinstall)
5. Metro bundler running from the project root: `npx react-native start`
6. **Windows long paths enabled** (`LongPathsEnabled=1` under `HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem`, or Settings → "For developers" → "End-to-end long paths") + a **restart** after enabling. Without this, a fresh/cold native build fails with `ninja: error: Stat(...) Filename longer than 260 characters` on `react-native-safe-area-context`'s C++ codegen — this can stay latent for a long time because Gradle/CMake caches the native build, then suddenly reappears the next time something (e.g. an `npm install` that changes `node_modules`) forces a clean native reconfigure.

## Build & Run

Run these from the **project root** folder:

```powershell
# 1 - Build
cd android
.\gradlew.bat app:assembleDebug
cd ..

# 2 - Install  (do NOT use installDebug - it hangs; install manually)
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "android\app\build\outputs\apk\debug\app-debug.apk"

# 3 - Launch
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -n "com.PP/.MainActivity"
```

> `adb` is not in PATH on Windows - always use the full `$env:LOCALAPPDATA` path above.
> SDK default location: `%LOCALAPPDATA%\Android\Sdk`. If yours differs, adjust the adb path.

## What was changed to get RN 0.76.9 running

| File | Change | Why |
|---|---|---|
| `android/app/src/main/java/com/pp/MainApplication.java` | `SoLoader.init(this, OpenSourceMergedSoMapping.INSTANCE)` + `getReactHost()` override | New arch: merged SO mapping + ReactHost |
| `android/app/src/debug/java/com/pp/ReactNativeFlipper.java` | No-op stub | Flipper removed in RN 0.74+ |
| `android/build.gradle` | `ndkVersion = \"30.0.14904198\"` | Required by RN 0.76.9 |
| `android/gradle.properties` | `newArchEnabled=true`, `reactNativeArchitectures=x86_64`, parallel + caching | New arch; faster dev builds |
| `android/gradlew.bat` | `--project-cache-dir C:\Temp\pp-gradle` baked in | Fixes Windows ATOMIC_MOVE crash (path has spaces) |
| `android/settings.gradle` | Plugin block syntax + `includeBuild` for gradle-plugin | Composite build resolution |
| `patches/react-native-svg+15.15.5.patch` | `StyleSizeLength` to `StyleLength` in C++ | Yoga API renamed in RN 0.76 |
| `patches/@react-native-community+cli-platform-android+14.1.2.patch` | Duplicate task guard + pipe deadlock fix | Gradle autolinking crash |
| `package.json` | `patch-package` dev dependency + `postinstall` script | Preserves patches across npm install |

> **Release APK**: restore `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` in `android/gradle.properties`.
> **Windows path with spaces**: `gradlew.bat` uses `--project-cache-dir C:\Temp\pp-gradle`. Create it if missing: `New-Item -ItemType Directory -Path C:\Temp\pp-gradle`

## Release / Deploy to Android

> No Metro or emulator needed — the JS bundle is embedded in the build.

**One-time setup (per machine):**

1. Generate `release.keystore` (only once ever — losing it means you can never update the app on Play Store):
   ```powershell
   keytool -genkeypair -v -keystore android/release.keystore -alias proxiSport -keyalg RSA -keysize 2048 -validity 10000
   ```
   Use password: `Proxi_Sport2026TemaraParis?`

2. Create `android/keystore.properties` (gitignored — recreate manually on each build machine):
   ```
   storeFile=release.keystore
   storePassword=Proxi_Sport2026TemaraParis?
   keyAlias=proxiSport
   keyPassword=Proxi_Sport2026TemaraParis?
   ```

**Before every release build:**

- Restore all ABIs in `android/gradle.properties`:
  ```
  reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
  ```

**Build release AAB** (Play Store requires `.aab`, not `.apk`):
```powershell
cd android
.\gradlew.bat app:bundleRelease
# output: android/app/build/outputs/bundle/release/app-release.aab
```

**Play Store:** upload the `.aab` via Google Play Console. Needs a developer account + app listing.

---

## Completed Features

| Feature | Details |
|---|---|
| MapLibre + tile proxy | `@maplibre/maplibre-react-native@10.4.2`, OpenFreeMap tiles, local proxy on port 7777 |
| Match list (upcoming) | Sport / région / division / date filters via Zustand `filtresStore` |
| Match results (scores) | Résultats tab in MatchsScreen, `scoreA`/`scoreB` on Match model |
| Match detail | `MatchDetailScreen` — venue, date, teams, score if played |
| Team search | `ClassementsScreen` — text + sport filter, navigable from loupe button in MatchsScreen header |
| Team detail | `TeamDetailScreen` — team info + match history with scores |
| Tournament list | `TournoiListScreen` — sport + statut filter pills, pull-to-refresh |
| Tournament detail | `TournoiDetailScreen` — hero photo, info grid, inscription CTA, back button (safe area aware) |
| Inscription modal | 3-step: form (nom équipe + email + membres pre-filled with `tailleEquipe` slots) → recap → success |
| Navigation | 3-tab bottom nav (Carte / Matchs / Tournois) + RechercheEquipes as stack screen |
| Safe area | All screens use `useSafeAreaInsets` or `SafeAreaView` from `react-native-safe-area-context` |
| Tab bar safe area | `height: 60 + insets.bottom` — gesture nav phones handled |
| GPS intro screen | First-launch onboarding with animated dot, "Autoriser" / "Passer", persisted via AsyncStorage |
| Backend: Supabase | Migrated off Firebase Firestore entirely — see "Backend migration" section above. All 4 services live on Supabase; no mock data path remains anywhere in the app. |

## TODO — Remaining work

### High priority (needed for real users)

- [ ] **Authentication** — No login/signup flow. `Inscription.capitaine_uid` requires a real user. Use Supabase Auth (email/password or OAuth). Add `AuthScreen` + guard navigation behind auth state. Note: RLS in `supabase/policies.sql` is currently designed for the zero-auth case (public read, RPC-gated write) — adding real auth means revisiting those policies, not just bolting a login screen on top.
- [ ] **Mes inscriptions** — After signing up for a tournament there is no screen to view registrations. Add a "Mes tournois" section (stack screen or new tab) reading the Supabase `inscriptions` table filtered by `capitaine_uid`.
- [ ] **Payment (Stripe)** — `Inscription.stripe_payment_intent_id` exists but the modal just shows a mock confirmation. Integrate `@stripe/stripe-react-native`, create a Cloud Function to generate a `PaymentIntent`, present the payment sheet in step 2 of `InscriptionModal`.

### Medium priority (UX polish)

- [ ] **Dark mode toggle** — Removed from all screens. `themeStore` still exists. Add a toggle in a settings screen or a long-press gesture somewhere.
- [ ] **Live match indicator** — `liveRed` color in theme, `LiveDot` component exists in the other frontend. Port to `MatchCard` / `MatchsScreen` for in-progress matches.
- [ ] **Create / join a team** — Users can search and view teams but cannot create one. Add a "Créer mon équipe" CTA in `ClassementsScreen` (team search screen).
- [ ] **Error states** — No UI shown when Supabase/network fails. Add error boundaries or inline error views.

### Before production

- [x] Switch off mock data — done; `USE_MOCK` flags and `src/services/mock/mockData.ts` have since been removed entirely, see "Backend migration" above
- [ ] Full on-device emulator pass of the Supabase cutover (Carte, Matchs, Résultats, team search, tournaments, admin flow, registration) — blocked on a Windows long-path restart, not yet re-verified visually
- [ ] Algolia integration for team search (see §1 in "Before deploying to production" below) — still relevant on Supabase; `searchEquipes` now does a real server-side `ilike` instead of Firestore's full-fetch-then-filter, which is fine at current scale (70 équipes) but Algolia is still the right call at real-world scale
- [ ] App icons + splash screen (both platforms)
- [ ] iOS first-time setup (CocoaPods, Xcode signing)
- [ ] Release keystore + `reactNativeArchitectures` restored for multi-ABI APK

## Architecture

- Stack: React Native (bare), TypeScript, Zustand, **Supabase (Postgres + PostGIS)**, MapLibre GL
- Dependency direction: `screens -> stores -> services -> supabase` (one-way)
- Map library: `@maplibre/maplibre-react-native@10.4.2` (pinned — v11+ requires React 19)

## Backend migration: Firebase Firestore → Supabase (2026-07-19)

The app **no longer uses Firebase**. `@react-native-firebase/app` and `@react-native-firebase/firestore` were removed from `package.json`; `src/services/firebase.ts` was replaced by `src/services/supabase.ts` (a single `createClient()` singleton, config via `.env` / `react-native-dotenv`, `@env` module — see `src/env.d.ts`).

**Why:** Firestore has no spatial index, so `getTerrainsByLocation()` did a full-collection scan + client-side Haversine filter — this scaled badly on both cost and query latency as terrain count grew. Supabase/PostGIS gives an indexed radius query natively. Since the app had never actually run against a live Firestore project (`google-services.json` was always a placeholder, `USE_MOCK` was hardcoded `true` everywhere), there was no live data to migrate — only the mock dataset needed to become the Postgres seed.

**What changed, concretely:**
- All 4 services (`terrainsService`, `equipesService`, `matchsService`, `tournoiService`) were rewritten to call `supabase` instead of `firestore()`, keeping every exported function's name/signature/return shape **identical** — zero screen or store files changed.
- Postgres schema lives in `supabase/schema.sql` (tables, snake_case columns, PostGIS `geography` column + GIST index on `terrains`), `supabase/policies.sql` (RLS + two RPC functions), `supabase/seed.sql` (generated from `src/services/mock/mockData.ts`, using `now() ± interval` SQL expressions so re-seeding always regenerates "today-relative" demo dates instead of going stale).
- **`nearby_terrains(in_lat, in_lng, in_radius_km)`** RPC replaces the client-side Haversine filter for `getTerrainsByLocation` — a single indexed `ST_DWithin` query instead of a full-table scan.
- **`create_inscription(...)`** RPC replaces the old bare insert for `createInscription` — inserts the row **and** increments `tournois.equipes_inscrites` atomically in one transaction. This also fixed a real pre-existing bug: the old Firestore "prod" code path never incremented that counter (only the mock branch did).
- Also fixed while rewriting: `getTournois(sport, region)`'s Firestore "prod" branch never actually applied the `sport`/`region` filters (only the mock branch did) — the Supabase version does.
- **RLS**: the app has no end-user auth (same as before), so policies are public-read on every table, insert-only (no update/delete) on `tournois` and via the RPC on `inscriptions`. The anon key is safe to ship client-side — its authority is fully bounded by these policies. The `service_role`/secret key is **never** used by the app, only for one-off admin/seed operations run manually against the project.
- Supabase CLI installed as a devDependency (`npm install supabase --save-dev`, invoked via `npx supabase`) — global install isn't supported by the CLI.
- Live project: schema/policies/seed already applied and verified (row counts, `nearby_terrains`, `create_inscription` atomicity, the composite `getMatchs` filter, and `createTournoi` all directly tested against the live database).

**Status as of this write-up:** all 4 services have `USE_MOCK = false` and are verified working against the live Supabase project via direct API/client testing. Full on-device emulator verification (Carte markers, Matchs list/results, team search, tournament list/detail, registration, admin tournament creation) is still pending — blocked on an unrelated pre-existing Windows native-build issue (see below), waiting on a PC restart to clear.

**Update (2026-07-19, later same day) — mock data removed entirely:** the `USE_MOCK` flag and every `if (USE_MOCK) {...}` fallback branch were deleted from all 4 services; `src/services/mock/mockData.ts` no longer exists. This includes `getRegions()` / `getDepartements()` in `matchsService.ts`, previously the one deliberate exception (documented above as staying synchronous and mock-backed) — they're now `async` functions backed by the `regions`/`departements` Postgres tables (already present in `schema.sql` and fully seeded in `seed.sql`, mirroring the old mock arrays exactly), with an in-memory cache since the data never changes at runtime. Both call sites (`AffinerFilter.tsx`, `AdminCreateTournoiScreen.tsx`) were updated to `await` them via `useEffect`/`useState` instead of reading synchronously. `AdminCreateTournoiScreen.tsx` also had its own direct `MOCK_REGIONS`/`MOCK_DEPARTEMENTS` imports (a second, previously undocumented consumer of the mock arrays) migrated to the same async service functions. The app now has zero mock data paths — everything reads from Supabase.

## Map — MapLibre GL

**Library:** `@maplibre/maplibre-react-native@10.4.2`
**Tile provider:** [OpenFreeMap](https://openfreemap.org) — free, no API key, no billing risk
**Styles:**
- Light: `https://tiles.openfreemap.org/styles/bright`
- Dark: `https://tiles.openfreemap.org/styles/dark`

**Key API differences vs react-native-maps:**
| Concept | react-native-maps | MapLibre |
|---|---|---|
| Coordinates | `{ latitude, longitude }` | `[longitude, latitude]` (GeoJSON) |
| Camera control | `mapRef.animateToRegion()` | `<Camera ref>` component + `setCamera()` |
| User dot | `showsUserLocation` prop | `<MapLibreGL.UserLocation />` child |
| Markers | `<Marker pinColor>` | `<PointAnnotation>` with custom `<View>` child |
| Dark mode | Custom JSON style array | Just swap `styleURL` |

**Before going to production (map):**
- [ ] Replace OpenFreeMap with a provider that has an SLA:
  - **Stadia Maps** (recommended): free up to 200K req/month, proper SLA. Sign up at `client.stadiamaps.com`, get API key, use: `https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=YOUR_KEY`
  - **MapTiler**: free up to 100K req/month. `https://api.maptiler.com/maps/streets/style.json?key=YOUR_KEY`
  - Store the key in `.env` / build config, never hardcode in source
- [ ] Re-enable attribution: set `attributionEnabled={true}` on `MapLibreGL.MapView` (OpenFreeMap terms require credit)

---

## Before deploying to production (iOS & Android)

### 1. Team search — consider Algolia (or Postgres full-text) before real scale

`getAllEquipes()` still reads the **whole `equipes` table** on first load (cached in memory for the session) — that part of the design didn't change in the Supabase migration. `searchEquipes()` itself, though, now does a real server-side `.ilike()` query (see "Backend migration" above) instead of the old Firestore "fetch everything, filter client-side" approach, so the search box specifically is no longer the concern.

Unlike Firestore, **Postgres/Supabase doesn't bill per-row-read** — the `getAllEquipes()` full-table-fetch doesn't have the same runaway per-read cost curve the old Firestore version did. The remaining reasons to eventually move off it are quality and payload size, not billing:
- `ilike` has no typo tolerance and gets slower (though still fine at current scale — 70 équipes) as the team count grows into the thousands.
- `getAllEquipes()`'s full-table fetch means the payload sent to the client grows linearly with team count, with nothing capping it.

**Fix, when it matters:** either integrate Algolia (sync via a Postgres trigger + Edge Function instead of the old Firebase/Algolia extension, since that was Firestore-specific), or add a `pg_trgm` GIN index and lean on Postgres's own trigram similarity search — cheaper to operate than Algolia and often good enough. Not urgent at 70 équipes.

### 2. Supabase setup (done — kept here as a reference for a fresh machine)

- [x] Create a Supabase project (region: Frankfurt/`eu-central-1` or London/`eu-west-2` for lowest latency to France)
- [x] Run, in order: `supabase/schema.sql` → `supabase/policies.sql` → `supabase/seed.sql` (Supabase Studio SQL editor, or `npx supabase` CLI)
- [x] Set `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `.env` (gitignored; `.env.example` has the placeholder shape) — the anon key is safe to ship, RLS bounds its authority
- [x] Set `USE_MOCK = false` in all 4 service files — later removed entirely, see "Backend migration" above
- [ ] Never put the `service_role`/secret key in `.env` or anywhere in the app — it's only used for one-off manual admin/seed operations against the project, never at runtime

### 3. iOS — first-time setup

iOS has never been built for this project. Steps needed:
- Install CocoaPods: `sudo gem install cocoapods`
- Run `cd ios && pod install`
- Open `ios/ProxiSport.xcworkspace` in Xcode
- Set Bundle ID, signing team, and provisioning profile in Xcode → Signing & Capabilities
- Add `GoogleService-Info.plist` to the Xcode project (drag into project tree, copy if needed)
- Build: `npx react-native run-ios` or archive via Xcode for App Store submission

### 4. Release checklist (both platforms)

- [ ] Algolia (or `pg_trgm`) integration done, if team count has grown enough to warrant it (see §1 above)
- [x] Real Supabase data populated and mock data path removed entirely — done, see "Backend migration" above
- [ ] Generate Android `release.keystore` (see "Release / Deploy to Android" section above)
- [ ] `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` restored in `gradle.properties`
- [ ] iOS provisioning profile + signing configured in Xcode
- [ ] App icons and splash screen added for both platforms
- [ ] Test on a real device (not emulator) before submitting to stores

