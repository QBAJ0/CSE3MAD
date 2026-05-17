# Real Device QA Checklist

Use a development/native build for this checklist. Expo Go is not enough for final validation.

## Startup

- App opens from a cold launch without JavaScript errors.
- Native splash appears briefly, then routes to Home or onboarding.
- No extra branded React splash screen delays navigation.

## Notifications

- Notification permission prompt appears only when appropriate.
- Streak reminder schedules when a team has a streak and has not completed a challenge today.
- Streak reminder cancels after completing a challenge today.
- Tapping a streak reminder opens the related challenge.

## AdMob

- Banner is hidden in Expo Go.
- Banner appears in a development/native build.
- Only Google test ads are shown during development.
- Production release uses real AdMob app IDs and banner unit IDs.

## GPS

- Permission prompt appears on first GPS tag.
- GPS tag saves coordinates to the current prototype.
- Map preview appears after tagging.
- Submitted activity includes top-level `location`.
- Saved activity details show the map and coordinates.

## Sensors

- Accelerometer records peak and average values.
- Gyroscope records smoothness and peak rotation.
- Sound meter records a stable dB value.
- Breathing recorder counts a plausible breath rate.
- Sensor permission denial does not crash the app.

## Media

- Photo capture saves and reopens in results/history.
- Video capture saves and reopens in results/history.
- Frame analysis handles missing/invalid video gracefully.

## Encoding / Copy

- No visible mojibake or replacement characters.
- Buttons and table values fit on small Android screens.
