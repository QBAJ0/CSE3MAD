import { useMemo } from "react";
import { StyleSheet, TextInput } from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";
import { Measurement } from "../../types";

interface Props {
  measurement: Measurement;
  value: string;
  onChange: (value: string) => void;
}

export function NumberRecorder({ measurement, value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleChange = (text: string) => {
    const normalized = text.replace(",", ".");
    let next = "";
    let hasDecimal = false;

    for (const char of normalized) {
      if (char >= "0" && char <= "9") {
        next += char;
      } else if (char === "." && !hasDecimal) {
        next += char;
        hasDecimal = true;
      }
    }

    if (next.startsWith(".")) next = `0${next}`;
    onChange(next);
  };

  return (
    <TextInput
      style={styles.input}
      placeholder={measurement.placeholder || `Enter ${measurement.label}`}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      inputMode="decimal"
    />
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    input: {
      borderWidth: 1,
      borderColor: c.inputBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      backgroundColor: c.input,
      color: c.text,
    },
  });
}
