import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ColorTokens } from "../theme/colors";
import { useTheme } from "../theme/themeContext";

export function AdMobBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons name="phone-portrait-outline" size={16} color={colors.textSecondary} />
      <Text style={styles.text}>AdMob banner loads on native builds</Text>
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
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
    text: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
  });
}
