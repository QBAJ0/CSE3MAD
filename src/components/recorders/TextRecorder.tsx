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

export function TextRecorder({ measurement, value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TextInput
      style={styles.input}
      placeholder={measurement.placeholder || `Enter ${measurement.label}`}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChange}
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
