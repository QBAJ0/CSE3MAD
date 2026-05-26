// components/recorders/TapReactionGame.tsx
import { ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useHaptic } from "../../hooks/useHaptic";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const { width } = Dimensions.get("window");

interface TapReactionGameProps {
  onComplete: (results: { times: number[]; tooEarly: number }) => void;
  existingTimes?: number[];
  memberName?: string;
  handLabel?: string;
}

type GamePhase = "waiting" | "ready" | "reacted" | "too-early";

export function TapReactionGame({
  onComplete,
  existingTimes,
  handLabel,
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
  const nextTrialRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const trialCountRef = useRef(0);
  const reactionTimesRef = useRef<number[]>(existingTimes || []);
  const tooEarlyCountRef = useRef(0);
  const completedRef = useRef(false);
  const targetScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { haptic } = useHaptic();

  const TOTAL_TRIALS = 5;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (nextTrialRef.current) {
      clearTimeout(nextTrialRef.current);
      nextTrialRef.current = null;
    }
  }, []);

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
  }, [phase, pulseAnim]);

  // Start a new trial
  const startTrial = useCallback(() => {
    if (completedRef.current || trialCountRef.current >= TOTAL_TRIALS) return;

    clearTimers();
    setPhase("waiting");
    setShowTarget(false);
    targetScale.setValue(0);

    // Random delay between 1.5-4.5 seconds
    const delay = 1500 + Math.random() * 3000;

    timeoutRef.current = setTimeout(() => {
      if (completedRef.current) return;
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
  }, [clearTimers, haptic, targetScale]);

  // Start the game
  const startGame = useCallback(() => {
    clearTimers();
    completedRef.current = false;
    trialCountRef.current = 0;
    reactionTimesRef.current = [];
    tooEarlyCountRef.current = 0;
    setReactionTimes([]);
    setTooEarlyCount(0);
    setTrialCount(0);
    setCurrentTime(null);
    setShowTarget(false);
    setPhase("waiting");

    nextTrialRef.current = setTimeout(() => {
      startTrial();
    }, 700);
  }, [clearTimers, startTrial]);

  useEffect(() => {
    if ((existingTimes?.length ?? 0) >= TOTAL_TRIALS) return;
    startGame();
    return clearTimers;
  }, [clearTimers, existingTimes?.length, startGame]);

  // Handle tap on the target
  const handleTap = () => {
    if (completedRef.current) return;

    if (phase === "waiting") {
      // Tapped too early!
      clearTimers();
      haptic("error");
      setPhase("too-early");
      tooEarlyCountRef.current += 1;
      setTooEarlyCount(tooEarlyCountRef.current);

      nextTrialRef.current = setTimeout(() => {
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
      const nextTimes = [...reactionTimesRef.current, reactionTime];
      reactionTimesRef.current = nextTimes;
      trialCountRef.current += 1;
      setReactionTimes(nextTimes);
      setTrialCount(trialCountRef.current);

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
      if (trialCountRef.current >= TOTAL_TRIALS) {
        completedRef.current = true;
        nextTrialRef.current = setTimeout(() => {
          onComplete({
            times: nextTimes,
            tooEarly: tooEarlyCountRef.current,
          });
        }, 500);
      } else {
        // Start next trial after short pause
        nextTrialRef.current = setTimeout(() => {
          startTrial();
        }, 1000);
      }
      return;
    }
  };

  // Get reaction time classification
  const getClassification = (ms: number): { label: string; color: string; icon: IoniconName } => {
    if (ms < 200)
      return { label: "Lightning Fast!", color: "#2563EB", icon: "flash" };
    if (ms < 300) return { label: "Fast!", color: "#F97316", icon: "rocket" };
    if (ms < 450) return { label: "Good", color: "#F59E0B", icon: "thumbs-up" };
    return { label: "Keep Practicing", color: "#F97316", icon: "barbell" };
  };

  // If game is complete, show results
  if (reactionTimes.length >= TOTAL_TRIALS) {
    const avgTime =
      reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const bestTime = Math.min(...reactionTimes);
    const classification = getClassification(avgTime);

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Results</Text>
          <Ionicons name="stats-chart" size={20} color="#2563EB" />
        </View>
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
            <Ionicons name={classification.icon} size={24} color={classification.color} />
            <Text style={[styles.resultLabel, { marginTop: 4 }]}>{classification.label}</Text>
          </View>
        </View>
        {tooEarlyCount > 0 && (
          <View style={styles.tooEarlyNoteContainer}>
            <Ionicons name="warning" size={16} color="#F97316" />
            <Text style={styles.tooEarlyNote}>{tooEarlyCount} premature taps</Text>
          </View>
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
      {handLabel && (
        <View style={styles.handBadge}>
          <Text style={styles.handBadgeText}>{handLabel}</Text>
        </View>
      )}

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
            <View style={styles.targetInner}>
              <Text style={styles.targetText}>TAP</Text>
            </View>
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
                ? "Get Ready..."
                : phase === "too-early"
                  ? "Too Early!"
                  : phase === "reacted"
                    ? "Nice!"
                    : "Ready?"}
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
        {phase === "waiting"
          ? "Wait for the target to appear..."
          : phase === "too-early"
            ? "Wait until the red target appears."
            : phase === "reacted"
              ? "Next trial starting..."
              : "TAP NOW!"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  trialText: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  lastTime: { color: "#2563EB", fontSize: 14, fontWeight: "700" },
  tapArea: {
    width: width - 80,
    height: 300,
    backgroundColor: "#EFF6FF",
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
  targetInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  waitingArea: { alignItems: "center" },
  waitingText: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginTop: 20,
    overflow: "hidden",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2563EB",
    position: "absolute",
  },
  instruction: { color: "#64748B", fontSize: 14, textAlign: "center" },
  resultsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  resultsStats: { flexDirection: "row", gap: 24, marginBottom: 20 },
  resultStat: { alignItems: "center" },
  resultValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563EB",
    fontVariant: ["tabular-nums"],
  },
  resultLabel: { color: "#64748B", fontSize: 12, marginTop: 4 },
  tooEarlyNoteContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  tooEarlyNote: { color: "#F97316", fontSize: 12 },
  retakeButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retakeButtonText: { color: "#FFF", fontWeight: "700" },
  handBadge: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignSelf: "center",
    marginBottom: 12,
  },
  handBadgeText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
});
