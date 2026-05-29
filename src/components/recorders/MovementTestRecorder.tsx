import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

interface MovementTestResult {
  timeSeconds: number;
  vibrationPeak: number;
  smoothness: number;
}

interface MovementTestRecorderProps {
  onCapture: (data: MovementTestResult) => void;
  existingValues?: {
    timeSeconds?: unknown;
    vibrationData?: unknown;
    smoothness?: unknown;
  };
}

export function MovementTestRecorder({
  onCapture,
  existingValues,
}: MovementTestRecorderProps) {
  const [timeInput, setTimeInput] = useState(
    existingValues?.timeSeconds ? String(existingValues.timeSeconds) : "",
  );
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSubmit = () => {
    const t = parseFloat(timeInput);
    if (!Number.isFinite(t) || t <= 0) return;
    onCapture({ timeSeconds: t, vibrationPeak: 0, smoothness: 0 });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Motion sensors are only available on device. Enter time manually.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Time (seconds)"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        value={timeInput}
        onChangeText={setTimeInput}
      />
      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 10,
    },
    hint: {
      color: c.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
    input: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 8,
      padding: 10,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.input,
    },
    btn: {
      backgroundColor: c.info,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    btnText: {
      color: "#FFF",
      fontWeight: "700",
    },
  });
}
