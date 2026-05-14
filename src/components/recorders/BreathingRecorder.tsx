// Web stub — accelerometer not available in browser.
// Students enter their count manually.
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface Props {
  onCapture: (bpm: number) => void;
  existingValue?: number;
}

export function BreathingRecorder({ onCapture, existingValue }: Props) {
  const [value, setValue] = useState(existingValue ? String(existingValue) : "");

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
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={setValue}
      />
      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 10,
  },
  label: { color: "#12343B", fontSize: 15, fontWeight: "700" },
  hint: { color: "#64748B", fontSize: 12 },
  input: {
    backgroundColor: "#F0F6FF",
    color: "#12343B",
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  btn: {
    backgroundColor: "#2F80ED",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
