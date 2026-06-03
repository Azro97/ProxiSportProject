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

## TODO

- [ ] **TeamDetailScreen** - screen showing team info + upcoming matches; navigate from a team name tap; load via `getEquipeById(id)` in `equipesService.ts`
- [ ] **Match history screen** - past matches; needs `statut` + `scoreA`/`scoreB` on Match model; add `getMatchsJoues(equipeId?)` to `matchsService.ts`

## Architecture

- Stack: React Native (bare), TypeScript, Zustand, Firebase Firestore, react-native-maps
- Dependency direction: `screens -> stores -> services -> firebase` (one-way)
- `react-native-maps` pinned to `1.20.0` - do not upgrade
