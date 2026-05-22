// components/recorders/AccelerometerRecorder.tsx
import { Accelerometer } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import {
  MOTION_SAMPLE_INTERVAL_MS,
  RECORDER_UI_TICK_MS,
} from "../../config/sensorSampling";
import { useHaptic } from "../../hooks/useHaptic";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 120;

interface AccelerometerRecorderProps {
  onCapture: (data: { peak: number; average: number; samples: number }) => void;
  duration?: number;
  existingValue?: { peak: number; average: number };
}

export function AccelerometerRecorder({
  onCapture,
  duration = 5,
  existingValue,
}: AccelerometerRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [currentValues, setCurrentValues] = useState({
    x: 0,
    y: 0,
    z: 0,
    magnitude: 0,
  });
  const [peakMagnitude, setPeakMagnitude] = useState(existingValue?.peak || 0);
  const [averageMagnitude, setAverageMagnitude] = useState(
    existingValue?.average || 0,
  );
  const [samples, setSamples] = useState<number[]>([]);
  const { haptic } = useHaptic();
  const subscriptionRef = useRef<ReturnType<
    typeof Accelerometer.addListener
  > | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef(false);
  const startTimeRef = useRef(0);
  const sumMagnitudeRef = useRef(0);
  const countRef = useRef(0);
  const peakRef = useRef(0);
  const currentValuesRef = useRef({ x: 0, y: 0, z: 0, magnitude: 0 });
  const samplesRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
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

  const ensurePermission = useCallback(async () => {
    const { status } = await Accelerometer.requestPermissionsAsync();
    const granted = status === "granted";
    setPermissionGranted(granted);
    return granted;
  }, []);

  useEffect(() => {
    void ensurePermission();
    return cleanup;
  }, [cleanup, ensurePermission]);

  const stopRecording = useCallback(() => {
    if (!recordingRef.current) return;

    cleanup();
    setRecording(false);

    const avg =
      countRef.current > 0 ? sumMagnitudeRef.current / countRef.current : 0;
    const peak = peakRef.current;
    setAverageMagnitude(avg);
    setPeakMagnitude(peak);
    setSamples([...samplesRef.current]);
    setCurrentValues({ ...currentValuesRef.current });

    haptic("success");
    onCapture({
      peak,
      average: avg,
      samples: countRef.current,
    });
  }, [cleanup, haptic, onCapture]);

  const startRecording = useCallback(async () => {
    const granted = await ensurePermission();
    if (!granted) return;

    cleanup();
    haptic("medium");
    recordingRef.current = true;
    setRecording(true);
    setPeakMagnitude(0);
    setAverageMagnitude(0);
    setSamples([]);
    sumMagnitudeRef.current = 0;
    countRef.current = 0;
    peakRef.current = 0;
    samplesRef.current = [];
    currentValuesRef.current = { x: 0, y: 0, z: 0, magnitude: 0 };
    startTimeRef.current = Date.now();

    Accelerometer.setUpdateInterval(MOTION_SAMPLE_INTERVAL_MS);
    subscriptionRef.current = Accelerometer.addListener((data) => {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      const gravityAdjusted = Math.abs(magnitude - 1);

      currentValuesRef.current = {
        x: data.x,
        y: data.y,
        z: data.z,
        magnitude: gravityAdjusted,
      };
      samplesRef.current = [
        ...samplesRef.current.slice(-50),
        gravityAdjusted,
      ];

      sumMagnitudeRef.current += gravityAdjusted;
      countRef.current++;

      if (gravityAdjusted > peakRef.current) {
        peakRef.current = gravityAdjusted;
      }
    });

    uiTickRef.current = setInterval(() => {
      setCurrentValues({ ...currentValuesRef.current });
      setPeakMagnitude(peakRef.current);
      setSamples([...samplesRef.current]);
    }, RECORDER_UI_TICK_MS);

    autoStopRef.current = setTimeout(() => {
      stopRecording();
    }, duration * 1000);
  }, [cleanup, duration, ensurePermission, haptic, stopRecording]);

  const getStabilityLevel = (peak: number) => {
    if (peak < 0.05)
      return { label: "Rock Solid", color: "#2F80ED" };
    if (peak < 0.1) return { label: "Stable", color: "#F28C28" };
    if (peak < 0.2) return { label: "Wobbly", color: "#F6B84A" };
    if (peak < 0.35)
      return { label: "Unstable", color: "#F97316" };
    return { label: "Collapse Risk", color: "#EF4444" };
  };

  const stability = getStabilityLevel(peakMagnitude);

  // Generate chart path from samples
  const getChartPath = () => {
    if (samples.length < 2) return "";
    const step = CHART_WIDTH / (samples.length - 1);
    const maxVal = Math.max(...samples, 0.5);
    let path = "";
    samples.forEach((val, i) => {
      const x = i * step;
      const y = CHART_HEIGHT - (val / maxVal) * CHART_HEIGHT;
      if (i === 0) path += `M ${x} ${y}`;
      else path += ` L ${x} ${y}`;
    });
    return path;
  };

  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Motion sensor access required
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => void ensurePermission()}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recording && (existingValue?.peak || peakMagnitude > 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.savedContainer}>
          <Text style={styles.savedTitle}>Measured Data</Text>
          <View style={styles.savedStats}>
            <View style={styles.savedStat}>
              <Text style={styles.savedStatValue}>
                {peakMagnitude.toFixed(3)}
              </Text>
              <Text style={styles.savedStatLabel}>Peak (g)</Text>
            </View>
            <View style={styles.savedStat}>
              <Text style={styles.savedStatValue}>
                {averageMagnitude.toFixed(3)}
              </Text>
              <Text style={styles.savedStatLabel}>Average (g)</Text>
            </View>
          </View>
          <View
            style={[
              styles.savedBadge,
              { backgroundColor: stability.color + "20" },
            ]}
          >
            <Text style={[styles.savedBadgeText, { color: stability.color }]}>
              {stability.label}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => onCapture({ peak: 0, average: 0, samples: 0 })}
          >
            <Text style={styles.retakeButtonText}>Remeasure</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Chart */}
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Path
            d={getChartPath()}
            stroke="#2F80ED"
            strokeWidth={2}
            fill="none"
          />
          {/* Threshold lines */}
          <Line
            x1={0}
            x2={CHART_WIDTH}
            y1={CHART_HEIGHT * 0.2}
            y2={CHART_HEIGHT * 0.2}
            stroke="#F6B84A"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
          <Line
            x1={0}
            x2={CHART_WIDTH}
            y1={CHART_HEIGHT * 0.5}
            y2={CHART_HEIGHT * 0.5}
            stroke="#F97316"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
          <Line
            x1={0}
            x2={CHART_WIDTH}
            y1={CHART_HEIGHT * 0.8}
            y2={CHART_HEIGHT * 0.8}
            stroke="#EF4444"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        </Svg>
      </View>

      {/* Live Values */}
      <View style={styles.valuesContainer}>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>X</Text>
          <Text style={styles.valueText}>{currentValues.x.toFixed(2)}</Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Y</Text>
          <Text style={styles.valueText}>{currentValues.y.toFixed(2)}</Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Z</Text>
          <Text style={styles.valueText}>{currentValues.z.toFixed(2)}</Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={[styles.valueLabel, styles.magnitudeLabel]}>
            Movement
          </Text>
          <Text style={[styles.valueText, { color: stability.color }]}>
            {currentValues.magnitude.toFixed(3)}g
          </Text>
        </View>
      </View>

      {/* Peak & Status */}
      <View style={styles.peakContainer}>
        <Text style={styles.peakLabel}>Peak: {peakMagnitude.toFixed(3)}g</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: stability.color + "20" },
          ]}
        >
          <Text style={[styles.statusText, { color: stability.color }]}>
              {stability.label}
          </Text>
        </View>
      </View>

      {/* Control Button */}
      <TouchableOpacity
        style={[styles.recordButton, recording && styles.recordButtonActive]}
        onPress={recording ? stopRecording : () => void startRecording()}
      >
        <Text style={styles.recordButtonText}>
          {recording ? "⏹️ Stop Measurement" : `📳 Start ({duration}s)`}
        </Text>
      </TouchableOpacity>

      {/* Countdown/Timer Display */}
      {recording && (
        <Text style={styles.timerText}>
          Measuring...{" "}
          {Math.max(
            0,
            duration - (Date.now() - startTimeRef.current) / 1000,
          ).toFixed(0)}
          s remaining
        </Text>
      )}
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
  permissionText: {
    color: "#12343B",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: "#2F80ED",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#F0F6FF",
    fontWeight: "700",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F0F6FF",
    borderRadius: 12,
    padding: 8,
  },
  valuesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  valueItem: {
    alignItems: "center",
  },
  valueLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  magnitudeLabel: {
    color: "#2F80ED",
  },
  valueText: {
    color: "#12343B",
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  peakContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F0F6FF",
    borderRadius: 12,
  },
  peakLabel: {
    color: "#12343B",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  recordButton: {
    backgroundColor: "#2F80ED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  recordButtonActive: {
    backgroundColor: "#EF4444",
  },
  recordButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  timerText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
  },
  savedContainer: {
    alignItems: "center",
    gap: 12,
  },
  savedTitle: {
    color: "#2F80ED",
    fontSize: 16,
    fontWeight: "700",
  },
  savedStats: {
    flexDirection: "row",
    gap: 24,
  },
  savedStat: {
    alignItems: "center",
  },
  savedStatValue: {
    color: "#12343B",
    fontSize: 24,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  savedStatLabel: {
    color: "#64748B",
    fontSize: 11,
  },
  savedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  savedBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  retakeButton: {
    backgroundColor: "#3B82F6",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  retakeButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
