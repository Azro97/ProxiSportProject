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
| `package.json` | `patch-package` dev dependency + `postinstall` script | Preserves patches across npm install |

> **Release APK**: restore `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` in `android/gradle.properties`.
> **Windows path with spaces**: `gradlew.bat` uses `--project-cache-dir C:\Temp\pp-gradle`. Create it if missing: `New-Item -ItemType Directory -Path C:\Temp\pp-gradle`

## RN 0.76.9 → 0.81.6 upgrade (2026-09-20)

Upgraded React Native, React, and their toolchain to unblock the Stripe Android payment module, which had never actually compiled successfully (see "Before production" TODO — payments were always "not yet configured / untested on Android"). Verified with a full, successful `gradlew app:assembleDebug` producing a real installable `app-debug.apk` — every native module compiles, including Stripe.

**Why this went all the way to 0.81.6, not a smaller bump:** the original plan was RN 0.77.2 (last version still on React 18, avoiding a React 19 migration). That got the whole app building except Stripe. Root cause, confirmed empirically across ~8 build attempts: Stripe's Android SDK has required Kotlin ≥2.1 in every release since v21.6.0 (its stripe-android SDK crossed to Kotlin 2.1.10 there, and to 2.2.21 by the version `@stripe/stripe-react-native@0.73.0` itself pins), but Kotlin 2.1 changed `KotlinTopLevelExtension` from a class to an interface — a breaking change RN 0.77.2's own bundled Gradle plugin doesn't tolerate (confirmed via `facebook/react-native` upstream issue #48274). Forcing an older, Kotlin-2.0-compatible Stripe Android SDK version (v21.5.0) instead of bumping RN was tried and rejected — `@stripe/stripe-react-native@0.73.0`'s own Kotlin bridge code references dozens of newer Stripe APIs (`ConfirmationToken`, `PayByBank`, `CustomPaymentMethod`, session-based CustomerSheet) that don't exist in that old SDK. RN 0.78 is the first line whose Gradle plugin tolerates Kotlin 2.1+, but it also makes React 19 mandatory — so React 19 came along as a side effect of fixing Stripe, not as its own goal. 0.81.6 was chosen over jumping straight to whatever is newest at any given time: it's a deliberate, moderate step past the 0.78 minimum.

**Final versions:**
- `react-native`: 0.76.9 → **0.81.6**, `react`: 18.2.0 → **19.1.4**
- `@react-native-community/cli` and the `@react-native/*` tooling packages (babel-preset, eslint-config, metro-config, typescript-config): bumped to match 0.81.6
- `typescript`: 5.0.4 → 5.8.3 (RN 0.81's own recommended pairing)
- Kotlin: 1.9.24 → **2.2.21** in `android/build.gradle` — one step past RN 0.81.6's own recommended 2.1.20, specifically because Stripe's SDK needs a compiler that can read Kotlin 2.2-format metadata (an older compiler can't read a newer compiler's metadata format; the reverse is fine)
- AGP: 8.6.0 → 8.10.1, Gradle wrapper: 8.10.2 → 8.14.3, `compileSdkVersion`: 35 → 36 — required by transitive AndroidX libraries (`androidx.core:1.17.0`, `activity-ktx`/`activity-compose:1.12.x`) pulled in by Stripe's Compose usage. `targetSdkVersion` deliberately stayed at 35 (compileSdk and targetSdk are independent; bumping targetSdk to 36 opts into Android 16's edge-to-edge-by-default behavior, which needs its own UI verification pass not done here)
- `react-native-screens`: pinned exactly to **4.16.0**, `react-native-safe-area-context`: pinned exactly to **5.6.1** — not the latest available (4.28.0 / 5.10.0 at time of writing). Latest `react-native-screens` ships a new experimental "gamma/split" component using React 19's `ComponentRef` ref typing, which RN 0.81.6's bundled Codegen parser (frozen at RN's release time) doesn't recognize yet, causing a Codegen build failure. 4.16.0/5.6.1 are from the same release window as RN 0.81.6 (Aug–Sep 2025) and predate that component. **Do not bump these to `^` ranges or "latest" without first checking they still Codegen-parse cleanly against whatever RN version is current** — this is the second time this exact failure mode has hit this project (first at the 0.77.2 step too), and it will keep recurring since these libraries release faster than RN's Codegen catches up to new TS typing conventions.
- Two patches removed as obsolete, not because the underlying issues don't matter, but because they no longer apply to the current versions:
  - `patches/@react-native-community+cli-platform-android+14.1.2.patch` — the `native_modules.gradle` file it patched **no longer exists at all** in `cli-platform-android@20.0.0`; the whole legacy Groovy autolinking mechanism was replaced by the Gradle-plugin-native `autolinkLibrariesWithApp()` DSL call. `android/app/build.gradle`'s own `apply from: file(".../native_modules.gradle")` + `applyNativeModulesAppBuildGradle(project)` lines were removed for the same reason, replaced by `autolinkLibrariesWithApp()` inside the `react { }` block.
  - `patches/react-native-svg+15.15.5.patch` — this patch renamed Yoga's `StyleSizeLength` to `StyleLength` in `react-native-svg`'s C++ to match RN 0.76's Yoga API. RN 0.81.6's Yoga **reverted that rename back to `StyleSizeLength`**, so the patch now breaks the build instead of fixing it. The stock, unpatched `react-native-svg` source works as-is on RN 0.81.6.
- `android/app/src/main/java/com/pp/MainApplication.java`: two API breaks fixed —
  - `isHermesEnabled()` must now return primitive `boolean`, not boxed `Boolean` (the supertype's signature tightened)
  - `DefaultReactHost.getDefaultReactHost(this, mReactNativeHost)` no longer resolves from Java — the 2-arg call only works in Kotlin via a default parameter (`jsRuntimeFactory: JSRuntimeFactory? = null`), which Java can't use positionally. Fixed by calling the explicit 3-arg form: `getDefaultReactHost(this, mReactNativeHost, null)`.

**Zero package downgrades** — verified programmatically by diffing every package's resolved version in `package-lock.json` against the last committed version after every dependency change in this upgrade. The one apparent "downgrade" (`@types/react-native: 0.72.8 → 0.70.19`) is not really one: it's a transitive, compile-time-only dependency of `@types/react-native-vector-icons` (not something this app imports types from directly), which only surfaced once the app's own stale top-level `@types/react-native` pin (obsolete since RN bundles its own types) was removed.

**Still not covered by this upgrade**: this only gets the Android debug build compiling and installable. It doesn't verify Stripe's actual payment flow works end-to-end on-device (still blocked on the separate Stripe/webhook manual setup steps in the "Payment (Stripe)" TODO above), and iOS hasn't been touched at all — see the iOS section below, which now additionally needs React 19-compatible CocoaPods versions for every native dependency, not yet checked.

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

- [x] **Authentication** — Optional Supabase Auth (email/password), gated only around tournament registration and "Mes inscriptions" — browsing stays fully open, no login wall. `src/stores/authStore.ts` + `src/services/authService.ts` + `src/providers/AuthProvider.tsx`. `inscriptions.capitaine_uid` is now a nullable `uuid` FK to `auth.users`, derived server-side in `create_inscription()` via `auth.uid()` (never a client param) — guests still register with `capitaine_uid = null`, exactly as before. **Manual steps still needed on a fresh machine**: run `supabase/migration_auth_capitaine_uid.sql` once against the live project (already-bootstrapped `schema.sql`/`seed.sql` are updated for future fresh installs, but don't touch existing data); deploy `supabase/functions/send-inscription-confirmation` (`npx supabase login` + `link` + `functions deploy`) and set a `RESEND_API_KEY` secret for confirmation emails to actually send.
- [x] **Mes inscriptions** — `src/screens/auth/MesInscriptionsScreen.tsx`, reachable via the account icon in `TournoiListScreen`'s header (next to the admin Shield icon) or the modal's "Se connecter" path. Lists the signed-in user's registrations via `getMyInscriptions()` in `tournoiService.ts`. Also supports cancelling a registration (`cancel_inscription` RPC, signed-in users only) and account deletion (`delete-account` Edge Function, required for Apple Guideline 5.1.1(v) once iOS ships).
- [ ] **Payment (Stripe)** — code complete but **not yet configured — paid registrations do not work today**: webhook-driven confirmation (`create-payment-intent` + `stripe-webhook` Edge Functions, both deployed), `@stripe/stripe-react-native` PaymentSheet wired into `InscriptionModal`'s paid path, free tournaments untouched. New RPCs `create_pending_inscription_paiement`/`release_pending_inscription`/`confirm_inscription_paiement` in `supabase/policies.sql` (service_role-only), plus real CHECK constraints on `inscriptions.statut` and `tournois.equipes_inscrites` that didn't exist before.
  **Still to do before this works at all** (none of this is done yet):
  - [ ] Run `supabase/migration_stripe_payments.sql` once against the live project
  - [ ] Create a Stripe account (test mode)
  - [ ] Set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` Edge Function secrets
  - [ ] Register the webhook endpoint in the Stripe Dashboard (`payment_intent.succeeded` + `payment_intent.canceled`)
  - [ ] Replace the `pk_test_REPLACE_ME` placeholder in `.env` with a real `STRIPE_PUBLISHABLE_KEY`
  Free tournaments are unaffected either way.
  **Deliberately deferred, add later**: Apple Pay is NOT wired up — `initPaymentSheet` only enables standard card entry today. Apple Pay needs its own native setup (merchant identifier, Xcode "Apple Pay" capability, `Info.plist` entry) that isn't worth doing before this app has been built for iOS even once (see iOS section below). When it's time: add `applePay: { merchantCountryCode: 'FR' }` to `initPaymentSheet`'s options in `InscriptionModal.tsx`, plus the native config.

### Medium priority (UX polish)

- [ ] **Live match indicator** — `liveRed` color in theme, `LiveDot` component exists in the other frontend. Port to `MatchCard` / `MatchsScreen` for in-progress matches.
- [x] **Create a team** — deliberately admin-only, not consumer-facing (confirmed with user: `equipes` are official club teams referenced by real scheduled league matches, distinct from the free-text team name any user already types when registering for a tournament). `AdminCreateEquipeScreen.tsx`, reachable via the "Équipe" button next to "Créer" in `AdminDashboardScreen`. **Manual step**: re-run `supabase/policies.sql` against the live project (now fully idempotent, safe to run wholesale) to pick up the new `equipes` insert policy.
- [x] **Error states** — `src/components/ErrorState.tsx` (icon + message + retry) now used across every screen/component that fetches data (Carte, Matchs, Tournois, Classements, admin screens, `InscriptionModal`), instead of silently showing an empty state on failure. Paired with `src/services/withTimeout.ts` so a stalled Supabase call fails within 10s instead of hanging indefinitely.

### Before production

- [x] Switch off mock data — done; `USE_MOCK` flags and `src/services/mock/mockData.ts` have since been removed entirely, see "Backend migration" above
- [ ] Full on-device emulator pass — Carte (tiles + markers), Tournois list/detail, Login/Mes Inscriptions, and the admin dashboard have all been re-verified live on-device since the Supabase cutover. Still untested end-to-end on-device: a full paid registration (Stripe PaymentSheet → webhook → confirmation email) and the new admin "Créer une équipe" screen — both blocked on the manual Stripe/policy setup steps documented above, not a code issue.
- [ ] Algolia integration for team search (see §1 in "Before deploying to production" below) — still relevant on Supabase; `searchEquipes` now does a real server-side `ilike` instead of Firestore's full-fetch-then-filter, which is fine at current scale (70 équipes) but Algolia is still the right call at real-world scale
- [ ] App icons + splash screen (both platforms)
- [ ] iOS first-time setup (CocoaPods, Xcode signing)
- [ ] Release keystore + `reactNativeArchitectures` restored for multi-ABI APK

## Architecture

- Stack: React Native (bare), TypeScript, Zustand, **Supabase (Postgres + PostGIS)**, MapLibre GL
- Dependency direction: `screens -> stores -> services -> supabase` (one-way)
- Map library: `@maplibre/maplibre-react-native@10.4.2` (pinned — v11+ requires React 19)

## Frontend conventions

This is the canonical reference for the rules below — in-repo code comments should
point here by name (e.g. "see CLAUDE.md's Frontend conventions"), not at a numbered
section, and not at any doc outside this repository. A few comments used to cite
"CLAUDE.md §3/§5/§6"; those numbers belong to a different, non-repo spec document
that doesn't ship with the code, so nobody cloning this repo could ever resolve
them. Fixed to point here instead (2026-09-20).

**Services → Supabase.** Six files import `./supabase` directly today —
`terrainsService.ts`, `matchsService.ts`, `equipesService.ts`, `tournoiService.ts`,
`authService.ts`, `paymentService.ts` (the last two added for the auth/Stripe
work; the "only 4 services" framing from earlier is stale). No `screens/` or
`stores/` file should import it — `authStore.ts`'s type-only `import type {
Session, User } from '@supabase/supabase-js'` is the one accepted exception,
since it imports no client and calls no Supabase API.

**Every service function wraps its Supabase call in `withTimeout`**
(`src/services/withTimeout.ts`, 10s) — a flaky connection otherwise hangs
forever instead of rejecting, leaving a screen stuck on "loading" with no way
to surface `ErrorState`'s retry UI. When adding a new service function, wrap it
the same way, including calls into `supabase.functions.invoke(...)` and
`supabase.auth.*` — not just `.from(...)`/`.rpc(...)`. A subscription-based
call like `supabase.auth.onAuthStateChange(...)` is the one thing that can't be
wrapped this way (it has no single resolve/reject), and is left alone.

**Two different error UIs, on purpose:**
- `src/components/ErrorState.tsx` (icon + message + retry) — for a screen/section
  whose entire data fetch failed. Used across 2+ screens, which is why it lives
  in `src/components` (promote a component there only once 2+ screens need it;
  otherwise it belongs in that screen's own `components/` folder).
- `src/components/InlineLoadError.tsx` — for a single field inside a form (e.g.
  a région/département picker) whose backing list failed to fetch. Deliberately
  *not* `ErrorState`: swapping the whole form out for a full error view would
  discard whatever the user already typed elsewhere on the same screen. Used by
  `AdminCreateTournoiScreen` and `AdminCreateEquipeScreen`.

**`filtresStore` (Matchs screen) — current cascade rules** (`src/stores/filtresStore.ts`):
- `setSport`: sets sport, auto-selects the nearest region from GPS if a
  position is available (else leaves regions empty), resets `departement` and
  `divisions`, resets `date` to `null`.
- `toggleRegion`: adds/removes one region from the multi-select, always resets
  `divisions` (a division only makes sense within a region scope).
- `clearRegions`: clears both regions and divisions ("Tous" for regions).
- `toggleDivision` / `toggleDivisionGroup` / `clearDivisions`: division
  multi-select, including toggling a whole group at once (e.g. all four
  "Jeunes" M18/M21 levels together).
- `date: null` means **"all dates"** (the "Tous" date chip) — it is a
  meaningful, intentional state, not an invalid one to guard against.
- `getMatchs()` (`matchsService.ts`) only requires `sport`; `regions`,
  `divisions` and `date` are optional, additive filters — an empty array or a
  null date means "no restriction on that dimension," not "block the fetch."
  `MatchsScreen` fetches as soon as `sport` is set.

**Avoid `any`.** `colors: ColorPalette` (from `theme.ts`), not `colors: any` —
several shared components had this and it hid a real bug (a stale `terrain as
any` cast in `CarteScreen.tsx` silently made a sport-emoji lookup always
`undefined`). The one accepted exception is `row: any` in each service's own
`toX(row)` Supabase-row mapper, until generated DB types exist.

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

## Seed data: FFVB Hauts-de-France volleyball league (2026-09-20)

Real match data for the regional volleyball league was scraped from the FFVB Hauts-de-France site (`https://www.ffvbbeach.org/ffvbapp/resu/vbspo_home.php?codent=LIFL`) and loaded as `supabase/seed_volley_hdf.sql`, applied directly against the live Supabase project (SQL Editor). Final counts: **91 terrains, 189 équipes, 1 366 matchs**, covering the full season, both `hdf` and `grand-est` regions (several départements added), senior divisions and the M21/M18 youth divisions.

**Domain model change — `Division` is no longer 3 generic levels.** `src/models/Filtre.ts` now defines specific competition levels instead of the old `'Nationale' | 'Régionale' | 'Départementale'`:
```ts
export type Division =
  | 'Nationale 1' | 'Nationale 2' | 'Nationale 3'
  | 'Régionale 1' | 'Régionale 2' | 'Régionale 3'
  | 'Départementale 1' | 'Départementale 2' | 'Départementale 3'
  | 'Juniors M21' | 'Excellence M18' | 'Honneur M18' | '4x4 M18';
```
A separate `DivisionGroupe` (`'Nationale' | 'Régionale' | 'Départementale' | 'Jeunes'`) plus a `DIVISION_GROUPS` map groups these for the filter UI, so youth (M18/M21) divisions sit in their own "Jeunes" group and never mix into an adult division filter. This touches the filter UI (`AffinerFilter.tsx`, `MatchsScreen.tsx`, `MatchGroupList.tsx`) and `matchsService.ts`'s `.in('division', ...)` query — all already updated, not just the type.

**Seed generation pipeline** (one-off Node scripts, run outside the app — not part of the RN bundle, no new npm deps):
- `geocode_and_build.js` — geocodes each scraped venue via **Nominatim** (OpenStreetMap), restricted to a Hauts-de-France/Grand-Est bounding box (`viewbox` + `bounded=1`) so ambiguous venue names don't resolve to a same-named place elsewhere in France. Deliberately has **no** unanchored nationwide fallback — an unresolved venue stays unresolved rather than getting a wrong-region guess.
- `overrides.js` — a hand-researched map of `"VENUE NAME|TOWN" → corrected address` for venues Nominatim geocoded poorly or ambiguously (~58 entries).
- `apply_overrides.js` — re-resolves each override address through France's official **BAN** API (`api-adresse.data.gouv.fr`) for authoritative coordinates, writing `addressOverride: true` + `banScore` back into `venues_geocoded.json`.
- `build_sql.js` — turns the geocoded venues + scraped matches into `seed_volley_hdf.sql`. Terrain ids are deterministic slugs (venue name + resolved town).

**Bug fixed — `terrains_pkey` duplicate key violation.** Two physically distinct venues both named "Complexe Léo Lagrange" exist in Noyelles-sous-Lens (different streets, different coordinates), so the venue-name+town slug produced the **same** terrain id for both, and the seed insert failed with `23505 duplicate key value violates unique constraint "terrains_pkey"`. Fixed in `build_sql.js` with a `usedTerrainIds` `Set`-based uniqueness guard: on a slug collision, the id gets a numeric suffix (`-2`, `-3`, ...). The matches actually played at the second venue (`CMX010`, `CMX012`, `CFX013`, `CFX016`) were repointed to the suffixed id; matches at the original venue kept the base id. Verified with an exhaustive duplicate-id + referential-integrity check across all 5 insertable tables before re-running, then confirmed live: the corrected file ran end-to-end in the Supabase SQL Editor with `Success. No rows returned` (i.e. zero errors across the full batch of inserts).

**Known caveats (disclosed, non-blocking):** the Rethel venue address in `overrides.js` is an educated guess, not independently confirmed; two low-impact venues are geographically plausible but weren't independently verified. Both are low-severity and don't affect referential integrity or app behavior.

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
- No native config file needed for the backend — `@supabase/supabase-js` is a plain JS/REST client, so the same `.env` values used on Android just work (unlike the old Firebase setup, no `GoogleService-Info.plist` needed)
- Build: `npx react-native run-ios` or archive via Xcode for App Store submission
- `@stripe/stripe-react-native` will need `pod install` to pull in `stripe-ios`; Apple Pay isn't wired up (not needed for the current PaymentSheet-only flow), so no merchant identifier/capability setup required yet

### 4. Release checklist (both platforms)

- [ ] Algolia (or `pg_trgm`) integration done, if team count has grown enough to warrant it (see §1 above)
- [x] Real Supabase data populated and mock data path removed entirely — done, see "Backend migration" above
- [ ] Generate Android `release.keystore` (see "Release / Deploy to Android" section above)
- [ ] `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` restored in `gradle.properties`
- [ ] iOS provisioning profile + signing configured in Xcode
- [ ] App icons and splash screen added for both platforms
- [ ] Test on a real device (not emulator) before submitting to stores

