import { StyleSheet, View } from "react-native";

// Dynamic require so Expo Go doesn't crash on missing native module.
// TurboModuleRegistry.getEnforcing throws at import time in Expo Go.
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ads = require("react-native-google-mobile-ads");
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
} catch {
  // Native module unavailable in Expo Go — banner simply won't render.
}

export function AdMobBanner() {
  if (!BannerAd) return null;
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
