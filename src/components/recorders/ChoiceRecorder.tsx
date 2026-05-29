import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

  const isCustom = value !== "" && !choices.includes(value);
  const [showOtherInput, setShowOtherInput] = useState(isCustom);
  const [otherText, setOtherText] = useState(isCustom ? value : "");

  const selectChoice = (choice: string) => {
    haptic("light");
    setShowOtherInput(false);
    onChange(choice);
  };

  const selectOther = () => {
    haptic("light");
    setShowOtherInput(true);
    onChange(otherText);
  };

  const handleOtherChange = (text: string) => {
    setOtherText(text);
    onChange(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chipsRow}>
        {choices.map((choice) => (
          <TouchableOpacity
            key={choice}
            style={[styles.choice, value === choice && styles.choiceSelected]}
            onPress={() => selectChoice(choice)}
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

        {measurement.allowOther && (
          <TouchableOpacity
            style={[styles.choice, showOtherInput && styles.choiceSelected]}
            onPress={selectOther}
          >
            <Text
              style={[
                styles.choiceText,
                showOtherInput && styles.choiceTextSelected,
              ]}
            >
              Other
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showOtherInput && (
        <TextInput
          style={styles.otherInput}
          placeholder="Describe the action…"
          placeholderTextColor={colors.textMuted}
          value={otherText}
          onChangeText={handleOtherChange}
          autoFocus
        />
      )}
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: { gap: 10 },
    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
    otherInput: {
      borderWidth: 1,
      borderColor: c.info,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: c.text,
      backgroundColor: c.surface,
    },
  });
}
