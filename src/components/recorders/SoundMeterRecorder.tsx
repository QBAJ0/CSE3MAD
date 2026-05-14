import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SoundMeterRecorderProps {
  onCapture: (db: number) => void;
  existingValue?: number;
}

export function SoundMeterRecorder({
  onCapture,
  existingValue,
}: SoundMeterRecorderProps) {
  if (existingValue && existingValue > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.saved}>🔊 Measured: {existingValue} dB</Text>
        <TouchableOpacity style={styles.button} onPress={() => onCapture(0)}>
          <Text style={styles.buttonText}>Remeasure</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎤</Text>
      <Text style={styles.message}>
        Sound meter not available on web.{"\n"}Use the mobile app to measure
        decibel levels.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => onCapture(0)}>
        <Text style={styles.buttonText}>Skip (record 0 dB)</Text>
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
  icon: { fontSize: 32 },
  message: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  saved: { color: "#2F80ED", fontSize: 16, fontWeight: "700" },
  button: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: { color: "#12343B", fontWeight: "600" },
});
