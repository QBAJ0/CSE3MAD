export async function initializeAdMob(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: mobileAds } = require("react-native-google-mobile-ads");
    await mobileAds().initialize();
  } catch {
    // Native module is unavailable in Expo Go.
  }
}
