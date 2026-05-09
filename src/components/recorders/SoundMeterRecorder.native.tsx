// components/recorders/SoundMeterRecorder.tsx
import { Audio } from "expo-av";
import { ComponentProps, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useHaptic } from "../../hooks/useHaptic";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface SoundMeterRecorderProps {
  onCapture: (db: number) => void;
  existingValue?: number;
}

export function SoundMeterRecorder({
  onCapture,
  existingValue,
}: SoundMeterRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [currentDb, setCurrentDb] = useState(existingValue || 0);
  const [peakDb, setPeakDb] = useState(existingValue || 0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meterAnim = useRef(new Animated.Value(0)).current;
  const { haptic } = useHaptic();

  useEffect(() => {
    requestPermissions();
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setPermissionGranted(status === "granted");
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Microphone access is required to measure sound levels.",
      );
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      if (!permissionGranted) return;
    }

    haptic("medium");
    setRecording(true);
    setPeakDb(0);
    setCurrentDb(0);

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // Convert dBFS to approximate dB SPL
          // dBFS ranges from -160 to 0, add 90 for approximate SPL
          const dbSPL = Math.max(0, Math.min(120, status.metering + 90));
          setCurrentDb(dbSPL);
          if (dbSPL > peakDb) setPeakDb(dbSPL);

          // Animate meter
          Animated.timing(meterAnim, {
            toValue: dbSPL / 120,
            duration: 100,
            useNativeDriver: false,
          }).start();
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (recordingRef.current && recording) {
          stopRecording();
        }
      }, 10000);
    } catch (error) {
      console.error("Recording failed:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    haptic("success");
    setRecording(false);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      recordingRef.current = null;

      if (peakDb > 0) {
        onCapture(peakDb);
      }
    } catch (error) {
      console.error("Stop failed:", error);
    }
  };

  const getRiskLevel = (db: number): { label: string; color: string; icon: IoniconName } => {
    if (db < 40)
      return { label: "Quiet", color: "#10B981", icon: "volume-mute" };
    if (db < 60)
      return { label: "Conversation", color: "#84CC16", icon: "people" };
    if (db < 75)
      return { label: "Busy", color: "#EAB308", icon: "megaphone" };
    if (db < 90) return { label: "Loud", color: "#F97316", icon: "warning" };
    if (db < 110)
      return { label: "Very Loud", color: "#EF4444", icon: "volume-high" };
    return { label: "Dangerous", color: "#DC2626", icon: "alert-circle" };
  };

  const risk = getRiskLevel(currentDb);
  const peakRisk = getRiskLevel(peakDb);

  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Microphone access required</Text>
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
      {!recording && existingValue ? (
        <View style={styles.savedContainer}>
          <Text style={styles.savedText}>Measured: {existingValue} dB</Text>
          <View
            style={[
              styles.savedBadge,
              { backgroundColor: getRiskLevel(existingValue).color + "20" },
            ]}
          >
            <View style={styles.riskInfoRow}>
              <Ionicons
                name={getRiskLevel(existingValue).icon}
                size={16}
                color={getRiskLevel(existingValue).color}
              />
              <Text
                style={[
                  styles.savedBadgeText,
                  { color: getRiskLevel(existingValue).color },
                ]}
              >
                {getRiskLevel(existingValue).label}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => onCapture(0)}
          >
            <Text style={styles.retakeButtonText}>Remeasure</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Live Meter Display */}
          <View style={styles.meterContainer}>
            <View style={styles.meterBackground}>
              <Animated.View
                style={[
                  styles.meterFill,
                  {
                    width: meterAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: risk.color,
                  },
                ]}
              />
            </View>

            {/* Decibel Labels */}
            <View style={styles.dbLabels}>
              <Text style={styles.dbLabel}>0</Text>
              <Text style={styles.dbLabel}>40</Text>
              <Text style={styles.dbLabel}>60</Text>
              <Text style={styles.dbLabel}>80</Text>
              <Text style={styles.dbLabel}>100</Text>
              <Text style={styles.dbLabel}>120</Text>
            </View>
          </View>

          {/* Current Reading */}
          <View style={styles.readingContainer}>
            <Text style={[styles.currentDb, { color: risk.color }]}>
              {currentDb.toFixed(0)}
            </Text>
            <Text style={styles.dbUnit}>dB</Text>
            <View style={styles.riskInfoRow}>
              <Ionicons name={risk.icon} size={16} color={risk.color} />
              <Text style={[styles.riskLabel, { color: risk.color }]}> {risk.label}</Text>
            </View>

            <Text style={styles.peakLabel}>Peak:</Text>
            <Text style={[styles.peakValue, { color: peakRisk.color }]}> 
              {peakDb.toFixed(0)} dB
            </Text>
            <Ionicons name={peakRisk.icon} size={18} color={peakRisk.color} />
          </View>

          <TouchableOpacity
            style={[
              styles.recordButton,
              recording && styles.recordButtonActive,
            ]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Text style={styles.recordButtonText}>
              {recording ? "Stop & Save" : "Start Measuring"}
            </Text>
          </TouchableOpacity>

          {/* Info Text */}
          <Text style={styles.infoText}>
            {recording
              ? "Recording... Hold phone near sound source"
              : "Tap to measure sound level (max 10 seconds)"}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  permissionText: {
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: "#22C55E",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  meterContainer: {
    marginBottom: 20,
  },
  meterBackground: {
    height: 40,
    backgroundColor: "#334155",
    borderRadius: 20,
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    borderRadius: 20,
  },
  dbLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  dbLabel: {
    color: "#64748B",
    fontSize: 10,
  },
  readingContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  currentDb: {
    fontSize: 64,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  dbUnit: {
    fontSize: 20,
    color: "#94A3B8",
    fontWeight: "600",
  },
  riskInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  peakContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#0F172A",
    borderRadius: 12,
  },
  peakLabel: {
    color: "#94A3B8",
    fontSize: 14,
  },
  peakValue: {
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  peakEmoji: {
    fontSize: 20,
  },
  recordButton: {
    backgroundColor: "#22C55E",
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
  infoText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
  },
  savedContainer: {
    alignItems: "center",
    gap: 12,
  },
  savedText: {
    color: "#22C55E",
    fontSize: 24,
    fontWeight: "700",
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
