import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface GyroscopeRecorderProps {
  onCapture: (data: { smoothness: number; range: number; samples: number }) => void;
  duration?: number;
  existingValue?: { smoothness: number; range?: number };
}

export function GyroscopeRecorder({
  onCapture,
  existingValue,
}: GyroscopeRecorderProps) {
  const [smoothnessText, setSmoothnessText] = useState(
    existingValue?.smoothness ? String(existingValue.smoothness) : "",
  );
  const [peakText, setPeakText] = useState(
    existingValue?.range !== undefined ? String(existingValue.range) : "",
  );

  const save = () => {
    const smoothness = parseFloat(smoothnessText);
    if (isNaN(smoothness) || smoothness < 0 || smoothness > 100) return;

    const peakTrim = peakText.trim();
    let range = 0;
    if (peakTrim.length > 0) {
      const parsed = parseFloat(peakTrim);
      if (isNaN(parsed) || parsed < 0) return;
      range = parsed;
    }

    onCapture({ smoothness, range, samples: 0 });
  };

  if (existingValue && (existingValue.smoothness > 0 || (existingValue.range ?? 0) > 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.saved}>
          Smoothness {existingValue.smoothness}% · peak rotation{" "}
          {(existingValue.range ?? 0).toFixed(3)} rad/s
        </Text>
        <Text style={styles.hint}>Entered manually on web.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onCapture({ smoothness: 0, range: 0, samples: 0 })}
        >
          <Text style={styles.buttonText}>Remeasure</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Gyroscope is not available in the browser. Enter smoothness from your
        movement test (use the phone app for a sensor reading).
      </Text>
      <Text style={styles.label}>Smoothness (%)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="0–100"
        placeholderTextColor="#64748B"
        value={smoothnessText}
        onChangeText={setSmoothnessText}
      />
      <Text style={styles.label}>Peak rotation (rad/s, optional)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="e.g. 1.2"
        placeholderTextColor="#64748B"
        value={peakText}
        onChangeText={setPeakText}
      />
      <TouchableOpacity style={styles.saveButton} onPress={save}>
        <Text style={styles.saveButtonText}>Save values</Text>
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
    padding: 16,
    gap: 10,
  },
  message: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  hint: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
  },
  label: { color: "#12343B", fontSize: 14, fontWeight: "700" },
  input: {
    backgroundColor: "#F0F6FF",
    color: "#12343B",
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  saveButton: {
    backgroundColor: "#2F80ED",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  saved: { color: "#2F80ED", fontSize: 14, fontWeight: "700", textAlign: "center" },
  button: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#12343B", fontWeight: "600" },
});
