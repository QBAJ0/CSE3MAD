import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

interface ChallengeTimerProps {
  minutes: number;
  onTimeout: () => void;
  onTimeUpdate?: (timeLeft: number) => void;
  autoStart?: boolean;
}

export function ChallengeTimer({
  minutes,
  onTimeout,
  onTimeUpdate,
  autoStart = true,
}: ChallengeTimerProps) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  const [isActive, setIsActive] = useState(autoStart);
  const [isWarning, setIsWarning] = useState(false);
  const { haptic } = useHaptic();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handleTimeout = useCallback(() => {
    setIsActive(false);
    Vibration.vibrate([1000, 500, 1000, 500, 1000]);
    Alert.alert(
      "Time's Up!",
      `Your ${minutes}-minute challenge has ended.\n\nPoints will be reduced by 20%.`,
      [
        { text: "Submit Results", onPress: onTimeout, style: "default" },
        {
          text: "Continue (Penalty Applied)",
          onPress: () => {
            setIsActive(true);
            onTimeout();
          },
          style: "cancel",
        },
      ],
    );
  }, [minutes, onTimeout]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          onTimeUpdate?.(newTime);
          if (newTime <= 60 && newTime > 0 && !isWarning) {
            setIsWarning(true);
            haptic("warning");
            Vibration.vibrate(500);
          }
          if (newTime === 30) {
            haptic("heavy");
            Vibration.vibrate([500, 200, 500]);
          }
          if (newTime === 0) {
            clearInterval(intervalRef.current!);
            haptic("error");
            handleTimeout();
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleTimeout, haptic, isActive, isWarning, onTimeUpdate, timeLeft]);

  useEffect(() => {
    if (isWarning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isWarning, pulseAnim]);

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => (timeLeft / (minutes * 60)) * 100;
  const getTimerColor = () => {
    if (timeLeft <= 30) return "#EF4444";
    if (timeLeft <= 60) return "#F97316";
    if (timeLeft <= 120) return "#FBBF24";
    return "#2563EB";
  };

  const toggleTimer = () => {
    haptic("light");
    setIsActive(!isActive);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isWarning && styles.warningContainer,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="timer-outline" size={20} color="#64748B" />
          <Text style={styles.timerLabel}>Challenge Timer</Text>
        </View>
        <TouchableOpacity onPress={toggleTimer} style={styles.timerControl}>
          <Ionicons
            name={isActive ? "pause" : "play"}
            size={20}
            color="#0F172A"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.timerCircle}>
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime()}
        </Text>
        <Text style={styles.timerMessage}>
          {timeLeft <= 60
            ? "Hurry! Time running out!"
            : "Take your time, but watch the clock!"}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${getProgressPercentage()}%`,
              backgroundColor: getTimerColor(),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  warningContainer: {
    backgroundColor: "#FEF2F2",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  timerLabel: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  timerControl: { padding: 8 },
  timerCircle: { alignItems: "center", marginVertical: 12 },
  timerText: {
    fontSize: 52,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginBottom: 4,
  },
  timerMessage: { fontSize: 12, color: "#64748B" },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 4 },
});
