import { router, useLocalSearchParams } from "expo-router";
import { ReactNode, useState } from "react";
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
import { BreathingRecorder } from "../../../src/components/recorders/BreathingRecorder";
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
import { TapReactionGame } from "../../../src/components/recorders/TapReactionGame";
import { Measurement } from "../../../src/types";
import {
  buildIncompleteSummary,
  getMissingMeasurementLabels,
  getRequiredMeasurements,
  isPrototypeComplete,
} from "../../../src/utils/challengeRecordValidation";

type SaveFn = (key: string, val: string | number) => void;

// Recorders whose props are fully derivable from (measurement, value, save) — no component state needed
const RECORDER_RENDERERS: Partial<Record<
  Measurement["recorder"],
  (m: Measurement, value: string, save: SaveFn) => ReactNode
>> = {
  manualText: (m, v, save) => (
    <TextRecorder measurement={m} value={v} onChange={(val) => save(m.key, val)} />
  ),
  manualNumber: (m, v, save) => (
    <NumberRecorder measurement={m} value={v} onChange={(val) => save(m.key, val)} />
  ),
  manualChoice: (m, v, save) => (
    <ChoiceRecorder measurement={m} value={v} onChange={(val) => save(m.key, val)} />
  ),
  stopwatch: (m, v, save) => (
    <StopwatchRecorder measurement={m} value={v} onChange={(val) => save(m.key, val)} />
  ),
  tracing: (m, _v, save) => (
    <TracingRecorder onComplete={(result) => save(m.key, JSON.stringify(result))} />
  ),
  photo: (m, v, save) => (
    <PhotoRecorder onCapture={(uri) => save(m.key, uri)} existingUri={v} label="Photo" />
  ),
  teamReaction: (_m, _v, save) => (
    <TeamReactionBoard onComplete={(results) => save("teamResults", JSON.stringify(results))} />
  ),
  soundMeter: (m, v, save) => (
    <SoundMeterRecorder onCapture={(db) => save(m.key, db)} existingValue={parseFloat(v)} />
  ),
  accelerometer: (m, v, save) => (
    <AccelerometerRecorder
      onCapture={(data) => save(m.key, data.peak)}
      existingValue={v ? { peak: parseFloat(v), average: 0 } : undefined}
    />
  ),
  breathing: (m, v, save) => (
    <BreathingRecorder
      onCapture={(bpm) => save(m.key, bpm)}
      existingValue={v ? parseFloat(v) : undefined}
    />
  ),
  video: (m, v, save) => (
    <VideoRecorder onCapture={(uri) => save(m.key, uri)} existingUri={v} />
  ),
};

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

  const requiredMeasurements = getRequiredMeasurements(measurements);
  const currentComplete = isPrototypeComplete(current, requiredMeasurements);
  const allPrototypesComplete = draft.prototypes.every((p) =>
    isPrototypeComplete(p, requiredMeasurements),
  );
  const onLastPrototype = currentNum >= max;
  const canProceed = onLastPrototype ? allPrototypesComplete : currentComplete;
  const missingOnCurrent = getMissingMeasurementLabels(
    current,
    requiredMeasurements,
  );
  const incompleteSummary = buildIncompleteSummary(
    draft.prototypes,
    requiredMeasurements,
  );

  const showIncompleteAlert = (title: string) => {
    haptic("warning");
    Alert.alert(title, incompleteSummary);
  };

  const goToReflect = () => {
    router.push(
      `/challenge/${challenge.id}/results${timeExpired ? "?timeExpired=true" : ""}`,
    );
  };

  const handleTimeout = () => {
    haptic("error");
    setTimeExpired(true);
    Alert.alert(
      "Time's Up!",
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
    if (!canProceed) {
      const title = onLastPrototype
        ? "Complete all designs first"
        : "Complete this design first";
      showIncompleteAlert(title);
      return;
    }
    haptic("success");
    if (currentNum < max) {
      addPrototype();
    } else {
      goToReflect();
    }
  };

  const handleSaveDraft = () => {
    haptic("warning");
    Alert.alert(
      "Save draft and exit?",
      "Your current activity data will be kept so you can resume later.",
      [
        { text: "Keep Working", style: "cancel" },
        {
          text: "Save Draft & Exit",
          onPress: () => {
            router.replace("/(tabs)/activity");
          },
        },
      ],
    );
  };

  const renderRecorder = (measurement: Measurement) => {
    const value = String(current.measurements[measurement.key] || "");

    const renderer = RECORDER_RENDERERS[measurement.recorder];
    if (renderer) return renderer(measurement, value, saveMeasurement);

    // Cases that need component-level state (current.measurements, draft.location)
    switch (measurement.recorder) {
      case "videoAnalyzer": {
        const videoUri = String(current.measurements["slowMotionVideo"] || "");
        return (
          <VideoFrameAnalyzer
            videoUri={videoUri}
            slowMoFactor={4}
            onComplete={(marks) => {
              saveMeasurement(measurement.key, "analyzed");
              saveMeasurement("contactTimeSeconds", marks.contactTime);
              saveMeasurement("bounced", marks.bounced ? "Yes" : "No");
              if (marks.timeToBouncePeak) {
                saveMeasurement("timeToBouncePeak", marks.timeToBouncePeak);
              }
            }}
          />
        );
      }
      case "tapReaction":
        return (
          <TapReactionGame
            onComplete={(result) =>
              saveMeasurement(measurement.key, JSON.stringify(result))
            }
            existingTimes={
              value
                ? (() => {
                    try { return JSON.parse(value).times; }
                    catch { return undefined; }
                  })()
                : undefined
            }
          />
        );
      case "gyroscope": {
        const rawPeakRotation = current.measurements[`${measurement.key}PeakRotation`];
        return (
          <GyroscopeRecorder
            onCapture={(data) => {
              saveMeasurement(measurement.key, data.smoothness);
              saveMeasurement(`${measurement.key}PeakRotation`, data.range);
            }}
            existingValue={
              value
                ? {
                    smoothness: parseFloat(value),
                    range:
                      rawPeakRotation !== undefined
                        ? parseFloat(String(rawPeakRotation))
                        : undefined,
                  }
                : undefined
            }
          />
        );
      }
      case "gps":
        return (
          <GPSTagger
            onLocationCapture={handleGPSCapture}
            initialLocation={draft.location ?? undefined}
          />
        );
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
        onReflect={goToReflect}
        onReflectDisabledPress={() =>
          showIncompleteAlert(
            max > 1
              ? "Reflect unlocks when every design is complete"
              : "Complete required measurements first",
          )
        }
        doitEnabled={true}
        reflectEnabled={allPrototypesComplete}
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

      <TouchableOpacity style={styles.exitBtn} onPress={handleSaveDraft}>
        <Text style={styles.exitText}>Save Draft & Exit</Text>
      </TouchableOpacity>

      {max > 1 && (
        <Text style={styles.multiProtoHint}>
          {allPrototypesComplete
            ? `All ${max} designs complete — you can go to Reflect.`
            : `Complete required measurements for each design (${draft.prototypes.length} of ${max} started).`}
        </Text>
      )}

      {draft.prototypes.length > 1 && (
        <View style={styles.protoRow}>
          {draft.prototypes.map((p, i) => {
            const protoDone = isPrototypeComplete(p, requiredMeasurements);
            return (
            <TouchableOpacity
              key={p.index}
              style={[
                styles.protoChip,
                current.index === p.index && styles.protoActive,
                !protoDone && styles.protoIncomplete,
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
            );
          })}
        </View>
      )}

      {!canProceed && missingOnCurrent.length > 0 && (
        <View style={styles.validationHint}>
          <Text style={styles.validationHintTitle}>
            Still needed for Design #{current.index}:
          </Text>
          <Text style={styles.validationHintText}>
            {missingOnCurrent.join(", ")}
          </Text>
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
        style={[styles.nextBtn, !canProceed && styles.nextDisabled]}
        onPress={handleNext}
      >
        <Text style={styles.nextText}>
          {currentNum < max
            ? `Test Next Design (${currentNum}/${max})`
            : "Go to Reflect →"}
        </Text>
        {!canProceed && (
          <Text style={styles.nextHint}>
            {onLastPrototype && max > 1 && !allPrototypesComplete
              ? "Finish every design tab before Reflect"
              : "Complete required fields above"}
          </Text>
        )}
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
    backgroundColor: "#F6D7A8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: { fontSize: 13, fontWeight: "700", color: "#3F6212" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16 },
  exitBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 16,
  },
  exitText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },
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
  protoActive: { backgroundColor: "#2F80ED" },
  protoIncomplete: { borderWidth: 2, borderColor: "#F59E0B" },
  protoText: { fontSize: 16, fontWeight: "700", color: "#64748B" },
  protoActiveText: { color: "#FFF" },
  multiProtoHint: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  validationHint: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  validationHintTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  validationHintText: { fontSize: 13, color: "#78350F" },
  measureCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 8, color: "#334155" },
  nextBtn: {
    backgroundColor: "#2F80ED",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nextDisabled: { backgroundColor: "#CBD5E1" },
  nextText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  nextHint: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  penaltyWarning: {
    marginTop: 12,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  penaltyWarningText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },

});
