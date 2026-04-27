import { StyleSheet, Text, View } from "react-native";

interface SoundReading {
  id: string;
  action: string;
  db: number;
  location: { latitude: number; longitude: number };
  timestamp: string;
  teamName: string;
}

interface SoundMapProps {
  readings: SoundReading[];
  onSelect?: (reading: SoundReading) => void;
}

export function SoundMap({ readings }: SoundMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>Map view is not available on web.</Text>
      <Text style={styles.count}>{readings.length} reading(s) recorded.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  message: { color: "#94A3B8", fontSize: 16 },
  count: { color: "#64748B", fontSize: 13 },
});
