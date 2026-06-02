# Firebase Test Lab Checklist — STEMM Lab

Use this before Assessment 4 submission. Run on a **release APK or AAB**, not Expo Go.

## Prerequisites

| Item | Value / location |
|------|------------------|
| Android package | `com.StaceyJepkemoi.Stemmlab` (`app.json`) |
| Firebase project | Same project as `.env` `EXPO_PUBLIC_FIREBASE_*` keys |
| Anonymous Auth | Enabled in Firebase Console → Authentication |
| Firestore rules | Deployed from `firestore.rules` |
| Storage rules | Deployed from `storage.rules` |
| EAS | `eas.json` present; restore `extra.eas.projectId` in `app.json` if using EAS cloud build |

`google-services.json` is **not** required for the JS Firebase SDK with `EXPO_PUBLIC_*` env vars. Add it only if you switch to `@react-native-firebase/*` native modules.

## 1. Build APK

### Option A — EAS (recommended for Test Lab)

```bash
npm install -g eas-cli
eas login
# Restore projectId in app.json under expo.extra.eas if removed
eas build -p android --profile preview
```

Download the `.apk` from the EAS build page.

### Option B — Local release

```bash
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK path (typical): `android/app/build/outputs/apk/release/app-release.apk`

Ensure `.env` is present on the build machine with all `EXPO_PUBLIC_FIREBASE_*` values.

## 2. Upload to Firebase Test Lab

1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Test Lab**.
2. **Run a test** → upload the APK.
3. Choose at least one physical device model and one API level (e.g. Pixel 6, API 33).
4. Run **Robo test** (no extra test APK required) for a smoke launch.
5. Optional: add **Instrumentation** tests later if you add a native test APK.

### Pass / fail

| Result | Meaning |
|--------|---------|
| **Pass** | App launches, no crash in first 2–3 minutes, main activity visible |
| **Fail** | Crash on launch, ANR, or missing native dependency |
| **Inconclusive** | Firebase infra issue — re-run |

Collect: Test Lab **report PDF**, **video**, and **screenshot** of the results summary.

## 3. Per team member (Assessment 4)

Each student should:

1. Run Test Lab on **one different device profile** (document model + API level).
2. Save their own report screenshot with name/date in filename.
3. On a **real phone**, install the same APK and:
   - Complete onboarding (team + year level).
   - Finish **one challenge** and tap **Claim Reward**.
   - Confirm Firestore `activities/{resultId}` exists (see below).
   - Confirm `leaderboard/{teamId}` updated.

## 4. Verify Firestore after claim

Firebase Console → Firestore:

### `activities/{resultId}`

Confirm fields exist: `resultId`, `activityTitle`, `teamName`, `yearLevel`, `difficulty`, `attempts[]`, `rating`, `comment`, `reflection`, `wereYouRight` inside attempts, `derivedByPrototype`, `evidence`, `ownerUid`, `createdAt`, `updatedAt`.

### `evidence.files[]`

- Before upload completes: `uploadStatus: "pending"`.
- After media sync: `uploadStatus: "uploaded"` and `downloadUrl` starts with `https://`.

### `leaderboard/{teamId}`

Confirm: `totalPoints`, `challengesCompleted`, `yearLevel`, `difficulty`, `lastChallengeId`, `lastActivityTitle`, `updatedAt`.

## 5. Screenshots to collect

- [ ] EAS build success / APK download
- [ ] Test Lab run summary (per person)
- [ ] Firestore `activities` document (full fields visible)
- [ ] Firestore `leaderboard` document
- [ ] Firebase Storage file under `activity-evidence/{uid}/{resultId}/`
- [ ] Authentication → Users (anonymous user created)
- [ ] Metro/log line: `[firestore:sync] ok` or `[firestore:activity] write ok`

## 6. Common failures

| Symptom | Fix |
|---------|-----|
| No Firestore writes | Check `.env`, Anonymous Auth, network |
| `permission-denied` | Deploy `firestore.rules`; user must be signed in |
| Evidence stays `pending` | Open app again (sync on foreground); check Storage rules |
| Test Lab crash on launch | Rebuild with `expo prebuild`; verify release APK, not Expo Go |

## 7. What cannot be verified without a real Firebase project

- Live `ownerUid` from anonymous auth
- Actual Storage `downloadUrl` values
- Test Lab device-specific crashes
- Multi-team leaderboard across two physical devices
