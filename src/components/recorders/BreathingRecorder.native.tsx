import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { useHaptic } from "../../hooks/useHaptic";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 100;
const DURATION_S = 30;
const MIN_BREATH_INTERVAL_MS = 1500; // caps at 40 breaths/min
const RISE_THRESHOLD = 0.012;        // g — gentle chest rise
const FALL_THRESHOLD = -0.005;       // g — chest falls back
const MEAN_WINDOW = 60;              // 3 s rolling mean at 20 Hz

interface Props {
  onCapture: (bpm: number) => void;
  existingValue?: number;
}

export function BreathingRecorder({ onCapture, existingValue }: Props) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const { haptic } = useHaptic();

  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const zHistoryRef = useRef<number[]>([]);
  const aboveThresholdRef = useRef(false);
  const lastBreathTimeRef = useRef(0);
  const breathCountRef = useRef(0);

  useEffect(() => {
    Accelerometer.requestPermissionsAsync().then(({ status }) =>
      setPermissionGranted(status === "granted"),
    );
    return cleanup;
  }, []);

  const cleanup = () => {
    subscriptionRef.current?.remove();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = () => {
    haptic("medium");
    setRecording(true);
    setBreathCount(0);
    setElapsed(0);
    setWaveform([]);
    zHistoryRef.current = [];
    aboveThresholdRef.current = false;
    lastBreathTimeRef.current = 0;
    breathCountRef.current = 0;
    startTimeRef.current = Date.now();

    Accelerometer.setUpdateInterval(50); // 20 Hz
    subscriptionRef.current = Accelerometer.addListener(({ z }) => {
      // Rolling mean subtraction removes gravity offset
      zHistoryRef.current.push(z);
      if (zHistoryRef.current.length > MEAN_WINDOW) zHistoryRef.current.shift();
      const mean =
        zHistoryRef.current.reduce((a, b) => a + b, 0) /
        zHistoryRef.current.length;
      const signal = z - mean;

      // Hysteresis threshold crossing counts one breath per rise
      if (!aboveThresholdRef.current && signal > RISE_THRESHOLD) {
        const now = Date.now();
        if (now - lastBreathTimeRef.current > MIN_BREATH_INTERVAL_MS) {
          breathCountRef.current++;
          setBreathCount(breathCountRef.current);
          lastBreathTimeRef.current = now;
        }
        aboveThresholdRef.current = true;
      } else if (aboveThresholdRef.current && signal < FALL_THRESHOLD) {
        aboveThresholdRef.current = false;
      }

      setWaveform((prev) => [
        ...prev.slice(-(Math.floor(CHART_WIDTH / 3))),
        Math.max(-0.1, Math.min(0.1, signal)),
      ]);
    });

    timerRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      if (secs >= DURATION_S) stopRecording();
    }, 500);
  };

  const stopRecording = () => {
    cleanup();
    setRecording(false);
    const durationSeconds = Math.max(1, (Date.now() - startTimeRef.current) / 1000);
    const bpm = Math.round((breathCountRef.current / durationSeconds) * 60);
    haptic("success");
    onCapture(Math.max(0, bpm));
  };

  const getChartPath = () => {
    if (waveform.length < 2) return "";
    const step = CHART_WIDTH / Math.max(waveform.length - 1, 1);
    const mid = CHART_HEIGHT / 2;
    const scale = CHART_HEIGHT / 0.2; // ±0.1 g spans full height
    return waveform
      .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${mid - v * scale}`)
      .join(" ");
  };

  const estimatedBpm = elapsed > 3
    ? Math.round((breathCount / Math.max(1, elapsed)) * 60)
    : null;

  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.msgText}>Motion sensor access required</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() =>
            Accelerometer.requestPermissionsAsync().then(({ status }) =>
              setPermissionGranted(status === "granted"),
            )
          }
        >
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recording && existingValue != null && existingValue > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.savedLabel}>Auto-measured</Text>
        <Text style={styles.savedBpm}>{existingValue}</Text>
        <Text style={styles.savedUnit}>breaths / min</Text>
        <View style={[styles.badge, { backgroundColor: badgeColor(existingValue) + "30" }]}>
          <Text style={[styles.badgeText, { color: badgeColor(existingValue) }]}>
            {rateLabel(existingValue)}
          </Text>
        </View>
        <TouchableOpacity style={styles.retakeBtn} onPress={() => onCapture(0)}>
          <Text style={styles.retakeBtnText}>Remeasure</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live waveform */}
      <View style={styles.chart}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Centreline */}
          <Line
            x1={0} x2={CHART_WIDTH}
            y1={CHART_HEIGHT / 2} y2={CHART_HEIGHT / 2}
            stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4,4"
          />
          <Path d={getChartPath()} stroke="#2563EB" strokeWidth={2} fill="none" />
        </Svg>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Stat value={String(breathCount)} label="Breaths" />
        <Stat value={`${elapsed}s`} label="Elapsed" />
        <Stat
          value={estimatedBpm != null ? String(estimatedBpm) : "—"}
          label="Est. BPM"
          highlight
        />
      </View>

      {/* Duration progress bar */}
      {recording && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, (elapsed / DURATION_S) * 100)}%` },
            ]}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, recording && styles.btnStop]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.btnText}>
          {recording
            ? `Stop (${DURATION_S - elapsed}s left)`
            : `Start ${DURATION_S}s Measurement`}
        </Text>
      </TouchableOpacity>

      {!recording && (
        <Text style={styles.hint}>
          Lie down. Place the phone flat on your chest. Breathe normally.
        </Text>
      )}
    </View>
  );
}

function Stat({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && styles.statHighlight]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function badgeColor(bpm: number) {
  if (bpm <= 20) return "#2563EB";
  if (bpm <= 30) return "#F59E0B";
  return "#EF4444";
}

function rateLabel(bpm: number) {
  if (bpm < 12) return "Below normal";
  if (bpm <= 20) return "Normal resting rate";
  if (bpm <= 30) return "Elevated — light activity";
  return "High — post-exercise";
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
  },
  msgText: { color: "#0F172A", textAlign: "center", marginBottom: 12 },
  chart: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  stat: { alignItems: "center" },
  statValue: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statHighlight: { color: "#2563EB" },
  statLabel: { color: "#64748B", fontSize: 11, marginTop: 2 },
  progressTrack: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 4,
  },
  btn: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  btnStop: { backgroundColor: "#EF4444" },
  btnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  hint: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  savedLabel: { color: "#64748B", fontSize: 12, textAlign: "center", marginBottom: 4 },
  savedBpm: {
    color: "#2563EB",
    fontSize: 56,
    fontWeight: "800",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  savedUnit: { color: "#64748B", fontSize: 14, textAlign: "center", marginBottom: 10 },
  badge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, alignSelf: "center", marginBottom: 14 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  retakeBtn: {
    backgroundColor: "#2563EB",
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  retakeBtnText: { color: "#FFF", fontWeight: "600" },
});
