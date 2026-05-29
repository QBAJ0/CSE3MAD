import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import { useTheme } from "../../theme/themeContext";
import type { ColorTokens } from "../../theme/colors";

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  const [isActive, setIsActive] = useState(autoStart);
  const [isWarning, setIsWarning] = useState(false);
  const { haptic } = useHaptic();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warned60Ref = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handleTimeout = useCallback(() => {
    setIsActive(false);
    haptic("error");
    Alert.alert(
      "Time's Up!",
      `Your ${minutes}-minute challenge time has ended.`,
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
  }, [minutes, onTimeout, haptic]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        const newTime = prev - 1;
        onTimeUpdate?.(newTime);
        if (newTime <= 60 && newTime > 0 && !warned60Ref.current) {
          warned60Ref.current = true;
          setIsWarning(true);
          haptic("warning");
        }
        if (newTime === 30) {
          haptic("heavy");
        }
        if (newTime === 0) {
          handleTimeout();
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [handleTimeout, haptic, isActive, onTimeUpdate]);

  useEffect(() => {
    if (isWarning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
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
    return colors.info;
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
          <Ionicons name="timer-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.timerLabel}>Challenge Timer</Text>
        </View>
        <TouchableOpacity onPress={toggleTimer} style={styles.timerControl}>
          <Ionicons name={isActive ? "pause" : "play"} size={20} color={colors.text} />
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
            { width: `${getProgressPercentage()}%`, backgroundColor: getTimerColor() },
          ]}
        />
      </View>
    </Animated.View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.borderFaint,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    warningContainer: {
      backgroundColor: c.dangerLight,
      borderColor: c.danger,
      borderWidth: 1.5,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
    timerLabel: { fontSize: 12, fontWeight: "600", color: c.textSecondary },
    timerControl: { padding: 4 },
    timerCircle: { alignItems: "center", marginVertical: 4 },
    timerText: {
      fontSize: 34,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      marginBottom: 2,
    },
    timerMessage: { fontSize: 11, color: c.textSecondary },
    progressBarContainer: {
      width: "100%",
      height: 6,
      backgroundColor: c.border,
      borderRadius: 3,
      overflow: "hidden",
      marginTop: 6,
    },
    progressBar: { height: "100%", borderRadius: 3 },
  });
}
