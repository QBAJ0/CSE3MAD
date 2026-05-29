import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";
import { Measurement } from "../../types";

interface Props {
  measurement: Measurement;
  value: string;
  onChange: (value: string) => void;
}

export function ChoiceRecorder({ measurement, value, onChange }: Props) {
  const { haptic } = useHaptic();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    choice: {
      flex: 1,
      minWidth: 80,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: "center",
    },
    choiceSelected: { backgroundColor: c.info, borderColor: c.info },
    choiceText: { color: c.text, fontSize: 14 },
    choiceTextSelected: { color: c.infoLight, fontWeight: "700" },
  });
}
