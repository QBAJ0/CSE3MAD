import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GyroscopeRecorderProps {
  onCapture: (data: { smoothness: number; range: number; samples: number }) => void;
  duration?: number;
  existingValue?: { smoothness: number; range?: number };
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
        onPress={() => onCapture({ smoothness: 0, range: 0, samples: 0 })}
      >
        <Text style={styles.buttonText}>Skip (record 0)</Text>
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
  button: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: { color: "#12343B", fontWeight: "600" },
});
