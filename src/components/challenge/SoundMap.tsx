import { StyleSheet, Text, View } from "react-native";
import { SoundMapPoint } from "../../types";

interface SoundMapProps {
  points: SoundMapPoint[];
}

export type { SoundMapPoint };

export function SoundMap({ points }: SoundMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>Map view is not available on web.</Text>
      <Text style={styles.count}>{points.length} reading(s) recorded.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  message: { color: "#94A3B8", fontSize: 16 },
  count: { color: "#64748B", fontSize: 13 },
});
