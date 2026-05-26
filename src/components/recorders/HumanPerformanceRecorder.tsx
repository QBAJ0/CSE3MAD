import { Accelerometer, Gyroscope } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import {
  MOVEMENT_UNIT_FACTOR,
  buildHumanPerformanceFields,
  computeMovementUnits,
  computeSmoothnessScore,
} from "../../utils/humanPerformance";

export type HumanPerformanceSessionResult = {
  durationSeconds: number;
  movementUnits: number;
  peakG: number;
  totalMagnitudeSum: number;
  smoothnessScore: number;
  vibrationLabel: string;
  outcomeText: string;
};

type Props = {
  onComplete: (result: HumanPerformanceSessionResult) => void;
  onReset?: () => void;
  existing?: {
    durationSeconds?: number;
    movementUnits?: number;
    smoothnessScore?: number;
    outcomeText?: string;
    peakG?: number;
  };
};

export function HumanPerformanceRecorder({
  onComplete,
  onReset,
  existing,
}: Props) {
  const { haptic } = useHaptic();
  const [running, setRunning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [elapsed, setElapsed] = useState(existing?.durationSeconds ?? 0);
  const [liveMagnitude, setLiveMagnitude] = useState(0);
  const [liveMovementUnits, setLiveMovementUnits] = useState(
    existing?.movementUnits ?? 0,
  );
  const [liveSmoothness, setLiveSmoothness] = useState(
    existing?.smoothnessScore ?? 0,
  );
  const [savedOutcome, setSavedOutcome] = useState(existing?.outcomeText ?? "");
  const [savedSmoothness, setSavedSmoothness] = useState(
    existing?.smoothnessScore ?? 0,
  );

  const accelSubRef = useRef<{ remove: () => void } | null>(null);
  const gyroSubRef = useRef<{ remove: () => void } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const sumMagnitudeRef = useRef(0);
  const peakRef = useRef(0);
  const velocityChangesRef = useRef<number[]>([]);
  const lastGyroRef = useRef({ x: 0, y: 0, z: 0 });
  const runningRef = useRef(false);

  useEffect(() => {
    Promise.all([
      Accelerometer.requestPermissionsAsync(),
      Gyroscope.requestPermissionsAsync(),
    ]).then(([accel, gyro]) => {
      setPermissionGranted(
        accel.status === "granted" && gyro.status === "granted",
      );
    });
    return () => {
      accelSubRef.current?.remove();
      gyroSubRef.current?.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stopSensors = () => {
    accelSubRef.current?.remove();
    accelSubRef.current = null;
    gyroSubRef.current?.remove();
    gyroSubRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const finishSession = (durationSeconds: number) => {
    stopSensors();
    runningRef.current = false;
    setRunning(false);

    const smoothnessScore = Math.round(
      computeSmoothnessScore(velocityChangesRef.current),
    );

    const fields = buildHumanPerformanceFields({
      durationSeconds,
      totalMagnitudeSum: sumMagnitudeRef.current,
      peakG: peakRef.current,
      smoothnessScore,
    });

    const result: HumanPerformanceSessionResult = {
      durationSeconds,
      movementUnits: Number(fields.movementUnits),
      peakG: peakRef.current,
      totalMagnitudeSum: sumMagnitudeRef.current,
      smoothnessScore,
      vibrationLabel: String(fields.vibrationLabel),
      outcomeText: String(fields.outcomeText),
    };

    setSavedOutcome(result.outcomeText);
    setSavedSmoothness(smoothnessScore);
    setElapsed(durationSeconds);
    setLiveMovementUnits(result.movementUnits);
    setLiveSmoothness(smoothnessScore);
    haptic("success");
    onComplete(result);
  };

  const startSession = async () => {
    const [accelPerm, gyroPerm] = await Promise.all([
      Accelerometer.requestPermissionsAsync(),
      Gyroscope.requestPermissionsAsync(),
    ]);
    if (accelPerm.status !== "granted" || gyroPerm.status !== "granted") {
      setPermissionGranted(false);
      return;
    }
    setPermissionGranted(true);

    haptic("medium");
    sumMagnitudeRef.current = 0;
    peakRef.current = 0;
    velocityChangesRef.current = [];
    lastGyroRef.current = { x: 0, y: 0, z: 0 };
    setLiveMagnitude(0);
    setLiveMovementUnits(0);
    setLiveSmoothness(0);
    setSavedOutcome("");
    runningRef.current = true;
    setRunning(true);
    startTimeRef.current = Date.now();

    Accelerometer.setUpdateInterval(50);
    Gyroscope.setUpdateInterval(50);

    accelSubRef.current = Accelerometer.addListener((data) => {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      const gravityAdjusted = Math.abs(magnitude - 1);
      sumMagnitudeRef.current += gravityAdjusted;
      if (gravityAdjusted > peakRef.current) peakRef.current = gravityAdjusted;
      setLiveMagnitude(gravityAdjusted);
      setLiveMovementUnits(computeMovementUnits(sumMagnitudeRef.current));
    });

    gyroSubRef.current = Gyroscope.addListener((data) => {
      const deltaX = Math.abs(data.x - lastGyroRef.current.x);
      const deltaY = Math.abs(data.y - lastGyroRef.current.y);
      const deltaZ = Math.abs(data.z - lastGyroRef.current.z);
      velocityChangesRef.current.push(deltaX + deltaY + deltaZ);
      lastGyroRef.current = data;
      setLiveSmoothness(
        Math.round(computeSmoothnessScore(velocityChangesRef.current)),
      );
    });

    intervalRef.current = setInterval(() => {
      const secs = (Date.now() - startTimeRef.current) / 1000;
      setElapsed(secs);
    }, 100);
  };

  const stopSession = () => {
    if (!runningRef.current) return;
    haptic("medium");
    const durationSeconds = (Date.now() - startTimeRef.current) / 1000;
    finishSession(durationSeconds);
  };

  if (savedOutcome && !running) {
    return (
      <View style={styles.container}>
        <Text style={styles.savedTitle}>Movement session recorded</Text>
        <Text style={styles.savedOutcome}>{savedOutcome}</Text>
        <View style={styles.liveRow}>
          <View style={styles.liveBox}>
            <Text style={styles.liveValue}>
              {liveMovementUnits.toFixed(1)}
            </Text>
            <Text style={styles.liveLabel}>Movement units</Text>
          </View>
          <View style={styles.liveBox}>
            <Text style={styles.liveValue}>{elapsed.toFixed(2)}</Text>
            <Text style={styles.liveLabel}>Time (s)</Text>
          </View>
          <View style={styles.liveBox}>
            <Text style={styles.liveValue}>{savedSmoothness}%</Text>
            <Text style={styles.liveLabel}>Smoothness</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => {
            setSavedOutcome("");
            setElapsed(0);
            setLiveMovementUnits(0);
            setSavedSmoothness(0);
            setLiveSmoothness(0);
            onReset?.();
          }}
        >
          <Text style={styles.secondaryBtnText}>Record again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Hold the phone during your movement. One Start records timer, movement
        units, vibration, and smoothness together.
      </Text>

      <View style={styles.liveRow}>
        <View style={styles.liveBox}>
          <Text style={styles.liveValue}>
            {running ? liveMovementUnits.toFixed(1) : "—"}
          </Text>
          <Text style={styles.liveLabel}>Movement</Text>
        </View>
        <View style={styles.liveBox}>
          <Text style={styles.liveValue}>
            {running || elapsed > 0 ? elapsed.toFixed(2) : "—"}
          </Text>
          <Text style={styles.liveLabel}>Timer (s)</Text>
        </View>
        <View style={styles.liveBox}>
          <Text style={styles.liveValue}>
            {running ? `${liveSmoothness}%` : "—"}
          </Text>
          <Text style={styles.liveLabel}>Smoothness</Text>
        </View>
      </View>

      {running && (
        <Text style={styles.liveVibration}>
          Live vibration: {liveMagnitude.toFixed(2)} g
        </Text>
      )}

      {!permissionGranted && !running && (
        <Text style={styles.permissionText}>
          Accelerometer and gyroscope permissions are required.
        </Text>
      )}

      {!running ? (
        <TouchableOpacity style={styles.primaryBtn} onPress={startSession}>
          <Text style={styles.primaryBtnText}>Start movement & smoothness</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.stopBtn} onPress={stopSession}>
          <Text style={styles.stopBtnText}>Stop</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Web / simulator fallback when accelerometer is unavailable. */
export function HumanPerformanceRecorderWeb({
  onComplete,
  onReset,
  existing,
}: Props) {
  const [duration, setDuration] = useState(
    existing?.durationSeconds != null
      ? String(existing.durationSeconds)
      : "",
  );
  const [units, setUnits] = useState(
    existing?.movementUnits != null ? String(existing.movementUnits) : "",
  );
  const [smoothness, setSmoothness] = useState(
    existing?.smoothnessScore != null ? String(existing.smoothnessScore) : "",
  );

  const applyManual = () => {
    const durationSeconds = parseFloat(duration) || 0;
    const movementUnits = parseFloat(units) || 0;
    const smoothnessScore = Math.round(parseFloat(smoothness) || 0);
    const totalMagnitudeSum = movementUnits / MOVEMENT_UNIT_FACTOR;
    const peakG = totalMagnitudeSum > 0 ? movementUnits / durationSeconds / 2 : 0;
    const fields = buildHumanPerformanceFields({
      durationSeconds,
      totalMagnitudeSum,
      peakG,
      smoothnessScore,
    });
    onComplete({
      durationSeconds,
      movementUnits: Number(fields.movementUnits),
      peakG,
      totalMagnitudeSum,
      smoothnessScore,
      vibrationLabel: String(fields.vibrationLabel),
      outcomeText: String(fields.outcomeText),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Sensors are unavailable here. Enter all session values together.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Time (seconds)"
        keyboardType="decimal-pad"
        value={duration}
        onChangeText={setDuration}
      />
      <TextInput
        style={styles.input}
        placeholder="Movement units"
        keyboardType="decimal-pad"
        value={units}
        onChangeText={setUnits}
      />
      <TextInput
        style={styles.input}
        placeholder="Smoothness (0–100 %)"
        keyboardType="decimal-pad"
        value={smoothness}
        onChangeText={setSmoothness}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={applyManual}>
        <Text style={styles.primaryBtnText}>Save session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  hint: { fontSize: 13, color: "#64748B", lineHeight: 18, marginBottom: 12 },
  liveRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  liveBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  liveValue: { fontSize: 28, fontWeight: "800", color: "#0F766E" },
  liveLabel: { fontSize: 12, color: "#64748B", marginTop: 4 },
  liveVibration: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: { fontSize: 12, color: "#DC2626", marginBottom: 8 },
  primaryBtn: {
    backgroundColor: "#0F766E",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  stopBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  stopBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#475569", fontWeight: "600" },
  savedTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  savedOutcome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F766E",
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
});
