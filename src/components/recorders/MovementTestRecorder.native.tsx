import { Accelerometer, Gyroscope } from "expo-sensors";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

interface MovementTestResult {
  timeSeconds: number;
  vibrationPeak: number;
  smoothness: number;
}

interface MovementTestRecorderProps {
  onCapture: (data: MovementTestResult) => void;
  existingValues?: {
    timeSeconds?: unknown;
    vibrationData?: unknown;
    smoothness?: unknown;
  };
}

export function MovementTestRecorder({
  onCapture,
  existingValues,
}: MovementTestRecorderProps) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [livePeak, setLivePeak] = useState(0);
  const [result, setResult] = useState<MovementTestResult | null>(null);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const accelSubRef = useRef<any>(null);
  const gyroSubRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const peakRef = useRef<number>(0);
  const prevOmegaRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const omegaChangesRef = useRef<number[]>([]);

  const { haptic } = useHaptic();

  // Populate from existing saved values on first render
  useEffect(() => {
    const t = Number(existingValues?.timeSeconds);
    const v = Number(existingValues?.vibrationData);
    const s = Number(existingValues?.smoothness);
    if (t > 0 || v > 0 || s > 0) {
      setResult({
        timeSeconds: Number.isFinite(t) ? t : 0,
        vibrationPeak: Number.isFinite(v) ? v : 0,
        smoothness: Number.isFinite(s) ? s : 0,
      });
      setDone(true);
    }
  }, []);

  const start = async () => {
    haptic("medium");

    await Accelerometer.requestPermissionsAsync();
    await Gyroscope.requestPermissionsAsync();

    peakRef.current = 0;
    prevOmegaRef.current = null;
    omegaChangesRef.current = [];
    startTimeRef.current = Date.now();

    setElapsed(0);
    setLivePeak(0);
    setRunning(true);
    setDone(false);

    Accelerometer.setUpdateInterval(50);
    accelSubRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const adjusted = Math.abs(magnitude - 1);
      if (adjusted > peakRef.current) {
        peakRef.current = adjusted;
        setLivePeak(adjusted);
      }
    });

    Gyroscope.setUpdateInterval(50);
    gyroSubRef.current = Gyroscope.addListener((omega) => {
      if (prevOmegaRef.current) {
        const dx = omega.x - prevOmegaRef.current.x;
        const dy = omega.y - prevOmegaRef.current.y;
        const dz = omega.z - prevOmegaRef.current.z;
        const change = Math.sqrt(dx * dx + dy * dy + dz * dz);
        omegaChangesRef.current.push(change);
      }
      prevOmegaRef.current = { x: omega.x, y: omega.y, z: omega.z };
    });

    intervalRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  };

  const stop = () => {
    accelSubRef.current?.remove();
    gyroSubRef.current?.remove();
    accelSubRef.current = null;
    gyroSubRef.current = null;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const timeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const changes = omegaChangesRef.current;
    const avgChange =
      changes.length > 0
        ? changes.reduce((a, b) => a + b, 0) / changes.length
        : 0;
    const smoothness = Math.max(0, Math.min(100, 100 - avgChange * 100));

    const data: MovementTestResult = {
      timeSeconds,
      vibrationPeak: peakRef.current,
      smoothness: Math.round(smoothness),
    };

    setResult(data);
    setElapsed(timeSeconds);
    setRunning(false);
    setDone(true);
    haptic("success");
    onCapture(data);
  };

  const remeasure = () => {
    setDone(false);
    setResult(null);
    setElapsed(0);
    setLivePeak(0);
  };

  if (done && result) {
    return (
      <View style={styles.container}>
        <Text style={styles.doneTitle}>Movement Test Complete</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{result.timeSeconds}s</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{result.vibrationPeak.toFixed(3)}g</Text>
            <Text style={styles.statLabel}>Peak vibration</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{result.smoothness}</Text>
            <Text style={styles.statLabel}>Smoothness</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.remeasureBtn} onPress={remeasure}>
          <Text style={styles.remeasureBtnText}>Remeasure</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (running) {
    return (
      <View style={styles.container}>
        <Text style={styles.runningTitle}>Recording...</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{elapsed}s</Text>
            <Text style={styles.statLabel}>Elapsed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{livePeak.toFixed(3)}g</Text>
            <Text style={styles.statLabel}>Peak</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.stopBtn} onPress={stop}>
          <Text style={styles.stopBtnText}>Stop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Tap Start, perform your movement, then tap Stop. Time, vibration and
        smoothness are measured simultaneously.
      </Text>
      <TouchableOpacity style={styles.startBtn} onPress={start}>
        <Text style={styles.startBtnText}>Start Movement Test</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 12,
    },
    hint: {
      color: c.textSecondary,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
    },
    startBtn: {
      backgroundColor: c.info,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    startBtnText: {
      color: "#FFF",
      fontSize: 15,
      fontWeight: "700",
    },
    runningTitle: {
      color: c.danger,
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
    stopBtn: {
      backgroundColor: c.danger,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    stopBtnText: {
      color: "#FFF",
      fontSize: 15,
      fontWeight: "700",
    },
    doneTitle: {
      color: c.success,
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    stat: {
      alignItems: "center",
      gap: 2,
    },
    statValue: {
      color: c.text,
      fontSize: 20,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    statLabel: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: "500",
    },
    remeasureBtn: {
      backgroundColor: c.infoLight,
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    remeasureBtnText: {
      color: c.info,
      fontWeight: "600",
      fontSize: 14,
    },
  });
}
