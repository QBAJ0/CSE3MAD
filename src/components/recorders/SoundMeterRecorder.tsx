import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

interface SoundMeterRecorderProps {
  onCapture: (db: number) => void;
  existingValue?: number;
}

export function SoundMeterRecorder({
  onCapture,
  existingValue,
}: SoundMeterRecorderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    saved: { color: c.info, fontSize: 16, fontWeight: "700" },
    button: {
      backgroundColor: c.backgroundSecondary,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 10,
    },
    buttonText: { color: c.text, fontWeight: "600" },
  });
}
