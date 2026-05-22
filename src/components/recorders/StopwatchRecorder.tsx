import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import { Measurement } from "../../types";

interface Props {
  measurement: Measurement;
  value: string;
  onChange: (value: string) => void;
}

export function StopwatchRecorder({ measurement, value, onChange }: Props) {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(parseFloat(value) || 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { haptic } = useHaptic();

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
          <TouchableOpacity
            style={[styles.button, styles.start]}
            onPress={start}
          >
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

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 12 },
  display: {
    fontSize: 48,
    fontWeight: "800",
    color: "#2F80ED",
    fontVariant: ["tabular-nums"],
  },
  buttons: { flexDirection: "row", gap: 12 },
  button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  start: { backgroundColor: "#2F80ED" },
  stop: { backgroundColor: "#EF4444" },
  reset: { backgroundColor: "#475569" },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
});
