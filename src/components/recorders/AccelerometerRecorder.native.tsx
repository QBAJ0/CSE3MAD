// components/recorders/AccelerometerRecorder.tsx
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";
import { useHaptic } from "../../hooks/useHaptic";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 120;

// Repeating tremor pattern: on/off bursts that simulate ground shaking
const EARTHQUAKE_PATTERN = [0, 80, 40, 100, 30, 80, 50, 120, 20, 80];

interface AccelerometerRecorderProps {
  onCapture: (data: { peak: number; average: number; samples: number }) => void;
  duration?: number;
  existingValue?: { peak: number; average: number };
  vibrateMode?: boolean;
}

export function AccelerometerRecorder({
  onCapture,
  duration = 5,
  existingValue,
  vibrateMode = false,
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
  const subscriptionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const sumMagnitudeRef = useRef<number>(0);
  const countRef = useRef<number>(0);
  const chartAnim = useRef(new Animated.Value(0)).current;
  // Ref mirrors recording state so the auto-stop setTimeout always reads the current value
  const recordingRef = useRef(false);

  useEffect(() => {
    requestPermissions();
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Accelerometer.requestPermissionsAsync();
    setPermissionGranted(status === "granted");
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      if (!permissionGranted) return;
    }

    haptic("medium");
    if (vibrateMode) Vibration.vibrate(EARTHQUAKE_PATTERN, true);
    recordingRef.current = true;
    setRecording(true);
    setPeakMagnitude(0);
    setAverageMagnitude(0);
    setSamples([]);
    sumMagnitudeRef.current = 0;
    countRef.current = 0;
    startTimeRef.current = Date.now();

    Accelerometer.setUpdateInterval(50); // 20Hz
    subscriptionRef.current = Accelerometer.addListener((data) => {
      const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      const gravityAdjusted = Math.abs(magnitude - 1); // Remove gravity (1g baseline)

      setCurrentValues({
        x: data.x,
        y: data.y,
        z: data.z,
        magnitude: gravityAdjusted,
      });
      setSamples((prev) => [...prev.slice(-50), gravityAdjusted]);

      sumMagnitudeRef.current += gravityAdjusted;
      countRef.current++;

      if (gravityAdjusted > peakMagnitude) {
        setPeakMagnitude(gravityAdjusted);
      }

      // Animate chart
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: false,
      }).start(() => chartAnim.setValue(0));
    });

    // Auto-stop after duration
    setTimeout(() => {
      if (recordingRef.current) stopRecording();
    }, duration * 1000);
  };

  const stopRecording = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    if (vibrateMode) Vibration.cancel();
    recordingRef.current = false;

    const avg =
      countRef.current > 0 ? sumMagnitudeRef.current / countRef.current : 0;
    setAverageMagnitude(avg);

    haptic("success");
    setRecording(false);

    onCapture({
      peak: peakMagnitude,
      average: avg,
      samples: countRef.current,
    });
  };

  const getStabilityLevel = (peak: number) => {
    if (peak < 0.05)
      return { label: "Rock Solid", color: "#2563EB" };
    if (peak < 0.1) return { label: "Stable", color: "#F97316" };
    if (peak < 0.2) return { label: "Wobbly", color: "#F59E0B" };
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
          onPress={requestPermissions}
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
            stroke="#2563EB"
            strokeWidth={2}
            fill="none"
          />
          {/* Threshold lines */}
          <Line
            x1={0}
            x2={CHART_WIDTH}
            y1={CHART_HEIGHT * 0.2}
            y2={CHART_HEIGHT * 0.2}
            stroke="#F59E0B"
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
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.recordButtonText}>
          {recording
            ? "⏹️ Stop & Cancel Vibration"
            : vibrateMode
              ? `🌍 Start Earthquake Simulation (${duration}s)`
              : `📳 Start (${duration}s)`}
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
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#EFF6FF",
    fontWeight: "700",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#EFF6FF",
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
    color: "#2563EB",
  },
  valueText: {
    color: "#0F172A",
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
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
  },
  peakLabel: {
    color: "#0F172A",
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
    backgroundColor: "#2563EB",
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
    color: "#2563EB",
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
    color: "#0F172A",
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
    backgroundColor: "#2563EB",
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  retakeButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
