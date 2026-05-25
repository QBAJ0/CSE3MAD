// components/recorders/TracingRecorder.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    LayoutChangeEvent,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useHaptic } from "../../hooks/useHaptic";

const { width: screenWidth } = Dimensions.get("window");
const CANVAS_SIZE = Math.min(screenWidth - 80, 300);
const PATH_PADDING = 40;

interface Point {
  x: number;
  y: number;
}

interface TracingRecorderProps {
  onComplete: (result: {
    accuracy: number;
    delay: number;
    score: number;
  }) => void;
  shape?: "circle" | "figure-eight" | "square";
}

// Shape generators
const getCirclePath = (size: number): Point[] => {
  const center = size / 2;
  const radius = size / 2 - PATH_PADDING;
  const points: Point[] = [];
  for (let i = 0; i <= 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    points.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }
  return points;
};

const getFigureEightPath = (size: number): Point[] => {
  const center = size / 2;
  const radius = size / 3;
  const points: Point[] = [];
  for (let i = 0; i <= 200; i++) {
    const t = (i / 100) * Math.PI * 2;
    points.push({
      x: center + radius * Math.sin(t),
      y: center + radius * Math.sin(t) * Math.cos(t),
    });
  }
  return points;
};

const getSquarePath = (size: number): Point[] => {
  const center = size / 2;
  const halfSize = size / 2 - PATH_PADDING;
  const points: Point[] = [];
  // Top edge
  for (let i = 0; i <= 25; i++)
    points.push({
      x: center - halfSize + (i / 25) * halfSize * 2,
      y: center - halfSize,
    });
  // Right edge
  for (let i = 0; i <= 25; i++)
    points.push({
      x: center + halfSize,
      y: center - halfSize + (i / 25) * halfSize * 2,
    });
  // Bottom edge
  for (let i = 0; i <= 25; i++)
    points.push({
      x: center + halfSize - (i / 25) * halfSize * 2,
      y: center + halfSize,
    });
  // Left edge
  for (let i = 0; i <= 25; i++)
    points.push({
      x: center - halfSize,
      y: center + halfSize - (i / 25) * halfSize * 2,
    });
  return points;
};

export function TracingRecorder({
  onComplete,
  shape = "circle",
}: TracingRecorderProps) {
  const [canvasSize, setCanvasSize] = useState({
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  });
  const [isTracing, setIsTracing] = useState(false);
  const [tracePoints, setTracePoints] = useState<Point[]>([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [delay, setDelay] = useState<number | null>(null);
  const { haptic } = useHaptic();

  const targetPath = useRef<Point[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTraceTimeRef = useRef<number>(0);
  // Ref mirrors isTracing state so the PanResponder (created once) always reads the current value
  const isTracingRef = useRef(false);
  // Ref mirrors tracePoints so stale interval closures can read the latest accumulated points
  const tracePointsRef = useRef<Point[]>([]);

  // Generate target path based on shape
  useEffect(() => {
    const size = canvasSize.width;
    switch (shape) {
      case "circle":
        targetPath.current = getCirclePath(size);
        break;
      case "figure-eight":
        targetPath.current = getFigureEightPath(size);
        break;
      case "square":
        targetPath.current = getSquarePath(size);
        break;
    }
  }, [canvasSize, shape]);

  // Animate the target dot along the path
  const startTracing = () => {
    isTracingRef.current = true;
    tracePointsRef.current = [];
    setIsTracing(true);
    setTracePoints([]);
    setCurrentTargetIndex(0);
    startTimeRef.current = Date.now();
    lastTraceTimeRef.current = Date.now();

    let index = 0;
    animationRef.current = setInterval(() => {
      if (index < targetPath.current.length - 1) {
        index++;
        setCurrentTargetIndex(index);
      } else {
        // Tracing complete
        stopTracing();
      }
    }, 50); // Move every 50ms (20 steps per second)
  };

  const stopTracing = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    isTracingRef.current = false;
    setIsTracing(false);
    calculateScore();
  };

  const calculateScore = () => {
    const points = tracePointsRef.current;
    if (points.length === 0 || targetPath.current.length === 0) {
      setScore(0);
      setAccuracy(0);
      setDelay(0);
      onComplete({ accuracy: 0, delay: 0, score: 0 });
      return;
    }

    // Calculate accuracy: average distance from target path
    let totalDistance = 0;
    let maxDistance = 0;
    const alignmentCount = Math.min(
      points.length,
      targetPath.current.length,
    );

    for (let i = 0; i < alignmentCount; i++) {
      const target = targetPath.current[i];
      const trace = points[i];
      if (target && trace) {
        const distance = Math.sqrt(
          Math.pow(target.x - trace.x, 2) + Math.pow(target.y - trace.y, 2),
        );
        totalDistance += distance;
        if (distance > maxDistance) maxDistance = distance;
      }
    }

    const avgDistance = totalDistance / alignmentCount;
    const maxPossibleDistance = canvasSize.width / 2;
    const accuracyPercent = Math.max(
      0,
      Math.min(100, 100 - (avgDistance / maxPossibleDistance) * 100),
    );
    setAccuracy(Math.round(accuracyPercent));

    // Calculate delay: time difference between target and trace
    const totalDuration = (targetPath.current.length - 1) * 50; // ms
    const traceDuration = lastTraceTimeRef.current - startTimeRef.current;
    const delayMs = Math.max(0, traceDuration - totalDuration);
    setDelay(delayMs);

    // Calculate final score (0-100)
    const delayPenalty = Math.min(50, delayMs / 10);
    const finalScore = Math.max(
      0,
      Math.min(100, accuracyPercent - delayPenalty),
    );
    setScore(Math.round(finalScore));

    haptic("success");
    onComplete({
      accuracy: Math.round(accuracyPercent),
      delay: delayMs,
      score: Math.round(finalScore),
    });
  };

  // PanResponder for tracing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTracingRef.current,
      onMoveShouldSetPanResponder: () => isTracingRef.current,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const newPoint = { x: locationX, y: locationY };
        tracePointsRef.current = [...tracePointsRef.current, newPoint];
        setTracePoints((prev) => [...prev, newPoint]);
        lastTraceTimeRef.current = Date.now();
        haptic("light");
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const newPoint = { x: locationX, y: locationY };
        tracePointsRef.current = [...tracePointsRef.current, newPoint];
        setTracePoints((prev) => [...prev, newPoint]);
        lastTraceTimeRef.current = Date.now();
      },
    }),
  ).current;

  const onCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  // Get score feedback
  const getScoreFeedback = () => {
    if (score === null) return null;
    if (score >= 90)
      return { text: "Excellent tracer!", color: "#2563EB" };
    if (score >= 70) return { text: "Good job!", color: "#F97316" };
    if (score >= 50) return { text: "Keep practicing!", color: "#F59E0B" };
    return { text: "Try again to improve!", color: "#F97316" };
  };

  const feedback = getScoreFeedback();

  // Reset and try again
  const resetTracing = () => {
    tracePointsRef.current = [];
    setTracePoints([]);
    setCurrentTargetIndex(0);
    setScore(null);
    setAccuracy(null);
    setDelay(null);
    isTracingRef.current = false;
    setIsTracing(false);
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  };

  // Build SVG path from trace points
  const getTracePath = () => {
    if (tracePoints.length < 2) return "";
    let path = "";
    tracePoints.forEach((point, i) => {
      if (i === 0) path += `M ${point.x} ${point.y}`;
      else path += ` L ${point.x} ${point.y}`;
    });
    return path;
  };

  // Build SVG path for target (static/faded)
  const getTargetPathString = () => {
    if (targetPath.current.length < 2) return "";
    let path = "";
    targetPath.current.forEach((point, i) => {
      if (i === 0) path += `M ${point.x} ${point.y}`;
      else path += ` L ${point.x} ${point.y}`;
    });
    return path;
  };

  const currentTarget = targetPath.current[currentTargetIndex];

  if (score !== null) {
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={styles.resultTitleRow}>
            <Ionicons name="analytics-outline" size={20} color="#0F172A" />
            <Text style={styles.resultTitle}>Tracing Results</Text>
          </View>
          <View style={styles.resultStats}>
            <View style={styles.resultStat}>
              <Text style={[styles.resultValue, { color: feedback?.color }]}>
                {score}
              </Text>
              <Text style={styles.resultLabel}>Overall Score</Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={styles.resultValue}>{accuracy}%</Text>
              <Text style={styles.resultLabel}>Accuracy</Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={styles.resultValue}>{delay}ms</Text>
              <Text style={styles.resultLabel}>Delay</Text>
            </View>
          </View>
          <Text style={[styles.resultFeedback, { color: feedback?.color }]}>
            {feedback?.text}
          </Text>
          <TouchableOpacity style={styles.retakeButton} onPress={resetTracing}>
            <Text style={styles.retakeButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="pencil-outline" size={20} color="#0F172A" />
          <Text style={styles.title}>Tracing Challenge</Text>
        </View>
        <Text style={styles.subtitle}>
          {isTracing
            ? "Trace the moving green dot!"
            : "Tap Start to trace the shape"}
        </Text>
      </View>

      <View
        style={[
          styles.canvas,
          { width: canvasSize.width, height: canvasSize.height },
        ]}
        onLayout={onCanvasLayout}
        {...panResponder.panHandlers}
      >
        <Svg width={canvasSize.width} height={canvasSize.height}>
          {/* Target path (faded) */}
          <Path
            d={getTargetPathString()}
            stroke="#CBD5E1"
            strokeWidth={2}
            fill="none"
            strokeDasharray="6,6"
          />

          {/* User's trace */}
          <Path
            d={getTracePath()}
            stroke="#F97316"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Moving target dot */}
          {currentTarget && (
            <>
              <Circle
                cx={currentTarget.x}
                cy={currentTarget.y}
                r={14}
                fill="#2563EB"
                opacity={0.3}
              />
              <Circle
                cx={currentTarget.x}
                cy={currentTarget.y}
                r={8}
                fill="#2563EB"
              />
              <Circle
                cx={currentTarget.x}
                cy={currentTarget.y}
                r={3}
                fill="#FFF"
              />
            </>
          )}
        </Svg>

        {!isTracing && tracePoints.length === 0 && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              {shape === "circle" ? "○" : shape === "figure-eight" ? "8" : "□"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {isTracing
            ? "Keep your finger on the green dot as it moves!"
            : "Follow the path exactly where the dot goes"}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.startButton, isTracing && styles.startButtonDisabled]}
        onPress={startTracing}
        disabled={isTracing}
      >
        <Ionicons name="play" size={16} color="#FFF" />
        <Text style={styles.startButtonText}>
          {isTracing ? "Tracing..." : "Start Tracing"}
        </Text>
      </TouchableOpacity>
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
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  canvas: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.8)",
  },
  overlayText: {
    fontSize: 80,
    color: "#E2E8F0",
    fontWeight: "800",
  },
  instructions: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  instructionText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
  },
  startButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  startButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  resultContainer: {
    alignItems: "center",
    width: "100%",
  },
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  resultStat: {
    alignItems: "center",
  },
  resultValue: {
    fontSize: 36,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  resultLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  resultFeedback: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  retakeButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  retakeButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
