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
      placeholderTextColor="#64748B"
      value={value}
      onChangeText={onChange}
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
