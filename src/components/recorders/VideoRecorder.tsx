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
        <Text style={styles.saved}>Video recorded (mobile only)</Text>
        <TouchableOpacity style={styles.button} onPress={() => onCapture("")}>
          <Text style={styles.buttonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  message: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  saved: { color: "#2563EB", fontSize: 14, fontWeight: "700" },
  button: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: { color: "#0F172A", fontWeight: "600" },
});
