import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VideoRecorderProps {
  onCapture: (uri: string) => void;
  existingUri?: string;
  maxDuration?: number;
}

export function VideoRecorder({ onCapture, existingUri }: VideoRecorderProps) {
  if (existingUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.saved}>📹 Video recorded (mobile only)</Text>
        <TouchableOpacity style={styles.button} onPress={() => onCapture("")}>
          <Text style={styles.buttonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📹</Text>
      <Text style={styles.message}>
        Video recording not available on web.{"\n"}Use the mobile app to record
        videos.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => onCapture("")}>
        <Text style={styles.buttonText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  icon: { fontSize: 32 },
  message: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  saved: { color: "#22C55E", fontSize: 14, fontWeight: "700" },
  button: {
    backgroundColor: "#334155",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: { color: "#F8FAFC", fontWeight: "600" },
});
