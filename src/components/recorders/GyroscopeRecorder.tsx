import { StyleSheet, Text, View } from "react-native";

interface GyroscopeRecorderProps {
  onCapture: (data: { smoothness: number; range: number; samples: number }) => void;
  duration?: number;
  existingValue?: { smoothness: number; range?: number };
}

export function GyroscopeRecorder({
  existingValue,
}: GyroscopeRecorderProps) {
  if (existingValue && (existingValue.smoothness > 0 || (existingValue.range ?? 0) > 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.saved}>
          Smoothness {existingValue.smoothness}% · peak rotation{" "}
          {(existingValue.range ?? 0).toFixed(3)} rad/s
        </Text>
        <Text style={styles.message}>
          Recorded on a previous session. Open this challenge on a phone to
          remeasure.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Gyroscope measurement is not available in the browser. Complete this
        step on the iOS or Android app to record movement smoothness.
      </Text>
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
  saved: { color: "#2F80ED", fontSize: 14, fontWeight: "700", textAlign: "center" },
});
