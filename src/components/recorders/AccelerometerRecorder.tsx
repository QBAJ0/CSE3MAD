import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface AccelerometerRecorderProps {
  onCapture: (data: { peak: number; average: number; samples: number }) => void;
  duration?: number;
  existingValue?: { peak: number; average: number };
}

export function AccelerometerRecorder({
  onCapture,
  existingValue,
}: AccelerometerRecorderProps) {
  if (existingValue?.peak) {
    return (
      <View style={styles.container}>
        <Text style={styles.saved}>
          📊 Peak: {existingValue.peak.toFixed(3)}g — Avg:{" "}
          {existingValue.average.toFixed(3)}g
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onCapture({ peak: 0, average: 0, samples: 0 })}
        >
          <Text style={styles.buttonText}>Remeasure</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📳</Text>
      <Text style={styles.message}>
        Motion sensor not available on web.{"\n"}Use the mobile app to measure
        vibration.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onCapture({ peak: 0, average: 0, samples: 0 })}
      >
        <Text style={styles.buttonText}>Skip (record 0)</Text>
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
