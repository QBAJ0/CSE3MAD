import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChallengeTabBar } from "../../../src/components/challenge/ChallengeTabBar";
import { ChallengeTimer } from "../../../src/components/challenge/ChallengeTimer";
import { VideoFrameAnalyzer } from "../../../src/components/challenge/VideoFrameAnalyzer";
import { AccelerometerRecorder } from "../../../src/components/recorders/AccelerometerRecorder";
import { ChoiceRecorder } from "../../../src/components/recorders/ChoiceRecorder";
import { GPSTagger } from "../../../src/components/recorders/GPSTagger";
import { GyroscopeRecorder } from "../../../src/components/recorders/GyroscopeRecorder";
import { NumberRecorder } from "../../../src/components/recorders/NumberRecorder";
import { PhotoRecorder } from "../../../src/components/recorders/PhotoRecorder";
import { SoundMeterRecorder } from "../../../src/components/recorders/SoundMeterRecorder";
import { StopwatchRecorder } from "../../../src/components/recorders/StopwatchRecorder";
import { TeamReactionBoard } from "../../../src/components/recorders/TeamReactionBoard";
import { TextRecorder } from "../../../src/components/recorders/TextRecorder";
import { TracingRecorder } from "../../../src/components/recorders/TracingRecorder";
import { VideoRecorder } from "../../../src/components/recorders/VideoRecorder";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import { useHaptic } from "../../../src/hooks/useHaptic";
// Comment out slow motion import if you don't have vision-camera installed
// import { SlowMotionRecorder } from '../../../src/components/recorders/SlowMotionRecorder';
import { TapReactionGame } from "../../../src/components/recorders/TapReactionGame";

export default function RecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = getChallengeById(Number(id));
  const {
    draft,
    updatePrototype,
    addPrototype,
    setCurrentPrototypeIndex,
    setLocation,
  } = useActivity();
  const { team } = useTeam();
  const { haptic } = useHaptic();
  const [timeExpired, setTimeExpired] = useState(false);

  if (!challenge || !team)
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );

  const current = draft.prototypes[draft.currentPrototypeIndex];

  // Guard: draft not initialised (e.g. page refresh on web resets React state)
  if (!current) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginBottom: 16 }}>
          Session expired. Please restart the challenge.
        </Text>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => router.replace(`/challenge/${challenge.id}`)}
        >
          <Text style={styles.nextText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentNum = draft.currentPrototypeIndex + 1;
  const max = challenge.maxPrototypes;
  const measurements = challenge.measurements.filter(
    (m) => !m.difficulty || m.difficulty === draft.difficulty,
  );

  const saveMeasurement = (key: string, value: string | number) => {
    updatePrototype(current.index, { measurements: { [key]: value } });
  };

  const handleGPSCapture = (lat: number, lng: number) => {
    setLocation(lat, lng);
    saveMeasurement("location", `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // GPS, video, photo and frame-analysis are optional bonuses — don't block completion
  const OPTIONAL_RECORDERS = new Set([
    "gps", "video", "photo", "videoAnalyzer", "slowMotion",
  ]);

  const isComplete = () =>
    measurements
      .filter((m) => !OPTIONAL_RECORDERS.has(m.recorder))
      .every((m) => {
        const val = current.measurements[m.key];
        return val !== undefined && val !== "";
      });

  const handleTimeout = () => {
    haptic("error");
    setTimeExpired(true);
    Alert.alert(
      "⏰ Time's Up!",
      `Your ${challenge.estimatedMinutes}-minute challenge has ended. Points will be reduced by 20%.`,
      [
        {
          text: "Continue",
          onPress: () =>
            router.push(`/challenge/${challenge.id}/results?timeExpired=true`),
        },
      ],
    );
  };

  const handleNext = () => {
    if (!isComplete()) {
      haptic("warning");
      Alert.alert(
        "Incomplete",
        "Please complete all measurements before continuing.",
      );
      return;
    }
    haptic("success");
    if (currentNum < max) {
      addPrototype();
    } else {
      router.push(
        `/challenge/${challenge.id}/results${timeExpired ? "?timeExpired=true" : ""}`,
      );
    }
  };

  const renderRecorder = (measurement: any) => {
    const value = String(current.measurements[measurement.key] || "");
    const onChange = (val: string) => saveMeasurement(measurement.key, val);

    switch (measurement.recorder) {
      case "manualText":
        return (
          <TextRecorder
            measurement={measurement}
            value={value}
            onChange={onChange}
          />
        );
      case "manualNumber":
        return (
          <NumberRecorder
            measurement={measurement}
            value={value}
            onChange={onChange}
          />
        );
      case "manualChoice":
        return (
          <ChoiceRecorder
            measurement={measurement}
            value={value}
            onChange={onChange}
          />
        );
      case "stopwatch":
        return (
          <StopwatchRecorder
            measurement={measurement}
            value={value}
            onChange={onChange}
          />
        );

      case "tracing":
        return (
          <TracingRecorder
            onComplete={(result) =>
              saveMeasurement(measurement.key, JSON.stringify(result))
            }
          />
        );
      case "photo":
        return (
          <PhotoRecorder
            onCapture={(uri) => saveMeasurement(measurement.key, uri)}
            existingUri={value}
            label="Photo"
          />
        );
      case "videoAnalyzer": {
        const videoUri = String(
          current.measurements["slowMotionVideo"] || "",
        );
        return (
          <VideoFrameAnalyzer
            videoUri={videoUri}
            slowMoFactor={4}
            onComplete={(marks) => {
              saveMeasurement(measurement.key, "analyzed");
              saveMeasurement("contactTime", marks.contactTime);
              saveMeasurement("bounced", marks.bounced ? "Yes" : "No");
              if (marks.timeToBouncePeak) {
                saveMeasurement("timeToBouncePeak", marks.timeToBouncePeak);
              }
            }}
          />
        );
      }

      case "teamReaction":
        return (
          <TeamReactionBoard
            onComplete={(results) => {
              saveMeasurement("teamResults", JSON.stringify(results));
            }}
          />
        );
      case "soundMeter":
        return (
          <SoundMeterRecorder
            onCapture={(db) => saveMeasurement(measurement.key, db)}
            existingValue={parseFloat(value)}
          />
        );
      case "accelerometer":
        return (
          <AccelerometerRecorder
            onCapture={(data) => saveMeasurement(measurement.key, data.peak)}
            existingValue={value ? { peak: parseFloat(value), average: 0 } : undefined}
          />
        );
      case "tapReaction":
        return (
          <TapReactionGame
            onComplete={(result) => {
              saveMeasurement(measurement.key, JSON.stringify(result));
            }}
            existingTimes={
              value
                ? (() => {
                    try {
                      return JSON.parse(value).times;
                    } catch {
                      return undefined;
                    }
                  })()
                : undefined
            }
          />
        );
      case "gyroscope":
        return (
          <GyroscopeRecorder
            onCapture={(data) =>
              saveMeasurement(measurement.key, data.smoothness)
            }
          />
        );
      case "gps":
        return (
          <GPSTagger
            onLocationCapture={handleGPSCapture}
            initialLocation={draft.location ?? undefined}
          />
        );
      case "video":
        return (
          <VideoRecorder
            onCapture={(uri) => saveMeasurement(measurement.key, uri)}
            existingUri={value}
          />
        );
      // Comment out slowMotion case until you install vision-camera
      // case "slowMotion":
      //   return <SlowMotionRecorder onCapture={(uri, fps) => saveMeasurement(measurement.key, uri)} existingUri={value} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tab Bar */}
      <ChallengeTabBar
        active="doit"
        onBrief={() => router.back()}
        onDoit={() => {}}
        onReflect={() =>
          router.push(`/challenge/${challenge.id}/results${timeExpired ? "?timeExpired=true" : ""}`)
        }
        doitEnabled={true}
        reflectEnabled={false}
      />

      <ChallengeTimer
        minutes={challenge.estimatedMinutes}
        onTimeout={handleTimeout}
        autoStart={!timeExpired}
      />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          Prototype {currentNum} of {max}
        </Text>
      </View>
      <Text style={styles.title}>Record Your Results</Text>

      {draft.prototypes.length > 1 && (
        <View style={styles.protoRow}>
          {draft.prototypes.map((p, i) => (
            <TouchableOpacity
              key={p.index}
              style={[
                styles.protoChip,
                current.index === p.index && styles.protoActive,
              ]}
              onPress={() => setCurrentPrototypeIndex(i)}
            >
              <Text
                style={[
                  styles.protoText,
                  current.index === p.index && styles.protoActiveText,
                ]}
              >
                #{p.index}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.measureCard}>
        {measurements.map((m) => (
          <View key={m.key} style={styles.field}>
            <Text style={styles.label}>
              {m.label} {m.unit ? `(${m.unit})` : ""}
            </Text>
            {renderRecorder(m)}
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.nextBtn, !isComplete() && styles.nextDisabled]}
        onPress={handleNext}
        disabled={!isComplete()}
      >
        <Text style={styles.nextText}>
          {currentNum < max
            ? `Test Next Design (${currentNum}/${max})`
            : "Go to Reflect →"}
        </Text>
      </Pressable>

      {timeExpired && (
        <View style={styles.penaltyWarning}>
          <Text style={styles.penaltyWarningText}>
            Time expired! 20% point penalty applied.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 20, paddingBottom: 40 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFCCB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: { fontSize: 13, fontWeight: "700", color: "#3F6212" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16 },
  protoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  protoChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  protoActive: { backgroundColor: "#22C55E" },
  protoText: { fontSize: 16, fontWeight: "700", color: "#64748B" },
  protoActiveText: { color: "#FFF" },
  measureCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#334155" },
  nextBtn: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nextDisabled: { backgroundColor: "#CBD5E1" },
  nextText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  penaltyWarning: {
    marginTop: 12,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  penaltyWarningText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },

});
