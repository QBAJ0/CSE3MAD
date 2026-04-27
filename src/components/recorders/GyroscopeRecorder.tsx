import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GyroscopeRecorderProps {
  onCapture: (data: { smoothness: number; range: number }) => void;
  duration?: number;
}

export function GyroscopeRecorder({ onCapture }: GyroscopeRecorderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔄</Text>
      <Text style={styles.message}>
        Gyroscope not available on web.{"\n"}Use the mobile app to measure
        movement smoothness.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onCapture({ smoothness: 0, range: 0 })}
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
  button: {
    backgroundColor: "#334155",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: { color: "#F8FAFC", fontWeight: "600" },
});
