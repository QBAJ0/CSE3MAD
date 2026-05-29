import { useEffect, useMemo, useRef, useState } from "react";
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

export function StopwatchRecorder({ measurement: _measurement, value, onChange }: Props) {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(parseFloat(value) || 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { haptic } = useHaptic();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = () => {
    haptic("medium");
    setRunning(true);
    const startTime = Date.now() - time * 1000;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setTime(elapsed);
      onChange(elapsed.toFixed(2));
    }, 100);
  };

  const stop = () => {
    haptic("medium");
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
  };

  const reset = () => {
    haptic("light");
    setTime(0);
    onChange("0");
    if (running) stop();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.display}>{time.toFixed(2)}s</Text>
      <View style={styles.buttons}>
        {!running ? (
          <TouchableOpacity style={[styles.button, styles.start]} onPress={start}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.stop]} onPress={stop}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.button, styles.reset]} onPress={reset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: { alignItems: "center", gap: 12 },
    display: {
      fontSize: 48,
      fontWeight: "800",
      color: c.info,
      fontVariant: ["tabular-nums"],
    },
    buttons: { flexDirection: "row", gap: 12 },
    button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    start: { backgroundColor: c.info },
    stop: { backgroundColor: c.danger },
    reset: { backgroundColor: c.textSecondary },
    buttonText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  });
}
