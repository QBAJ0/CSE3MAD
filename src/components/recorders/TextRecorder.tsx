import { StyleSheet, TextInput } from "react-native";
import { Measurement } from "../../types";

interface Props {
  measurement: Measurement;
  value: string;
  onChange: (value: string) => void;
}

export function TextRecorder({ measurement, value, onChange }: Props) {
  return (
    <TextInput
      style={styles.input}
      placeholder={measurement.placeholder || `Enter ${measurement.label}`}
      placeholderTextColor="#94A3B8"
      value={value}
      onChangeText={onChange}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
  },
});
