// components/recorders/GyroscopeRecorder.tsx
import { Gyroscope } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

interface GyroscopeRecorderProps {
  onCapture: (data: { smoothness: number; range: number }) => void;
  duration?: number;
}

export function GyroscopeRecorder({
  onCapture,
  duration = 5,
}: GyroscopeRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [currentValues, setCurrentValues] = useState({ x: 0, y: 0, z: 0 });
  const [smoothness, setSmoothness] = useState(0);
  const { haptic } = useHaptic();
  const subscriptionRef = useRef<any>(null);
  const velocityChangesRef = useRef<number[]>([]);

  useEffect(() => {
    requestPermissions();
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Gyroscope.requestPermissionsAsync();
    setPermissionGranted(status === "granted");
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      if (!permissionGranted) return;
    }

    haptic("medium");
    setRecording(true);
    velocityChangesRef.current = [];

    Gyroscope.setUpdateInterval(50);
    let lastValues = { x: 0, y: 0, z: 0 };

    subscriptionRef.current = Gyroscope.addListener((data) => {
      setCurrentValues(data);

      // Calculate change in rotation velocity (jerk)
      const deltaX = Math.abs(data.x - lastValues.x);
      const deltaY = Math.abs(data.y - lastValues.y);
      const deltaZ = Math.abs(data.z - lastValues.z);
      const totalChange = deltaX + deltaY + deltaZ;
      velocityChangesRef.current.push(totalChange);

      lastValues = data;
    });

    setTimeout(() => stopRecording(), duration * 1000);
  };

  const stopRecording = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    // Calculate smoothness (lower change = smoother movement)
    const avgChange =
      velocityChangesRef.current.reduce((a, b) => a + b, 0) /
      velocityChangesRef.current.length;
    const smoothnessScore = Math.max(0, Math.min(100, 100 - avgChange * 100));

    // Calculate range of motion (max - min of any axis)
    setSmoothness(smoothnessScore);

    haptic("success");
    setRecording(false);

    onCapture({ smoothness: smoothnessScore, range: 0 });
  };

  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>🔄 Gyroscope access required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.valuesContainer}>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Rotation X</Text>
          <Text style={styles.valueText}>{currentValues.x.toFixed(2)}</Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Rotation Y</Text>
          <Text style={styles.valueText}>{currentValues.y.toFixed(2)}</Text>
        </View>
        <View style={styles.valueItem}>
          <Text style={styles.valueLabel}>Rotation Z</Text>
          <Text style={styles.valueText}>{currentValues.z.toFixed(2)}</Text>
        </View>
      </View>

      {smoothness > 0 && !recording && (
        <View style={styles.smoothnessContainer}>
          <Text style={styles.smoothnessLabel}>Movement Smoothness</Text>
          <View style={styles.smoothnessBar}>
            <View
              style={[
                styles.smoothnessFill,
                {
                  width: `${smoothness}%`,
                  backgroundColor:
                    smoothness > 70
                      ? "#2F80ED"
                      : smoothness > 40
                        ? "#F6B84A"
                        : "#EF4444",
                },
              ]}
            />
          </View>
          <Text style={styles.smoothnessValue}>
            {smoothness.toFixed(0)}/100
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.recordButton, recording && styles.recordButtonActive]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.recordButtonText}>
          {recording ? "⏹️ Stop" : "🔄 Start Movement Test"}
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
    marginBottom: 20,
  },
  valueItem: { alignItems: "center" },
  valueLabel: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  valueText: { color: "#12343B", fontSize: 16, fontWeight: "700" },
  smoothnessContainer: { marginBottom: 20, alignItems: "center" },
  smoothnessLabel: { color: "#64748B", fontSize: 12, marginBottom: 8 },
  smoothnessBar: {
    width: "100%",
    height: 20,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    overflow: "hidden",
  },
  smoothnessFill: { height: "100%", borderRadius: 10 },
  smoothnessValue: {
    color: "#12343B",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  recordButton: {
    backgroundColor: "#2F80ED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  recordButtonActive: { backgroundColor: "#EF4444" },
  recordButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
