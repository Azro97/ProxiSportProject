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

- [x] **Authentication** — Optional Supabase Auth (email/password), gated only around tournament registration and "Mes inscriptions" — browsing stays fully open, no login wall. `src/stores/authStore.ts` + `src/services/authService.ts` + `src/providers/AuthProvider.tsx`. `inscriptions.capitaine_uid` is now a nullable `uuid` FK to `auth.users`, derived server-side in `create_inscription()` via `auth.uid()` (never a client param) — guests still register with `capitaine_uid = null`, exactly as before. `supabase/migration_auth_capitaine_uid.sql` has been run against the live project; `send-inscription-confirmation` is deployed, `RESEND_API_KEY` is set, and real delivery is confirmed working — see "Confirmation emails" below.
- [x] **Confirmation emails** — fixed 2026-10-01. Root cause was Resend's sandbox mode: `send-inscription-confirmation` originally sent from `onboarding@resend.dev` (Resend's shared test address), which only delivers to the Resend account's own email and 403s on every other recipient — silently, since the send is deliberately best-effort (wrapped in try/catch so a failed email never blocks a successful registration). Registered `proxysport.org` via Cloudflare Registrar (DNS auto-hosted there too), verified it on Resend (DKIM/SPF/DMARC DNS records added in Cloudflare), changed `FROM_ADDRESS` in `supabase/functions/send-inscription-confirmation/index.ts` to `ProxiSport <noreply@proxysport.org>`, redeployed. Live-tested against two different real inboxes (not the Resend account's own address) — both got `{"ok":true}` from Resend **and** both confirmed the email actually arrived in the inbox, not just that the API call succeeded.
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

  > ⚠️ **`SKIP_STRIPE_FOR_BETA = true` in `InscriptionModal.tsx` (2026-09-20).** Since Stripe isn't configured (above), every paid registration currently fails at `createPaymentIntent()` — there's also no free tournament in `seed.sql` to fall back on for testing. This flag makes every registration, paid or free, go through the free tournament's instant-confirm path (`create_inscription` directly, no real charge), while the UI still shows the real price and "Paiement reçu !" so the app demos convincingly for beta testers. **This is the same code path the backend audit flagged as a payment-bypass vulnerability** (`create_inscription` has no server-side check that a tournoi is actually free) — it's being used deliberately here, not fixed. **Must be set back to `false`, and the backend hole in `create_inscription` actually closed, before any real user could pay for real and anyone else could still register for free.**

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

**`KeyboardAvoidingView` inside a real `<Modal>`: never use `behavior="height"`
on Android.** The Activity already has `android:windowSoftInputMode="adjustResize"`
(`AndroidManifest.xml`) — the OS resizes the window itself when the keyboard
opens. A `<Modal>` is a separate native window, and layering
`KeyboardAvoidingView`'s own `"height"` adjustment on top of that inside one
makes the two resize mechanisms fight every animation frame while the
keyboard opens, producing a visible flicker (found in `InscriptionModal.tsx`,
2026-09-20 — its `<Modal>` wraps a `KeyboardAvoidingView` with `TextInput`s
inside, the only place in the app that combination exists). Fixed there to
`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`, matching
`AdminCreateEquipeScreen.tsx`/`AdminCreateTournoiScreen.tsx`, which already
used this correctly. Those two also each render a `<Modal>` of their own (the
région/département picker), but it's a plain `FlatList`, no `TextInput` and
no `KeyboardAvoidingView` inside it — that combination is what's actually
risky, not `<Modal>` alone. If a future modal needs both a `TextInput` and
keyboard-avoidance, use `undefined` (Android) from the start rather than
copying `'height'` from a non-modal screen like `LoginScreen.tsx`.

**Avoid `any`.** `colors: ColorPalette` (from `theme.ts`), not `colors: any` —
several shared components had this and it hid a real bug (a stale `terrain as
any` cast in `CarteScreen.tsx` silently made a sport-emoji lookup always
`undefined`). The one accepted exception is `row: any` in each service's own
`toX(row)` Supabase-row mapper, until generated DB types exist.

## Error monitoring (Sentry) — set up 2026-10-02

**Why this exists:** a real bug (`matchsService.ts`'s `toMatch()` had `id,` instead of `id: row.id,`, a `ReferenceError` at runtime) surfaced to the user only as a generic "Vérifiez votre connexion internet" screen, with nothing in the UI hinting at the real cause. Diagnosing it required `adb logcat` access to the exact device it happened on — which works fine on a dev emulator, but is not possible once this app is on a real user's phone. Sentry plus the error-logging pass (see "Frontend conventions" above — every screen's `catch` block now logs the real error, not just a generic message) together mean a bug like this reports itself automatically, with a full stack trace, the moment it happens to anyone, anywhere — not just when someone screenshots an error screen and a dev happens to be plugged into the right device.

**What it is, in plain terms:** error/crash reporting, **not** a security tool — it doesn't block or prevent anything, it just tells you when something broke and what the real error was. Free tier (a few thousand events/month) is more than enough at this app's current scale; it never silently starts charging, it just stops accepting new events past the monthly quota until it resets.

**Account & project:** Sentry account under the user's own login, project name `proxisport` (React Native platform, DSN region: `de` / Germany — `*.ingest.de.sentry.io`). Dashboard: `https://proxysport.sentry.io` (note: dashboard subdomain uses the name as typed at project creation, `proxysport`, one letter different from the app's own `ProxiSport` branding and the `proxysport.org` domain registered for email — all three happen to use this same spelling, not a typo to "fix").

**Code, concretely:**
- `App.tsx` — `Sentry.init(...)` runs once at module load, **before** the component function, not inside it. Key options:
  - `dsn: SENTRY_DSN` — from `.env` (see below). If this is ever the `.env.example` placeholder value, Sentry just no-ops/warns locally; it does not throw or block the app from running.
  - `integrations: [captureConsoleIntegration({ levels: ['error'] })]` — this is the piece that makes the whole "Frontend conventions" error-logging pass pay off automatically: **every `console.error(...)` already added throughout the app's screens gets forwarded to Sentry with zero further per-file changes.** `captureConsoleIntegration` is imported from `@sentry/core` directly, not re-exported from `@sentry/react-native`'s own top-level index in this SDK version (`@sentry/react-native@8.29.0` / `@sentry/core@10.75.2`) — don't "fix" that import back to `Sentry.captureConsoleIntegration(...)`, it doesn't exist there and will fail `tsc`.
  - `tracesSampleRate: 0` — deliberately no performance/transaction tracing, errors only. Raise this later only as a conscious choice, not a default.
  - Only capturing `'error'` level, not `'warn'` — the handful of `console.warn`s added for genuinely non-critical fallbacks (e.g. `MatchDetailScreen`'s terrain-lookup failure, `TournoiDetailScreen`'s `Linking.openURL` failure) deliberately stay local-only noise, not Sentry events. Add `'warn'` to the `levels` array later if that noise floor turns out to be worth watching too.
- `Sentry.ErrorBoundary` wraps the whole app tree (inside `SafeAreaProvider`, with a custom `ErrorFallback` component) — this is the piece that catches **render-time** crashes, a different and more severe failure mode than anything the per-screen `catch` blocks handle (those only cover async data-loading errors). `ErrorFallback` is deliberately dependency-light: no theme store, no shared components, no hooks — it's the last-resort screen when something else has already crashed, so it must not itself risk depending on anything that could also be broken. Sentry's `ErrorBoundary` reports to Sentry automatically; no manual `captureException` call needed there.
- `export default Sentry.wrap(App)` — the standard top-level wrap Sentry's docs call for.
- `.env` / `.env.example` / `src/env.d.ts` — `SENTRY_DSN` follows the exact same pattern as `SUPABASE_URL`/`STRIPE_PUBLISHABLE_KEY`: real value in the gitignored `.env`, placeholder in the committed `.env.example`, declared in `env.d.ts` for the `@env` module.
- `package.json` — added both `@sentry/react-native` and `@sentry/core` as explicit dependencies (the latter is imported from directly, not just relied on transitively).

**Native setup — what was and wasn't done:**
- Android autolinking picked up Sentry's native module automatically on the next Gradle build (confirmed: `RNSentry: Starting with DSN: ...` and the full native integrations list in logcat on app start) — **no manual `android/build.gradle` changes were needed** for the SDK to work at all.
- **NOT set up: the Sentry Android Gradle Plugin** (`io.sentry.android.gradle`, applied via `apply from: "../../node_modules/@sentry/react-native/sentry.gradle"` + a classpath entry in the root `build.gradle`, with `autoInstallation.enabled = false` — critical, since RN's own autolinking already handles native init and the two conflict if both try). This plugin's job is uploading source maps and native debug symbols so a minified/Hermes-bytecode stack trace in production gets automatically deobfuscated back to real file/line numbers in the Sentry dashboard. Skipped for now because it requires a **Sentry auth token** (a second credential, from Sentry's own org settings → Auth Tokens) that wasn't part of this setup pass. Without it: errors still get captured and reported correctly (confirmed live, see below) — only the *stack trace readability* for a minified release build is reduced. Low priority while still testing on debug builds; worth doing before a real production release.
- iOS: native linking via CocoaPods autolinking is expected to work the same way, but **unverified** — consistent with the rest of this project, iOS has never been built once.

**Verified working, live, not just "should work":**
1. Built the real app, confirmed `Sentry.init` ran with no crash using a placeholder DSN first (graceful no-op), then with the real DSN.
2. Caught a real build gotcha along the way: changing only `.env` doesn't invalidate Gradle's `createBundleDebugJsAndAssets` task — it finished in 20s claiming `UP-TO-DATE` and silently kept the *old* DSN baked into the bundle from the previous build. Had to manually delete `android/app/build/generated/assets/createBundleDebugJsAndAssets` to force a real rebundle. **Remember this next time any `.env` value changes** — a suspiciously fast "successful" rebuild after an env-only change is a sign the bundle didn't actually regenerate.
3. Deliberately triggered a real error to confirm end-to-end delivery: disabled the test emulator's wifi **and** mobile data (both — the emulator has a virtual cellular path too, disabling wifi alone wasn't enough, `CarteScreen` loaded fine over "3G" the first attempt), relaunched the app so `CarteScreen`'s `getTerrainsByLocation` genuinely failed with `TypeError: Network request failed`, confirmed the `[CarteScreen] getTerrainsByLocation failed:` `console.error` fired in logcat, then re-enabled network so Sentry's `SendCachedEnvelopeIntegration` (visible in the native integrations list) could flush the queued event — Sentry SDKs cache failed sends locally and retry once connectivity returns, by design, so testing "offline" doesn't mean the event is lost. Confirmed received in the Sentry dashboard's Issues tab within about a minute: 1 event, `level: error`, `handled: yes`, correct device/OS tags (Android 15).

**Still to do, lower priority:**
- [ ] Sentry Android Gradle Plugin + auth token, for readable stack traces on a minified production build (see above) — not needed for debug-build testing.
- [ ] Decide whether to add `'warn'` to the `captureConsoleIntegration` levels once there's a sense of how noisy `'error'`-only actually is in practice.
- [ ] iOS native setup — unverified, blocked on the same "iOS has never been built" constraint as everything else iOS-related in this doc.

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

### 5. App Store / Play Store submission checklist (researched 2026-10-02)

Researched against Apple's and Google's actual current policies plus real developer-forum rejection reports, then checked against this codebase directly (not guessed). Split into: already fine, urgent/time-sensitive, and needs doing before submission.

**Already fine — confirmed, don't second-guess these:**
- Stripe without platform billing is allowed on **both** stores: real-world event registration/ticketing is explicitly exempted from Apple's IAP requirement and from Google Play's Billing policy alike (same "physical goods/services consumed outside the app" exemption on both).
- "Sign in with Apple" is **not** required — that rule only triggers if you offer other third-party/social logins (Google, Facebook); this app only has Supabase email/password, no social login at all.
- Account deletion in-app is done (`delete-account` Edge Function, Guideline 5.1.1(v)).
- No App Tracking Transparency prompt needed — no ads/analytics SDK in the dependency tree.
- `NSLocationWhenInUseUsageDescription` already has a clear, specific (non-vague) description.

**🔴 Urgent — time-sensitive, don't leave for last:**
- [x] **Google Play target API level — fixed 2026-10-02.** Google Play has required API 36 (Android 16) for new apps/updates since August 31, 2026 — `targetSdkVersion` was still 35 (deliberately, to avoid untested edge-to-edge display behavior — see the RN 0.81.6 upgrade notes above) at the time this checklist was researched, which was already past that deadline. Bumped to 36 in `android/build.gradle`. Confirmed all 17 top-level screens already use `useSafeAreaInsets`/`SafeAreaView` consistently, so the mandatory edge-to-edge-by-default behavior shouldn't regress anything — still worth a full visual pass across every screen before a real release, not just taking that reasoning on faith.
- **Google Play closed testing requirement, if this is a new/personal developer account.** Any personal Google Play Developer account created after November 13, 2023 must run a closed test with **12 opted-in testers for 14 continuous days** (not 12 invites — 12 people who actually accept and install it) before Google allows a production release. This takes real calendar time and needs 12 real people lined up, so it has to start well before a planned launch date, not be treated as a last-step formality. *(Needs a decision: do we already have a Play Developer account, and when was it created? If it's new, start recruiting testers now.)*

**🟡 Needs doing — concrete gaps found in the project itself:**
- **No iOS app icon exists at all** — `ios/PP/Images.xcassets/AppIcon.appiconset/` has only the `Contents.json` manifest, zero actual image files. Xcode can't archive a submittable build without these.
- **Android's app icon is still React Native's generic default placeholder** (checked the actual PNG — it's the white robot head on a teal grid, not a custom ProxiSport icon).
- **`CFBundleDisplayName` in `Info.plist` is still `"PP"`**, not `"ProxiSport"` — this is what shows under the icon on a home screen.
- **`Info.plist` is missing `UISupportedInterfaceOrientations~ipad`** (only the iPhone key exists) — a specifically-named, recurring trigger in 2026 Apple Developer Forum rejection threads for Guideline 2.1 iPad issues. Apple reviews every app on real iPad hardware regardless of declared device family (`TARGETED_DEVICE_FAMILY` isn't explicitly set anywhere in this Xcode project either — worth confirming on a Mac). You don't need an adapted iPad layout, you need to not look broken on one — this has never been tested since iOS has never been built.
- **Privacy Manifest (`PrivacyInfo.xcprivacy`) is almost certainly incomplete.** It currently only declares React Native core's own required-reason API usage (file timestamps, UserDefaults, boot time) — it hasn't been verified to account for the third-party native SDKs (Stripe, MapLibre) that each need their own entries aggregated in here. This has never been exercised by a real Xcode archive, which is usually what surfaces missing declarations.
- **Apple Pay isn't wired up.** Not a hard documented rule on either store, but real forum-documented rejection risk on Apple's side specifically when a reviewer expects it alongside card entry (Apple staff declined to give a yes/no when directly asked in a 2026 forum thread, calling it case-by-case). Lower priority than the items above, but worth doing before submitting, not after a rejection.
- **No working demo account prepared for Apple App Review.** Sign-up requires email confirmation (`needsEmailConfirmation` in `authStore.ts`/`SignUpScreen.tsx`) — a reviewer cannot complete that step themselves (no access to a real inbox, and definitely not one behind an OTP/SMS code). Must create and manually confirm a demo account **before submitting** and provide its working credentials in App Store Connect's "App Review Information" notes — an account that still works on the day of review, not one made weeks earlier that might have an expired session or a changed password.
- **No public Privacy Policy URL confirmed to exist yet** — required in both App Store Connect's and Play Console's listing metadata regardless of anything else being correct.
- **No Terms of Service exists anywhere** (checked — not in the codebase, not referenced in any doc). Both the Privacy Policy *and* Terms of Service links need to be in the **App Store description text itself** (the text a user reads before downloading), not just as separate App Store Connect metadata fields — a subscription/paid app specifically needs both links on the last line of the description (Guideline 3.1.2). Writing actual ToS is a legal document, not something to draft via this codebase's docs — get a lawyer or a template service for the real text, then make sure both links land in the description when submitting.
- **App Privacy "nutrition label" (App Store Connect) / Data Safety section (Play Console) must declare Sentry, not just Supabase/Stripe.** Sentry (added 2026-10-02 — see "Error monitoring (Sentry)" above) collects crash/error data, device info, and stack traces every time an error occurs — this is real data leaving the app and has to be declared accurately alongside Supabase (email, location) and Stripe (payment info). Apple checks this against actual network traffic, so an incomplete form is a real rejection risk, not just a formality.
- **`SKIP_STRIPE_FOR_BETA = true` must be `false` before any store submission**, not just before "real payments matter" as originally framed — submitting with it still `true` means every "paid" registration silently skips payment, which is both the payment-bypass security hole already documented above *and* the kind of left-in bypass flag Apple's reviewers watch for (undocumented/hidden behavior, Guideline 2.3.1-adjacent).
- **Release build format**: confirm the Android release build actually produces a `.aab` (Android App Bundle) — Play Console requires this for new apps, not a bare `.apk`.
- **Test plan before submission**: a cold start (not just resuming a warm session — this app's AsyncStorage intro-screen check and GPS flow both run at cold start) and a real device on cellular data, not just wifi or an emulator. TestFlight to a couple of real people catches more than a local test pass does.
- Minor/low-risk: no `ITSAppUsesNonExemptEncryption` key set in `Info.plist` — not a rejection cause by itself, just means App Store Connect will ask the export-compliance question on every single submission instead of skipping it; worth setting to `false` once, for convenience, since the app only uses standard HTTPS.

