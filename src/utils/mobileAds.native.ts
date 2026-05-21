import Constants from "expo-constants";

export async function initializeMobileAds(): Promise<void> {
  if (Constants.appOwnership === "expo") return;

  try {
    const mobileAds = (await import("react-native-google-mobile-ads")).default;
    await mobileAds().initialize();
  } catch (error) {
    console.warn("Mobile ads unavailable in this runtime:", error);
  }
}
