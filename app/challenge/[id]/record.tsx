import { router, useLocalSearchParams } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { HumanPerformanceMovementDiagram } from "../../../src/components/challenge/HumanPerformanceMovementDiagram";
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
import {
  HumanPerformanceRecorder,
  HumanPerformanceRecorderWeb,
} from "../../../src/components/recorders/HumanPerformanceRecorder";
import { StopwatchRecorder } from "../../../src/components/recorders/StopwatchRecorder";
import { TeamReactionBoard } from "../../../src/components/recorders/TeamReactionBoard";
import { TextRecorder } from "../../../src/components/recorders/TextRecorder";
import { TracingRecorder } from "../../../src/components/recorders/TracingRecorder";
import { VideoRecorder } from "../../../src/components/recorders/VideoRecorder";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import {
  getTrialForPrototype,
  getTrialLabelForPrototype,
} from "../../../src/data/humanPerformanceTrials";
import { useHaptic } from "../../../src/hooks/useHaptic";
import { TapReactionGame } from "../../../src/components/recorders/TapReactionGame";
import { Measurement } from "../../../src/types";
import {
  buildIncompleteSummary,
  getMissingMeasurementLabels,
  getRecordMeasurements,
  getRequiredMeasurements,
  isPrototypeComplete,
} from "../../../src/utils/challengeRecordValidation";
import {
  HUMAN_PERFORMANCE_CHALLENGE_ID,
  buildHumanPerformanceFields,
} from "../../../src/utils/humanPerformance";

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
      vibrateMode={!!m.vibrate}
    />
  ),
  breathing: (m, v, save) => (
    <BreathingRecorder
      onCapture={(bpm) => save(m.key, bpm)}
      existingValue={v ? parseFloat(v) : undefined}
    />
  ),
  gyroscope: (m, _v, save) => (
    <GyroscopeRecorder
      onCapture={(data) => {
        save(m.key, data.smoothness);
        save("smoothnessScore", data.smoothness);
      }}
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
          Session expired. Restart this challenge to keep going.
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
  const measurements = getRecordMeasurements(
    challenge.id,
    challenge.measurements.filter(
      (m) => !m.difficulty || m.difficulty === draft.difficulty,
    ),
  );
  const isHumanPerformance = challenge.id === HUMAN_PERFORMANCE_CHALLENGE_ID;

  const saveMeasurement = (key: string, value: string | number) => {
    updatePrototype(current.index, { measurements: { [key]: value } });
  };

  const saveMeasurements = (patch: Record<string, string | number>) => {
    updatePrototype(current.index, { measurements: patch });
  };

  const clearHumanPerformanceSession = () => {
    saveMeasurements({
      durationSeconds: "",
      timeSeconds: "",
      movementUnits: "",
      vibrationData: "",
      vibrationLabel: "",
      outcomeText: "",
      smoothness: "",
      smoothnessScore: "",
    });
  };

  const handleHumanPerformanceSession = (session: {
    durationSeconds: number;
    movementUnits: number;
    peakG: number;
    totalMagnitudeSum: number;
    smoothnessScore: number;
  }) => {
    const fields = buildHumanPerformanceFields({
      durationSeconds: session.durationSeconds,
      totalMagnitudeSum: session.totalMagnitudeSum,
      peakG: session.peakG,
      smoothnessScore: session.smoothnessScore,
    });
    saveMeasurements(fields);
  };

  const handleGPSCapture = (lat: number, lng: number) => {
    setLocation(lat, lng);
    saveMeasurement("location", `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const requiredMeasurements = getRequiredMeasurements(measurements);
  const currentComplete = isPrototypeComplete(
    current,
    requiredMeasurements,
    challenge.id,
  );
  const allPrototypesComplete = draft.prototypes.every((p) =>
    isPrototypeComplete(p, requiredMeasurements, challenge.id),
  );
  const onLastPrototype = currentNum >= max;
  const canProceed = onLastPrototype ? allPrototypesComplete : currentComplete;
  const missingOnCurrent = getMissingMeasurementLabels(
    current,
    requiredMeasurements,
    challenge.id,
  );
  const incompleteSummary = buildIncompleteSummary(
    draft.prototypes,
    requiredMeasurements,
    challenge.id,
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
        ? isHumanPerformance
          ? "Complete all movements first"
          : "Complete all designs first"
        : isHumanPerformance
          ? "Complete this movement first"
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

  useEffect(() => {
    if (!isHumanPerformance || !current) return;
    const trial = getTrialForPrototype(current.index);
    if (
      trial &&
      String(current.measurements.movementType ?? "") !== trial.movementType
    ) {
      updatePrototype(current.index, {
        measurements: { movementType: trial.movementType },
      });
    }
  }, [isHumanPerformance, current.index, draft.currentPrototypeIndex]);

  const handleSaveDraft = () => {
    haptic("warning");
    Alert.alert(
      "Save draft and exit?",
      "Your work will be kept so you can resume later.",
      [
        { text: "Keep Working", style: "cancel" },
        {
          text: "Save and exit",
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
                saveMeasurement("timeToMaxHeightSeconds", marks.timeToBouncePeak);
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
          Step 2: Test {currentNum} of {max}
        </Text>
      </View>
      <Text style={styles.title}>Record results</Text>
      <Text style={styles.helperText}>
        Fill the required fields. Photos, videos, and GPS add evidence XP.
      </Text>

      <TouchableOpacity style={styles.exitBtn} onPress={handleSaveDraft}>
        <Text style={styles.exitText}>Save and exit</Text>
      </TouchableOpacity>

      {max > 1 && (
        <Text style={styles.multiProtoHint}>
          {allPrototypesComplete
            ? `All ${max} ${isHumanPerformance ? "movements" : "designs"} complete — you can go to Reflect.`
            : `Complete required measurements for each ${isHumanPerformance ? "movement" : "design"} (${draft.prototypes.length} of ${max} started).`}
        </Text>
      )}

      {isHumanPerformance && (
        <HumanPerformanceMovementDiagram prototypeIndex={current.index} />
      )}

      {draft.prototypes.length > 1 && (
        <View style={styles.protoRow}>
          {draft.prototypes.map((p, i) => {
            const protoDone = isPrototypeComplete(
              p,
              requiredMeasurements,
              challenge.id,
            );
            const chipLabel = isHumanPerformance
              ? getTrialLabelForPrototype(p.index)
              : `#${p.index}`;
            return (
              <TouchableOpacity
                key={p.index}
                style={[
                  styles.protoChip,
                  isHumanPerformance && styles.protoChipWide,
                  current.index === p.index && styles.protoActive,
                  !protoDone && styles.protoIncomplete,
                ]}
                onPress={() => setCurrentPrototypeIndex(i)}
              >
                <Text
                  style={[
                    styles.protoText,
                    isHumanPerformance && styles.protoTextSmall,
                    current.index === p.index && styles.protoActiveText,
                  ]}
                  numberOfLines={2}
                >
                  {chipLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!canProceed && missingOnCurrent.length > 0 && (
        <View style={styles.validationHint}>
          <Text style={styles.validationHintTitle}>
            Still needed for{" "}
            {isHumanPerformance
              ? getTrialLabelForPrototype(current.index)
              : `Design #${current.index}`}
            :
          </Text>
          <Text style={styles.validationHintText}>
            {missingOnCurrent.join(", ")}
          </Text>
        </View>
      )}

      {isHumanPerformance && (
        <View style={styles.measureCard}>
          <View style={styles.hpBlock}>
            <Text style={styles.sectionLabel}>Predict this attempt</Text>
            <TextInput
              style={styles.hpInput}
              placeholder={`e.g. ${getTrialForPrototype(current.index)?.movementType ?? "this movement"} will score highest`}
              placeholderTextColor="#94A3B8"
              value={String(
                current.measurements.predictedMovementText ?? "",
              )}
              onChangeText={(text) =>
                saveMeasurement("predictedMovementText", text)
              }
              multiline
            />
            <Text style={styles.optionalHint}>
              Optional: predicted movement units
            </Text>
            <TextInput
              style={styles.hpInput}
              placeholder="e.g. 7.5"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={String(
                current.measurements.predictedMovementUnits ?? "",
              )}
              onChangeText={(text) =>
                saveMeasurement("predictedMovementUnits", text)
              }
            />

            <Text style={styles.sectionLabel}>Movement session</Text>
            <Text style={styles.hpSessionHint}>
              One button starts timer, movement units, vibration, and
              smoothness together.
            </Text>
            {Platform.OS === "web" ? (
              <HumanPerformanceRecorderWeb
                onComplete={handleHumanPerformanceSession}
                onReset={clearHumanPerformanceSession}
                existing={{
                  durationSeconds: parseFloat(
                    String(current.measurements.durationSeconds ?? ""),
                  ),
                  movementUnits: parseFloat(
                    String(current.measurements.movementUnits ?? ""),
                  ),
                  smoothnessScore: parseFloat(
                    String(
                      current.measurements.smoothnessScore ??
                        current.measurements.smoothness ??
                        "",
                    ),
                  ),
                  outcomeText: String(
                    current.measurements.outcomeText ?? "",
                  ),
                }}
              />
            ) : (
              <HumanPerformanceRecorder
                onComplete={handleHumanPerformanceSession}
                onReset={clearHumanPerformanceSession}
                existing={{
                  durationSeconds: parseFloat(
                    String(current.measurements.durationSeconds ?? ""),
                  ),
                  movementUnits: parseFloat(
                    String(current.measurements.movementUnits ?? ""),
                  ),
                  smoothnessScore: parseFloat(
                    String(
                      current.measurements.smoothnessScore ??
                        current.measurements.smoothness ??
                        "",
                    ),
                  ),
                  outcomeText: String(
                    current.measurements.outcomeText ?? "",
                  ),
                }}
              />
            )}
          </View>
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
            : "Reflect"}
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
            Time expired. A 20% XP penalty applies.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  content: { padding: 20, paddingBottom: 40 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FED7AA",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: { fontSize: 13, fontWeight: "800", color: "#0F766E" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
    color: "#0F766E",
  },
  helperText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 14,
  },
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
    minWidth: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    justifyContent: "center",
  },
  protoChipWide: {
    width: undefined,
    flex: 1,
    minHeight: 44,
    height: undefined,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  protoActive: { backgroundColor: "#2F80ED" },
  protoIncomplete: { borderWidth: 2, borderColor: "#F59E0B" },
  protoText: { fontSize: 16, fontWeight: "700", color: "#64748B" },
  protoTextSmall: { fontSize: 11, textAlign: "center" },
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
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F766E",
    marginBottom: 8,
    marginTop: 4,
  },
  hpInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
  optionalHint: { fontSize: 12, color: "#64748B", marginBottom: 6 },
  hpSessionHint: { fontSize: 12, color: "#64748B", marginBottom: 10 },
  hpBlock: {
    marginBottom: 20,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  measureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  field: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    color: "#0F766E",
  },
  nextBtn: {
    backgroundColor: "#F97316",
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
