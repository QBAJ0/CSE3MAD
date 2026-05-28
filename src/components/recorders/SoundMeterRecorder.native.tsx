// components/recorders/SoundMeterRecorder.native.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
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
import { useHaptic } from "../../hooks/useHaptic";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const NUM_BARS = 13;

const ZONE_TIERS: ReadonlyArray<{
  max: number;
  label: string;
  sublabel: string;
  color: string;
  icon: IoniconName;
  safetyNote: string;
}> = [
  {
    max: 60,
    label: "SAFE ZONE",
    sublabel: "Safe for all-day exposure",
    color: "#2563EB",
    icon: "shield-checkmark",
    safetyNote: "All clear! This sound level is safe for any length of time.",
  },
  {
    max: 85,
    label: "CAUTION ZONE",
    sublabel: "Limit long exposure time",
    color: "#F59E0B",
    icon: "warning-outline",
    safetyNote: "Generally safe, but avoid listening at this level for many hours.",
  },
  {
    max: 100,
    label: "WARNING ZONE",
    sublabel: "Hearing damage possible",
    color: "#F97316",
    icon: "ear-outline",
    safetyNote: "Hearing damage is possible after short exposure. Ear protection recommended.",
  },
  {
    max: Infinity,
    label: "DANGER ZONE",
    sublabel: "Immediate hearing risk",
    color: "#EF4444",
    icon: "alert-circle",
    safetyNote: "Serious risk of immediate hearing damage. Move away or use ear protection!",
  },
];

function getZone(db: number) {
  return ZONE_TIERS.find((t) => db < t.max) ?? ZONE_TIERS[ZONE_TIERS.length - 1];
}

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
  const peakDbRef = useRef(0);
  const isActiveRef = useRef(false);
  const meterAnim = useRef(
    new Animated.Value((existingValue || 0) / 120)
  ).current;
  const waveAnims = useRef<Animated.Value[]>(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0.06))
  ).current;
  const { haptic } = useHaptic();

  useEffect(() => {
    requestPermissions();
    return () => {
      recordingRef.current?.stopAndUnloadAsync();
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
      return;
    }

    haptic("medium");
    setRecording(true);
    setCurrentDb(0);
    setPeakDb(0);
    peakDbRef.current = 0;
    isActiveRef.current = true;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      rec.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording || status.metering === undefined) return;

        const db = Math.max(0, Math.min(120, status.metering + 90));
        setCurrentDb(db);
        if (db > peakDbRef.current) {
          peakDbRef.current = db;
          setPeakDb(db);
        }

        Animated.timing(meterAnim, {
          toValue: db / 120,
          duration: 100,
          useNativeDriver: false,
        }).start();

        // Animate wave bars — centre bars tallest, noise per bar
        const base = db / 120;
        waveAnims.forEach((anim, i) => {
          const envelope = 1 - (Math.abs(i - 6) / 6) * 0.5;
          const noise = Math.random() * 0.28 - 0.14;
          const target = Math.max(0.04, Math.min(1, base * envelope + noise));
          Animated.timing(anim, {
            toValue: target,
            duration: 100,
            useNativeDriver: false,
          }).start();
        });
      });

      await rec.startAsync();
      recordingRef.current = rec;

      setTimeout(() => {
        if (isActiveRef.current) stopRecording();
      }, 10000);
    } catch (e) {
      console.error("Recording failed:", e);
      Alert.alert("Error", "Failed to start scanning. Please try again.");
      setRecording(false);
      isActiveRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    haptic("success");
    isActiveRef.current = false;
    setRecording(false);

    Animated.parallel(
      waveAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 0.06,
          duration: 600,
          useNativeDriver: false,
        })
      )
    ).start();

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;
      if (peakDbRef.current > 0) onCapture(peakDbRef.current);
    } catch (e) {
      console.error("Stop failed:", e);
    }
  };

  const zone = getZone(currentDb);
  const peakZone = getZone(peakDb);

  // ── Permission gate ───────────────────────────────────────────────
  if (!permissionGranted) {
    return (
      <View style={[styles.container, styles.centred]}>
        <Ionicons name="mic-off-outline" size={32} color="#64748B" />
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

  // ── Saved / result state ──────────────────────────────────────────
  if (!recording && existingValue && existingValue > 0) {
    const savedZone = getZone(existingValue);
    return (
      <View style={styles.container}>
        <View style={styles.savedHeader}>
          <Ionicons name="checkmark-circle" size={20} color={savedZone.color} />
          <Text style={[styles.savedHeaderText, { color: savedZone.color }]}>
            Scan Complete
          </Text>
        </View>

        <View style={styles.savedDbRow}>
          <Text style={[styles.dbBig, { color: savedZone.color }]}>
            {existingValue.toFixed(0)}
          </Text>
          <Text style={styles.dbUnitSmall}>dB peak</Text>
        </View>

        <View
          style={[
            styles.zoneBadge,
            {
              backgroundColor: savedZone.color + "15",
              borderColor: savedZone.color + "40",
            },
          ]}
        >
          <Ionicons name={savedZone.icon} size={22} color={savedZone.color} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[styles.zoneBadgeLabel, { color: savedZone.color }]}>
              {savedZone.label}
            </Text>
            <Text style={[styles.zoneBadgeSub, { color: savedZone.color }]}>
              {savedZone.safetyNote}
            </Text>
          </View>
        </View>

        <Text style={styles.earSafetyNote}>
          WHO recommends keeping sound exposure below 85 dB for 8 hrs/day.
          Repeated loud noise can permanently damage hearing.
        </Text>

        <TouchableOpacity
          style={styles.remeasureButton}
          onPress={() => onCapture(0)}
        >
          <Text style={styles.remeasureButtonText}>Remeasure</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Active / idle scanner ─────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="scan-outline" size={17} color="#2563EB" />
          <Text style={styles.headerTitle}>SOUND SCANNER</Text>
        </View>
        {recording && (
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <Text style={styles.positionHint}>Hold phone 30 cm from sound source</Text>

      {/* ── Waveform ── */}
      <View style={styles.waveContainer}>
        {waveAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.waveBar,
              {
                height: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, 56],
                }),
                backgroundColor: recording ? zone.color : "#CBD5E1",
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 1],
                }),
              },
            ]}
          />
        ))}
      </View>

      {/* ── dB readout ── */}
      <View style={styles.readoutRow}>
        <Text
          style={[
            styles.dbBig,
            { color: recording ? zone.color : "#94A3B8" },
          ]}
        >
          {recording ? currentDb.toFixed(0) : "—"}
        </Text>
        <Text
          style={[styles.dbUnit, { color: recording ? zone.color : "#94A3B8" }]}
        >
          dB
        </Text>
      </View>

      {/* Live zone badge */}
      {recording && (
        <View
          style={[
            styles.zoneLiveBadge,
            { backgroundColor: zone.color + "18" },
          ]}
        >
          <Ionicons name={zone.icon} size={14} color={zone.color} />
          <Text style={[styles.zoneLiveLabel, { color: zone.color }]}>
            {zone.label}
          </Text>
        </View>
      )}

      {/* ── Zone scale bar ── */}
      <View style={{ marginTop: 4 }}>
        <View style={{ position: "relative" }}>
          <View style={styles.scaleBar}>
            <View style={[styles.scaleSeg, { flex: 5, backgroundColor: "#2563EB" }]} />
            <View style={[styles.scaleSeg, { flex: 2.1, backgroundColor: "#F59E0B" }]} />
            <View style={[styles.scaleSeg, { flex: 1.3, backgroundColor: "#F97316" }]} />
            <View style={[styles.scaleSeg, { flex: 1.6, backgroundColor: "#EF4444" }]} />
          </View>
          <Animated.View
            style={[
              styles.scaleMarker,
              {
                left: meterAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "92%"],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabelText}>0</Text>
          <Text style={styles.scaleLabelText}>60</Text>
          <Text style={styles.scaleLabelText}>85</Text>
          <Text style={styles.scaleLabelText}>100</Text>
          <Text style={styles.scaleLabelText}>120 dB</Text>
        </View>
      </View>

      {/* Peak reading */}
      {peakDb > 0 && (
        <View style={styles.peakRow}>
          <Text style={styles.peakLabel}>Peak:</Text>
          <Text style={[styles.peakValue, { color: peakZone.color }]}>
            {peakDb.toFixed(0)} dB
          </Text>
          <Ionicons name={peakZone.icon} size={15} color={peakZone.color} />
          <Text style={[styles.peakZoneLabel, { color: peakZone.color }]}>
            {peakZone.label}
          </Text>
        </View>
      )}

      {/* Start / Stop */}
      <TouchableOpacity
        style={[styles.scanButton, recording && styles.scanButtonActive]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Ionicons
          name={recording ? "stop-circle" : "mic"}
          size={20}
          color="#FFF"
        />
        <Text style={styles.scanButtonText}>
          {recording ? "Stop & Save" : "Start Scanning"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {recording
          ? "Recording… auto-stops after 10 seconds"
          : "Tap to start — hold phone near the sound source"}
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
    padding: 18,
    gap: 12,
  },
  centred: { alignItems: "center" },

  // Permission
  permissionText: {
    color: "#0F172A",
    textAlign: "center",
    fontSize: 14,
    marginTop: 6,
  },
  permissionButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "stretch",
  },
  permissionButtonText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 1.8,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#EF4444",
    letterSpacing: 1.2,
  },

  positionHint: { fontSize: 12, color: "#64748B", textAlign: "center" },

  // Waveform
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    gap: 3,
  },
  waveBar: { width: 5, borderRadius: 3 },

  // dB readout
  readoutRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
  },
  dbBig: {
    fontSize: 72,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    lineHeight: 80,
  },
  dbUnit: { fontSize: 22, fontWeight: "700" },
  dbUnitSmall: { fontSize: 16, color: "#64748B", fontWeight: "600" },

  // Live zone badge
  zoneLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  zoneLiveLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },

  // Zone scale
  scaleBar: {
    flexDirection: "row",
    height: 10,
    borderRadius: 6,
    overflow: "hidden",
  },
  scaleSeg: { height: "100%" },
  scaleMarker: {
    position: "absolute",
    top: -5,
    width: 16,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#0F172A",
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  scaleLabelText: { fontSize: 10, color: "#94A3B8", fontWeight: "500" },

  // Peak
  peakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
  },
  peakLabel: { fontSize: 13, color: "#64748B" },
  peakValue: { fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
  peakZoneLabel: { fontSize: 12, fontWeight: "600" },

  // Scan button
  scanButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  scanButtonActive: { backgroundColor: "#EF4444" },
  scanButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  hint: { fontSize: 12, color: "#94A3B8", textAlign: "center" },

  // Saved state
  savedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  savedHeaderText: { fontSize: 14, fontWeight: "700" },
  savedDbRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
  },
  zoneBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  zoneBadgeLabel: { fontSize: 15, fontWeight: "800" },
  zoneBadgeSub: { fontSize: 12, opacity: 0.85, lineHeight: 17 },
  earSafetyNote: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    textAlign: "center",
  },
  remeasureButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  remeasureButtonText: { color: "#0F172A", fontWeight: "700", fontSize: 14 },
});
