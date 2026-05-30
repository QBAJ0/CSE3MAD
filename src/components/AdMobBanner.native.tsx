import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ColorTokens } from "../theme/colors";
import { useTheme } from "../theme/themeContext";

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
  // Native module unavailable in Expo Go — fall through to placeholder.
}

export function AdMobBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!BannerAd) {
    return (
      <TouchableOpacity
        style={styles.placeholder}
        activeOpacity={0.7}
        onPress={() =>
          Alert.alert(
            "Ad Supported",
            "This app is free thanks to ads. On a published build, a real Google ad appears here — tapping it opens the advertiser's page.",
            [{ text: "Got it" }]
          )
        }
      >
        <Ionicons name="megaphone-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.placeholderText}>Ad supported — free for students</Text>
      </TouchableOpacity>
    );
  }

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

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginBottom: 16,
      minHeight: 56,
      alignItems: "center",
      justifyContent: "center",
    },
    placeholder: {
      marginHorizontal: 16,
      marginBottom: 16,
      minHeight: 56,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    placeholderText: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}
