import { StyleSheet, TextInput } from "react-native";
import { Measurement } from "../../types";

interface Props {
  measurement: Measurement;
  value: string;
  onChange: (value: string) => void;
}

export function NumberRecorder({ measurement, value, onChange }: Props) {
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
      placeholderTextColor="#64748B"
      value={value}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      inputMode="decimal"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#12343B",
  },
});
