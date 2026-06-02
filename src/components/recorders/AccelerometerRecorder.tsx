import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

interface AccelerometerRecorderProps {
  onCapture: (data: { peak: number; average: number; samples: number }) => void;
  duration?: number;
  existingValue?: { peak: number; average: number };
  vibrateMode?: boolean;
}

export function AccelerometerRecorder({
  onCapture,
  existingValue,
}: AccelerometerRecorderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (existingValue?.peak) {
    return (
      <View style={styles.container}>
        <Text style={styles.saved}>
          Peak: {existingValue.peak.toFixed(3)}g — Avg:{" "}
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
      <Text style={styles.icon}>Motion sensor unavailable on web.</Text>
      <Text style={styles.message}>
        Use the mobile app to measure vibration.
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

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
      alignItems: "center",
      gap: 12,
    },
    icon: { fontSize: 32 },
    message: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
    },
    saved: { color: c.info, fontSize: 14, fontWeight: "700" },
    button: {
      backgroundColor: c.backgroundSecondary,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 10,
    },
    buttonText: { color: c.text, fontWeight: "600" },
  });
}
