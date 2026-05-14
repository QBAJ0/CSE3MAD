import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import { Measurement } from "../../types";

interface Props {
  measurement: Measurement;
  value: string;
  onChange: (value: string) => void;
}

export function ChoiceRecorder({ measurement, value, onChange }: Props) {
  const { haptic } = useHaptic();
  const choices = measurement.choices || [];

  return (
    <View style={styles.container}>
      {choices.map((choice) => (
        <TouchableOpacity
          key={choice}
          style={[styles.choice, value === choice && styles.choiceSelected]}
          onPress={() => {
            haptic("light");
            onChange(choice);
          }}
        >
          <Text
            style={[
              styles.choiceText,
              value === choice && styles.choiceTextSelected,
            ]}
          >
            {choice}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  choice: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  choiceSelected: { backgroundColor: "#2F80ED", borderColor: "#2F80ED" },
  choiceText: { color: "#12343B", fontSize: 14 },
  choiceTextSelected: { color: "#F0F6FF", fontWeight: "700" },
});
