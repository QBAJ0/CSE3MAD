// components/recorders/TapReactionGame.tsx
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

const { width } = Dimensions.get("window");

interface TapReactionGameProps {
  onComplete: (results: { times: number[]; tooEarly: number }) => void;
  existingTimes?: number[];
  memberName?: string;
}

type GamePhase = "waiting" | "ready" | "reacted" | "too-early";

export function TapReactionGame({
  onComplete,
  existingTimes,
}: TapReactionGameProps) {
  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [trialCount, setTrialCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>(
    existingTimes || [],
  );
  const [tooEarlyCount, setTooEarlyCount] = useState(0);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [showTarget, setShowTarget] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { haptic } = useHaptic();

  const TOTAL_TRIALS = 5;

  // Animate pulse when ready
  useEffect(() => {
    if (phase === "ready") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase]);

  // Start a new trial
  const startTrial = () => {
    if (trialCount >= TOTAL_TRIALS) return;

    setPhase("waiting");
    setShowTarget(false);
    targetScale.setValue(0);

    // Random delay between 1.5-4.5 seconds
    const delay = 1500 + Math.random() * 3000;

    timeoutRef.current = setTimeout(() => {
      setPhase("ready");
      setShowTarget(true);
      startTimeRef.current = Date.now();
      haptic("light");

      // Animate target appearing
      Animated.spring(targetScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }).start();
    }, delay);
  };

  // Handle tap on the target
  const handleTap = () => {
    if (phase === "waiting") {
      // Tapped too early!
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      haptic("error");
      setPhase("too-early");
      setTooEarlyCount((prev) => prev + 1);

      setTimeout(() => {
        setPhase("waiting");
        startTrial();
      }, 1000);
      return;
    }

    if (phase === "ready") {
      // Valid reaction!
      const reactionTime = Date.now() - startTimeRef.current;
      haptic("success");
      setPhase("reacted");
      setCurrentTime(reactionTime);
      setReactionTimes((prev) => [...prev, reactionTime]);
      setTrialCount((prev) => prev + 1);

      // Animate the tap feedback
      Animated.sequence([
        Animated.timing(targetScale, {
          toValue: 0.8,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(targetScale, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setShowTarget(false);

      // Check if all trials are complete
      if (trialCount + 1 >= TOTAL_TRIALS) {
        setTimeout(() => {
          onComplete({
            times: [...reactionTimes, reactionTime],
            tooEarly: tooEarlyCount,
          });
        }, 500);
      } else {
        // Start next trial after short pause
        setTimeout(() => {
          startTrial();
        }, 1000);
      }
      return;
    }
  };

  // Start the game
  const startGame = () => {
    setReactionTimes([]);
    setTooEarlyCount(0);
    setTrialCount(0);
    setCurrentTime(null);
    startTrial();
  };

  // Get reaction time classification
  const getClassification = (ms: number) => {
    if (ms < 200)
      return { label: "Lightning Fast!", color: "#10B981", emoji: "⚡" };
    if (ms < 300) return { label: "Fast!", color: "#84CC16", emoji: "🚀" };
    if (ms < 450) return { label: "Good", color: "#EAB308", emoji: "👍" };
    return { label: "Keep Practicing", color: "#F97316", emoji: "💪" };
  };

  // If game is complete, show results
  if (reactionTimes.length >= TOTAL_TRIALS) {
    const avgTime =
      reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const bestTime = Math.min(...reactionTimes);
    const classification = getClassification(avgTime);

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>🎯 Results</Text>
        <View style={styles.resultsStats}>
          <View style={styles.resultStat}>
            <Text style={styles.resultValue}>{avgTime.toFixed(0)}</Text>
            <Text style={styles.resultLabel}>Average (ms)</Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={styles.resultValue}>{bestTime}</Text>
            <Text style={styles.resultLabel}>Best (ms)</Text>
          </View>
          <View style={styles.resultStat}>
            <Text style={[styles.resultValue, { color: classification.color }]}>
              {classification.emoji}
            </Text>
            <Text style={styles.resultLabel}>{classification.label}</Text>
          </View>
        </View>
        {tooEarlyCount > 0 && (
          <Text style={styles.tooEarlyNote}>
            ⚠️ {tooEarlyCount} premature taps
          </Text>
        )}
        <TouchableOpacity style={styles.retakeButton} onPress={startGame}>
          <Text style={styles.retakeButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Game UI
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.trialText}>
          Trial {trialCount + 1} of {TOTAL_TRIALS}
        </Text>
        {currentTime !== null && (
          <Text style={styles.lastTime}>Last: {currentTime}ms</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.tapArea}
        onPress={handleTap}
        activeOpacity={0.9}
      >
        {showTarget ? (
          <Animated.View
            style={[
              styles.target,
              {
                transform: [{ scale: targetScale }],
                shadowOpacity: pulseAnim,
                shadowRadius: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [10, 25],
                }),
              },
            ]}
          >
            <Text style={styles.targetText}>⚡ TAP ⚡</Text>
          </Animated.View>
        ) : (
          <View style={styles.waitingArea}>
            <Animated.Text
              style={[
                styles.waitingText,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {phase === "waiting"
                ? "👀 Get Ready..."
                : phase === "too-early"
                  ? "⚠️ Too Early! ⚠️"
                  : "✨ Ready? ✨"}
            </Animated.Text>
            {phase === "waiting" && (
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.instruction}>
        {phase === "waiting" ? "Wait for the target to appear..." : "TAP NOW!"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  trialText: { color: "#94A3B8", fontSize: 14, fontWeight: "600" },
  lastTime: { color: "#22C55E", fontSize: 14, fontWeight: "700" },
  tapArea: {
    width: width - 80,
    height: 300,
    backgroundColor: "#0F172A",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  target: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  targetText: { color: "#FFF", fontSize: 24, fontWeight: "800" },
  waitingArea: { alignItems: "center" },
  waitingText: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: "#334155",
    borderRadius: 2,
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#22C55E",
    position: "absolute",
  },
  instruction: { color: "#64748B", fontSize: 14, textAlign: "center" },
  resultsContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 20,
  },
  resultsStats: { flexDirection: "row", gap: 24, marginBottom: 20 },
  resultStat: { alignItems: "center" },
  resultValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#22C55E",
    fontVariant: ["tabular-nums"],
  },
  resultLabel: { color: "#64748B", fontSize: 12, marginTop: 4 },
  tooEarlyNote: { color: "#F97316", fontSize: 12, marginBottom: 16 },
  retakeButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retakeButtonText: { color: "#FFF", fontWeight: "700" },
});
