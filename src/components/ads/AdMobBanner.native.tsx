import Constants from "expo-constants";
import { ComponentType, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

type BannerModule = typeof import("react-native-google-mobile-ads");

const isExpoGo = Constants.appOwnership === "expo";

export function AdMobBanner() {
  const [ads, setAds] = useState<BannerModule | null>(null);

  useEffect(() => {
    if (isExpoGo) return;

    import("react-native-google-mobile-ads")
      .then(setAds)
      .catch(() => setAds(null));
  }, []);

  if (isExpoGo) return null;
  if (!ads) return null;

  const Banner = ads.BannerAd as ComponentType<{
    unitId: string;
    size: string;
    requestOptions?: { requestNonPersonalizedAdsOnly?: boolean };
  }>;
  // Keep this on Google's test unit until real production AdMob IDs are ready.
  const unitId = ads.TestIds.ADAPTIVE_BANNER;

  return (
    <View style={styles.container}>
      <Banner
        unitId={unitId}
        size={ads.BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 6,
    minHeight: 56,
  },
});
