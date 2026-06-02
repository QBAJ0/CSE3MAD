import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

interface VideoRecorderProps {
  onCapture: (uri: string) => void;
  existingUri?: string;
  maxDuration?: number;
}

export function VideoRecorder({ onCapture, existingUri }: VideoRecorderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (existingUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.saved}>Video recorded (mobile only)</Text>
        <TouchableOpacity style={styles.button} onPress={() => onCapture("")}>
          <Text style={styles.buttonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Video recording not available on web.{"\n"}Use the mobile app to record
        videos.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => onCapture("")}>
        <Text style={styles.buttonText}>Skip</Text>
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
      padding: 20,
      alignItems: "center",
      gap: 12,
    },
    message: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
    },
    saved: { color: c.info, fontSize: 14, fontWeight: "700" },
    button: {
      backgroundColor: c.backgroundSecondary,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 10,
    },
    buttonText: { color: c.text, fontWeight: "600" },
  });
}
