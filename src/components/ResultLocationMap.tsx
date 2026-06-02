import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { ColorTokens } from "../theme/colors";
import { useTheme } from "../theme/themeContext";

export type ResultLocationMapProps = {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  interactive?: boolean;
  regionDelta?: number;
};

export function ResultLocationMap({
  lat,
  lng,
  title = "Experiment Location",
  description,
}: ResultLocationMapProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openInMaps = () => {
    void Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.map, pressed && styles.mapPressed]}
      onPress={openInMaps}
    >
      <View style={styles.inner}>
        <Ionicons name="map-outline" size={36} color={colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.coords}>
          {lat.toFixed(6)}°, {lng.toFixed(6)}°
        </Text>
        {description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <Text style={styles.hint}>Tap to open in Google Maps</Text>
      </View>
    </Pressable>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    map: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: c.successLight,
      borderWidth: 1,
      borderColor: c.success,
    },
    mapPressed: {
      opacity: 0.92,
    },
    inner: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      gap: 4,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: c.primary,
    },
    coords: {
      fontSize: 13,
      fontWeight: "600",
      color: c.primary,
    },
    desc: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: "center",
    },
    hint: {
      fontSize: 12,
      color: c.textSecondary,
      marginTop: 4,
    },
  });
}
