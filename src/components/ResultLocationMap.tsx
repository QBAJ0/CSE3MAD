import Ionicons from "@expo/vector-icons/Ionicons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

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
  const openInMaps = () => {
    void Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.map, pressed && styles.mapPressed]}
      onPress={openInMaps}
    >
      <View style={styles.inner}>
        <Ionicons name="map-outline" size={36} color="#0F766E" />
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

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  mapPressed: {
    opacity: 0.92,
    backgroundColor: "#CCFBF1",
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
    color: "#134E4A",
  },
  coords: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F766E",
  },
  desc: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  hint: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
});
