import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

interface GyroscopeRecorderProps {
  onCapture: (data: { smoothness: number; range: number }) => void;
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

    onCapture({ smoothness, range });
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
          onPress={() => onCapture({ smoothness: 0, range: 0 })}
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
        placeholderTextColor={colors.textSecondary}
        value={smoothnessText}
        onChangeText={setSmoothnessText}
      />
      <Text style={styles.label}>Peak rotation (rad/s, optional)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="e.g. 1.2"
        placeholderTextColor={colors.textSecondary}
        value={peakText}
        onChangeText={setPeakText}
      />
      <TouchableOpacity style={styles.saveButton} onPress={save}>
        <Text style={styles.saveButtonText}>Save values</Text>
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
      padding: 16,
      gap: 10,
    },
    message: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
    },
    hint: {
      color: c.textSecondary,
      fontSize: 12,
      textAlign: "center",
    },
    label: { color: c.text, fontSize: 14, fontWeight: "700" },
    input: {
      backgroundColor: c.infoLight,
      color: c.text,
      borderRadius: 10,
      padding: 12,
      fontSize: 18,
      fontWeight: "600",
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    saveButton: {
      backgroundColor: c.info,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 4,
    },
    saveButtonText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
    saved: { color: c.info, fontSize: 14, fontWeight: "700", textAlign: "center" },
    button: {
      backgroundColor: c.backgroundSecondary,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 10,
      alignItems: "center",
    },
    buttonText: { color: c.text, fontWeight: "600" },
  });
}
