// Web stub — accelerometer not available in browser.
// Students enter their count manually.
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

interface Props {
  onCapture: (bpm: number) => void;
  existingValue?: number;
}

export function BreathingRecorder({ onCapture, existingValue }: Props) {
  const [value, setValue] = useState(existingValue ? String(existingValue) : "");
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const save = () => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0) onCapture(n);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Breaths per minute</Text>
      <Text style={styles.hint}>
        Count breaths for 30 seconds, then multiply by 2.
      </Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="e.g. 15"
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={setValue}
      />
      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>Save</Text>
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
    label: { color: c.text, fontSize: 15, fontWeight: "700" },
    hint: { color: c.textSecondary, fontSize: 12 },
    input: {
      backgroundColor: c.infoLight,
      color: c.text,
      borderRadius: 10,
      padding: 12,
      fontSize: 20,
      fontWeight: "700",
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    btn: {
      backgroundColor: c.info,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    btnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  });
}
