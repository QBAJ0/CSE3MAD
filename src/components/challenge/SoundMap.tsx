import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";
import { SoundMapPoint } from "../../types";

interface SoundMapProps {
  points: SoundMapPoint[];
}

export type { SoundMapPoint };

export function SoundMap({ points }: SoundMapProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Map view is not available on web.</Text>
      <Text style={styles.count}>{points.length} reading(s) recorded.</Text>
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      height: 200,
      backgroundColor: c.backgroundSecondary,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    message: { color: c.textMuted, fontSize: 16 },
    count: { color: c.textSecondary, fontSize: 13 },
  });
}
