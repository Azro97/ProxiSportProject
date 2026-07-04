# CLAUDE.md

## Prerequisites

1. Android emulator running (Pixel, API 35, x86_64)
2. NDK `30.0.14904198` installed — SDK Manager → SDK Tools → NDK (Side by side)
3. Gradle cache dir exists (Windows): `New-Item -ItemType Directory -Force -Path C:\Temp\pp-gradle`
4. Dependencies installed: `npm install` (also auto-applies patches via postinstall)
5. Metro bundler running from the project root: `npx react-native start`

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

## TODO — Remaining work

### High priority (needed for real users)

- [ ] **Authentication** — No login/signup flow. `Inscription.capitaine_uid` requires a real user. Use Firebase Auth (email/password or Google sign-in). Add `AuthScreen` + guard navigation behind auth state.
- [ ] **Mes inscriptions** — After signing up for a tournament there is no screen to view registrations. Add a "Mes tournois" section (stack screen or new tab) reading `inscriptions` Firestore collection filtered by `capitaine_uid`.
- [ ] **Payment (Stripe)** — `Inscription.stripe_payment_intent_id` exists but the modal just shows a mock confirmation. Integrate `@stripe/stripe-react-native`, create a Cloud Function to generate a `PaymentIntent`, present the payment sheet in step 2 of `InscriptionModal`.

### Medium priority (UX polish)

- [ ] **Dark mode toggle** — Removed from all screens. `themeStore` still exists. Add a toggle in a settings screen or a long-press gesture somewhere.
- [ ] **Live match indicator** — `liveRed` color in theme, `LiveDot` component exists in the other frontend. Port to `MatchCard` / `MatchsScreen` for in-progress matches.
- [ ] **Create / join a team** — Users can search and view teams but cannot create one. Add a "Créer mon équipe" CTA in `ClassementsScreen` (team search screen).
- [ ] **Error states** — No UI shown when Firestore/network fails. Add error boundaries or inline error views.

### Before production

- [ ] Switch to real Firebase data (`USE_MOCK = false`) + seed Firestore collections
- [ ] Algolia integration for team search (see §1 in "Before deploying to production" below)
- [ ] Firebase `google-services.json` / `GoogleService-Info.plist` with real project
- [ ] App icons + splash screen (both platforms)
- [ ] iOS first-time setup (CocoaPods, Xcode signing)
- [ ] Release keystore + `reactNativeArchitectures` restored for multi-ABI APK

## Architecture

- Stack: React Native (bare), TypeScript, Zustand, Firebase Firestore, MapLibre GL
- Dependency direction: `screens -> stores -> services -> firebase` (one-way)
- Map library: `@maplibre/maplibre-react-native@10.4.2` (pinned — v11+ requires React 19)

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

### 1. Team search — switch to Algolia

Currently `getAllEquipes()` reads **every team document** from Firestore on first load (cached in memory for the session). This is fine in dev but expensive at scale:

| Teams | Daily users | Reads/day | Firestore cost/month |
|-------|------------|-----------|----------------------|
| 500   | 1,000      | 500K      | ~$1.80 |
| 2,000 | 5,000      | 10M       | ~$36 |
| 10,000| 20,000     | 200M      | ~$720 |

**Fix:** Integrate Algolia before launch.
- Install the **official Firebase/Algolia extension** in the Firebase console — it auto-syncs Firestore writes to an Algolia index, zero manual work.
- Replace `getAllEquipes()` in `ClassementsScreen` with an Algolia search call.
- Firestore reads for search drop to zero; you only read the full document when a user taps a result.
- **Cost**: Algolia free tier = 10K operations/month (early stage); paid ~$50/month for 100K ops.
- Algolia gives typo tolerance and better relevance out of the box.

### 2. Firebase setup (required for both platforms)

- [ ] Add real `google-services.json` (Android) from Firebase console → Project settings → Android app
- [ ] Add real `GoogleService-Info.plist` (iOS) from Firebase console → Project settings → iOS app
- [ ] Set `USE_MOCK = false` (or remove the `__DEV__` flag) in all service files once Firestore data is populated
- [ ] Create Firestore collections: `equipes`, `matchs`, `terrains` and seed with real data

### 3. iOS — first-time setup

iOS has never been built for this project. Steps needed:
- Install CocoaPods: `sudo gem install cocoapods`
- Run `cd ios && pod install`
- Open `ios/ProxiSport.xcworkspace` in Xcode
- Set Bundle ID, signing team, and provisioning profile in Xcode → Signing & Capabilities
- Add `GoogleService-Info.plist` to the Xcode project (drag into project tree, copy if needed)
- Build: `npx react-native run-ios` or archive via Xcode for App Store submission

### 4. Release checklist (both platforms)

- [ ] Algolia integration done (see §1 above)
- [ ] Real Firebase data populated and `USE_MOCK = false`
- [ ] Generate Android `release.keystore` (see "Release / Deploy to Android" section above)
- [ ] `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` restored in `gradle.properties`
- [ ] iOS provisioning profile + signing configured in Xcode
- [ ] App icons and splash screen added for both platforms
- [ ] Test on a real device (not emulator) before submitting to stores

