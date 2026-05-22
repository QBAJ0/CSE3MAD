import { Gyroscope } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  MOTION_SAMPLE_INTERVAL_MS,
  RECORDER_UI_TICK_MS,
} from "../../config/sensorSampling";
import { useHaptic } from "../../hooks/useHaptic";
const MIN_SAMPLES = 8;

type GyroscopeCapture = {
  smoothness: number;
  range: number;
  samples: number;
};

interface GyroscopeRecorderProps {
  onCapture: (data: GyroscopeCapture) => void;
  duration?: number;
  existingValue?: { smoothness: number; range?: number };
}

export function GyroscopeRecorder({
  onCapture,
  duration = 5,
  existingValue,
}: GyroscopeRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [elapsed, setElapsed] = useState(0);
  const [currentValues, setCurrentValues] = useState({ x: 0, y: 0, z: 0 });
  const [smoothness, setSmoothness] = useState(existingValue?.smoothness ?? 0);
  const [peakRotation, setPeakRotation] = useState(existingValue?.range ?? 0);

  const { haptic } = useHaptic();
  const subscriptionRef = useRef<ReturnType<typeof Gyroscope.addListener> | null>(
    null,
  );
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uiTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const lastMagnitudeRef = useRef<number | null>(null);
  const changeSumRef = useRef(0);
  const peakRotationRef = useRef(0);
  const sampleCountRef = useRef(0);
  const recordingRef = useRef(false);
  const currentValuesRef = useRef({ x: 0, y: 0, z: 0 });

  const clearTimers = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (uiTickRef.current) {
      clearInterval(uiTickRef.current);
      uiTickRef.current = null;
    }
  }, []);

  const clearSubscription = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    clearSubscription();
    clearTimers();
    recordingRef.current = false;
  }, [clearSubscription, clearTimers]);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    const { status } = await Gyroscope.requestPermissionsAsync();
    const granted = status === "granted";
    setPermissionGranted(granted);
    return granted;
  }, []);

  useEffect(() => {
    let active = true;
    void Gyroscope.isAvailableAsync().then((available) => {
      if (!active) return;
      if (!available) {
        setPermissionGranted(false);
        return;
      }
      void ensurePermission();
    });
    return () => {
      active = false;
      cleanup();
    };
  }, [cleanup, ensurePermission]);

  const stopRecording = useCallback(() => {
    if (!recordingRef.current) return;

    cleanup();
    setRecording(false);
    setElapsed(duration);

    const samples = sampleCountRef.current;
    if (samples < MIN_SAMPLES) {
      haptic("warning");
      setSmoothness(0);
      setPeakRotation(0);
      return;
    }

    const averageChange = changeSumRef.current / (samples - 1);
    const smoothnessScore = Math.round(
      Math.max(0, Math.min(100, 100 - averageChange * 160)),
    );
    const range = Number(peakRotationRef.current.toFixed(3));

    setSmoothness(smoothnessScore);
    setPeakRotation(range);
    haptic("success");
    onCapture({ smoothness: smoothnessScore, range, samples });
  }, [cleanup, duration, haptic, onCapture]);

  const startRecording = useCallback(async () => {
    const granted = await ensurePermission();
    if (!granted) return;

    cleanup();
    haptic("medium");
    recordingRef.current = true;
    setRecording(true);
    setElapsed(0);
    setSmoothness(0);
    setPeakRotation(0);
    lastMagnitudeRef.current = null;
    changeSumRef.current = 0;
    peakRotationRef.current = 0;
    sampleCountRef.current = 0;
    currentValuesRef.current = { x: 0, y: 0, z: 0 };
    startTimeRef.current = Date.now();

    Gyroscope.setUpdateInterval(MOTION_SAMPLE_INTERVAL_MS);
    subscriptionRef.current = Gyroscope.addListener((data) => {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      const previousMagnitude = lastMagnitudeRef.current;

      currentValuesRef.current = data;
      sampleCountRef.current += 1;
      peakRotationRef.current = Math.max(peakRotationRef.current, magnitude);

      if (previousMagnitude != null) {
        changeSumRef.current += Math.abs(magnitude - previousMagnitude);
      }
      lastMagnitudeRef.current = magnitude;
    });

    uiTickRef.current = setInterval(() => {
      setCurrentValues({ ...currentValuesRef.current });
      setPeakRotation(peakRotationRef.current);
    }, RECORDER_UI_TICK_MS);

    durationTimerRef.current = setInterval(() => {
      const seconds = (Date.now() - startTimeRef.current) / 1000;
      setElapsed(Math.min(duration, seconds));
      if (seconds >= duration) stopRecording();
    }, RECORDER_UI_TICK_MS);
  }, [cleanup, duration, ensurePermission, haptic, stopRecording]);

  const resetSaved = () => {
    setSmoothness(0);
    setPeakRotation(0);
    onCapture({ smoothness: 0, range: 0, samples: 0 });
  };

  const hasSavedValue =
    !recording &&
    (existingValue?.smoothness !== undefined
      ? existingValue.smoothness > 0 || (existingValue.range ?? 0) > 0
      : smoothness > 0 || peakRotation > 0);

  if (permissionGranted === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Checking gyroscope…</Text>
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Gyroscope access required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => void ensurePermission()}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasSavedValue) {
    const displaySmoothness = existingValue?.smoothness ?? smoothness;
    const displayRange = existingValue?.range ?? peakRotation;
    const savedColor =
      displaySmoothness >= 75
        ? "#2F80ED"
        : displaySmoothness >= 45
          ? "#F6B84A"
          : "#EF4444";
    return (
      <View style={styles.container}>
        <Text style={styles.savedTitle}>Movement Control</Text>
        <View style={styles.savedStats}>
          <View style={styles.savedStat}>
            <Text style={styles.savedValue}>{displaySmoothness.toFixed(0)}</Text>
            <Text style={styles.savedLabel}>Smoothness (%)</Text>
          </View>
          <View style={styles.savedStat}>
            <Text style={styles.savedValue}>{displayRange.toFixed(3)}</Text>
            <Text style={styles.savedLabel}>Peak rotation (rad/s)</Text>
          </View>
        </View>
        <View style={styles.smoothnessBar}>
          <View
            style={[
              styles.smoothnessFill,
              {
                width: `${Math.min(100, displaySmoothness)}%`,
                backgroundColor: savedColor,
              },
            ]}
          />
        </View>
        <TouchableOpacity style={styles.retakeButton} onPress={resetSaved}>
          <Text style={styles.retakeButtonText}>Remeasure</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const magnitude = Math.sqrt(
    currentValues.x ** 2 + currentValues.y ** 2 + currentValues.z ** 2,
  );

  return (
    <View style={styles.container}>
      <View style={styles.valuesContainer}>
        <Value label="X" value={currentValues.x.toFixed(2)} />
        <Value label="Y" value={currentValues.y.toFixed(2)} />
        <Value label="Z" value={currentValues.z.toFixed(2)} />
        <Value label="Speed" value={magnitude.toFixed(2)} highlight />
      </View>

      {recording && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, (elapsed / duration) * 100)}%` },
            ]}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.recordButton, recording && styles.recordButtonActive]}
        onPress={recording ? stopRecording : () => void startRecording()}
      >
        <Text style={styles.recordButtonText}>
          {recording
            ? `Stop (${Math.max(0, Math.ceil(duration - elapsed))}s left)`
            : `Start ${duration}s Movement Test`}
        </Text>
      </TouchableOpacity>

      {!recording && (
        <Text style={styles.hint}>
          Hold the phone firmly and perform the selected movement at a steady pace.
        </Text>
      )}
    </View>
  );
}

function Value({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.valueItem}>
      <Text style={[styles.valueLabel, highlight && styles.valueHighlight]}>
        {label}
      </Text>
      <Text style={styles.valueText}>{value}</Text>
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
  },
  permissionText: { color: "#12343B", textAlign: "center", marginBottom: 12 },
  permissionButton: {
    backgroundColor: "#2F80ED",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  permissionButtonText: { color: "#F0F6FF", fontWeight: "700" },
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  valueItem: { alignItems: "center" },
  valueLabel: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  valueHighlight: { color: "#2F80ED" },
  valueText: {
    color: "#12343B",
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2F80ED",
    borderRadius: 4,
  },
  recordButton: {
    backgroundColor: "#2F80ED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  recordButtonActive: { backgroundColor: "#EF4444" },
  recordButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  hint: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  savedTitle: {
    color: "#2F80ED",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  savedStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 14,
  },
  savedStat: { alignItems: "center" },
  savedValue: {
    color: "#12343B",
    fontSize: 28,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  savedLabel: { color: "#64748B", fontSize: 11, marginTop: 2 },
  smoothnessBar: {
    height: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 14,
  },
  smoothnessFill: { height: "100%", borderRadius: 6 },
  retakeButton: {
    backgroundColor: "#3B82F6",
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  retakeButtonText: { color: "#FFF", fontWeight: "600" },
});
