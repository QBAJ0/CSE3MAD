# Stemmlab

Stemmlab is an Expo/React Native app for team-based STEMM challenges. Students complete experiments, capture sensor evidence, reflect on results, and build progress through streaks, badges, and leaderboards.

## Data flow (official challenge path)

1. Onboarding saves the team to **AsyncStorage** and mirrors the team into **SQLite** (`teams` / `members`).
2. Student completes a challenge → **Claim** on the results screen.
3. **SQLite** `challenge_results` stores the full submission JSON (local source of truth for Assessment 4).
4. **AsyncStorage** `stemm_completed_activities` keeps the same result for in-app UI (completion badges, profile history, XP leaderboard tab).
5. **Firebase Auth** anonymous sign-in runs in the background (enable Anonymous auth in the Firebase console).
6. **Firestore** receives `activities/{resultId}` and `leaderboard/{teamDiscriminator}`; failed writes retry from a pending queue on app launch.
7. **Firebase Storage** media (photos/videos) upload to `activity-evidence/{authUid}/{resultId}/prototype-{n}-{key}.ext` — must match `storage.rules` (not `teams/...`).

Legacy `/activity/:id` URLs redirect to the Challenges tab. One challenge flow only; SQLite table `challenge_results` is the local store.

Removed legacy lab modules: `resultDb.ts`, `resultCloud.ts`, `labRecordingCatalog.ts` (see git history).

## Run The App

Install dependencies:

```bash
npm install
```

Start Metro (always opens **Expo Go** — terminal must show `Using Expo Go` and `exp://…`):

```bash
npm start
# or clear cache:
npm run start:clean
```

If Expo asks **Log in / Proceed anonymously**, choose one in the terminal (arrow keys + Enter) **before** scanning the QR.

On the phone, open **Expo Go** → **Scan QR code** (not the system Camera app). Wait 1–2 minutes on first load until you see `Android Bundled` or `iOS Bundled` in the terminal.

### Connect your phone

The terminal QR code uses an `exp://` link, **not** a normal website URL. The built-in **Camera** app on many phones shows “no usable data found” — that is expected.

1. Install **[Expo Go](https://expo.dev/go)** on your phone (same major SDK as this project: SDK 54).
2. Put the phone and laptop on the **same Wi‑Fi** (avoid guest networks that block device-to-device traffic).
3. In **Expo Go**, tap **Scan QR code** and scan the terminal QR (do not use the system Camera app on Android).
4. On iOS, the Camera app can sometimes open `exp://` links; if it fails, use Expo Go’s scanner instead.

If the phone cannot reach your PC (different network, VPN, or firewall):

**Option A — same Wi‑Fi (try this first):**

```bash
npm run start:lan
```

In Expo Go → **Enter URL manually** → type what the terminal shows, e.g. `exp://10.136.221.58:8081` (use your PC’s IP from `ipconfig`, not `localhost`).

**Option B — tunnel (if LAN fails):**

```bash
npm run start:tunnel
```

`@expo/ngrok` is included as a dev dependency so tunnel does not rely on a global install.

If you see `ngrok tunnel took too long to connect`: turn off VPN, allow Node/ngrok through Windows Firewall, retry once, or stick with **Option A**.

Always use `npm start` or `npm run start:clean` (both pass `--go`). Do not scan a QR that says `exp+stemmlab://` or **Using development build** — that will timeout in Expo Go.

### Web preview (`w` in the terminal)

Pressing `w` bundles the web app. If the dev server stops with `Error: Premature close`, the browser closed the connection during a long first bundle — run `npm run web` in a second terminal instead, or avoid `w` when you only need the phone.

Expo Go is useful for quick UI checks, but it does not support every native feature used by this app.

## Native Feature Notes

These features need a development/native build for reliable testing:

- AdMob banner ads
- Local notification scheduling and notification tap handling
- Camera/video capture
- GPS maps
- device sensors such as gyroscope, accelerometer, and sound

Expo Go will intentionally hide or skip unsupported native pieces where possible so the app can still open.

To test native features properly, run a development build:

```bash
npx expo run:android
```

For EAS cloud builds, restore `extra.eas.projectId` in `app.json` (removed for local Expo Go to avoid the unverified-app login prompt):

```json
"eas": { "projectId": "b15991a2-9b12-4d0f-b2cc-bde0dd0707a7" }
```

For iOS, use a macOS environment:

```bash
npx expo run:ios
```

## AdMob

AdMob is currently configured with Google test app IDs and test banner units only. Replace those IDs before production release.

Current config lives in:

- `app.json`
- `src/components/ads/AdMobBanner.native.tsx`

## Branding

The current app icon and splash assets are temporary Stemmlab product marks generated for consistency across Expo icon slots. Replace them with final approved brand assets before release if a formal logo exists.

Configured assets:

- `assets/images/icon.png`
- `assets/images/android-icon-background.png`
- `assets/images/android-icon-foreground.png`
- `assets/images/android-icon-monochrome.png`
- `assets/images/splash-icon.png`
- `assets/images/favicon.png`

The helper script `scripts/generate-brand-assets.js` can regenerate the temporary set.

## Quality Checks

```bash
npx tsc --noEmit
npx expo lint
```

Before release, run the device checklist in `docs/REAL_DEVICE_QA.md`.
