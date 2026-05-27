// app/challenge/[id]/record.tsx
// "Do It" tab — measurement recording screen.
// All business logic lives here; all layout is delegated to ChallengeScreenShell.

import { router, useLocalSearchParams } from "expo-router";
import { ReactNode, useMemo, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ChallengeScreenShell, {
  FieldWrapper,
  PrototypeDot,
  SectionCard,
} from "../../../src/components/challenge/ChallengeScreenShell";
import { VideoFrameAnalyzer } from "../../../src/components/challenge/VideoFrameAnalyzer";
import { AccelerometerRecorder } from "../../../src/components/recorders/AccelerometerRecorder";
import { BreathingRecorder } from "../../../src/components/recorders/BreathingRecorder";
import { ChoiceRecorder } from "../../../src/components/recorders/ChoiceRecorder";
import { GPSTagger } from "../../../src/components/recorders/GPSTagger";
import { GyroscopeRecorder } from "../../../src/components/recorders/GyroscopeRecorder";
import { MovementTestRecorder } from "../../../src/components/recorders/MovementTestRecorder";
import { NumberRecorder } from "../../../src/components/recorders/NumberRecorder";
import { PhotoRecorder } from "../../../src/components/recorders/PhotoRecorder";
import { SoundMeterRecorder } from "../../../src/components/recorders/SoundMeterRecorder";
import { StopwatchRecorder } from "../../../src/components/recorders/StopwatchRecorder";
import { TapReactionGame } from "../../../src/components/recorders/TapReactionGame";
import { TeamBreathingBoard } from "../../../src/components/recorders/TeamBreathingBoard";
import { TeamReactionBoard } from "../../../src/components/recorders/TeamReactionBoard";
import { TextRecorder } from "../../../src/components/recorders/TextRecorder";
import { TracingRecorder } from "../../../src/components/recorders/TracingRecorder";
import { VideoRecorder } from "../../../src/components/recorders/VideoRecorder";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import { useHaptic } from "../../../src/hooks/useHaptic";
import type { ColorTokens } from "../../../src/theme/colors";
import { useTheme } from "../../../src/theme/themeContext";
import { Measurement } from "../../../src/types";
import {
  buildIncompleteSummary,
  getMissingMeasurementLabels,
  getRequiredMeasurements,
  isPrototypeComplete,
} from "../../../src/utils/challengeRecordValidation";

// ── Recorder renderer map ────────────────────────────────────────────────────
// Maps recorder type → render function for recorders that need no extra state.
// Recorders that need access to draft state are handled in the switch below.

type SaveFn = (key: string, val: string | number) => void;

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
  teamBreathing: (m, v, save) => (
    <TeamBreathingBoard
      onComplete={(results) => save(m.key, JSON.stringify(results))}
      existingValue={v || undefined}
    />
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
    <GyroscopeRecorder onCapture={(data) => save(m.key, data.smoothness)} />
  ),
  video: (m, v, save) => (
    <VideoRecorder onCapture={(uri) => save(m.key, uri)} existingUri={v} />
  ),
};

// ── Screen ───────────────────────────────────────────────────────────────────

export default function RecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = getChallengeById(Number(id));
  const { draft, updatePrototype, addPrototype, setCurrentPrototypeIndex, setLocation } =
    useActivity();
  const { team } = useTeam();
  const { haptic } = useHaptic();
  const [timeExpired, setTimeExpired] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!challenge || !team) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Loading...</Text>
      </View>
    );
  }

  const current = draft.prototypes[draft.currentPrototypeIndex];

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>
          Session expired. Restart this challenge to keep going.
        </Text>
        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => router.replace(`/challenge/${challenge.id}`)}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const currentNum = draft.currentPrototypeIndex + 1;
  const max = challenge.maxPrototypes;

  const measurements = challenge.measurements.filter(
    (m) => !m.difficulty || m.difficulty === draft.difficulty,
  );
  const requiredMeasurements = getRequiredMeasurements(measurements);

  const currentComplete = isPrototypeComplete(current, requiredMeasurements);
  const allPrototypesComplete =
    draft.prototypes.length >= max &&
    draft.prototypes.every((p) => isPrototypeComplete(p, requiredMeasurements));
  const onLastPrototype = currentNum >= max;
  const canProceed = onLastPrototype ? allPrototypesComplete : currentComplete;

  const missingOnCurrent = getMissingMeasurementLabels(current, requiredMeasurements);
  const incompleteSummary = buildIncompleteSummary(draft.prototypes, requiredMeasurements);

  const prototypeDots: PrototypeDot[] = draft.prototypes.map((p) => ({
    index: p.index,
    isActive: current.index === p.index,
    isComplete: isPrototypeComplete(p, requiredMeasurements),
  }));

  // ── Handlers ───────────────────────────────────────────────────────────────

  const saveMeasurement = (key: string, value: string | number) =>
    updatePrototype(current.index, { measurements: { [key]: value } });

  const handleGPSCapture = (lat: number, lng: number) => {
    setLocation(lat, lng);
    saveMeasurement("location", `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const goToReflect = () =>
    router.push(
      `/challenge/${challenge.id}/results${timeExpired ? "?timeExpired=true" : ""}`,
    );

  const handleTimeout = () => {
    haptic("error");
    setTimeExpired(true);
    Alert.alert(
      "Time's Up!",
      `Your ${challenge.estimatedMinutes}-minute challenge time has ended. You can still submit.`,
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
      haptic("warning");
      Alert.alert(
        onLastPrototype ? "Complete all designs first" : "Complete this design first",
        incompleteSummary,
      );
      return;
    }
    haptic("success");
    if (currentNum < max) addPrototype();
    else goToReflect();
  };

  const handleSaveDraft = () => {
    haptic("warning");
    Alert.alert(
      "Save draft and exit?",
      "Your work will be kept so you can resume later.",
      [
        { text: "Keep Working", style: "cancel" },
        {
          text: "Save and exit",
          onPress: () => router.replace("/(tabs)/activity"),
        },
      ],
    );
  };

  // ── Recorder renderer ──────────────────────────────────────────────────────

  const renderRecorder = (measurement: Measurement): ReactNode => {
    const value = String(current.measurements[measurement.key] || "");

    const renderer = RECORDER_RENDERERS[measurement.recorder];
    if (renderer) return renderer(measurement, value, saveMeasurement);

    // Recorders that need draft state not available in the static map
    switch (measurement.recorder) {
      case "videoAnalyzer": {
        const videoUri = String(current.measurements["slowMotionVideo"] || "");
        if (!videoUri) {
          return (
            <View style={styles.analyzerPlaceholder}>
              <Text style={styles.analyzerPlaceholderText}>
                Record the slow-motion video above, then frame analysis will appear here.
              </Text>
            </View>
          );
        }
        return (
          <VideoFrameAnalyzer
            videoUri={videoUri}
            slowMoFactor={4}
            onComplete={(result) => {
              saveMeasurement(measurement.key, "analyzed");
              saveMeasurement("contactTimeSeconds", result.contactTime);
              saveMeasurement("bounced", result.bounced ? "Yes" : "No");
              // Prefer video-derived fall time over manual stopwatch when available
              if (result.fallTimeSeconds)
                saveMeasurement("fallTimeSeconds", result.fallTimeSeconds);
              if (result.timeToBouncePeak)
                saveMeasurement("timeToMaxHeightSeconds", result.timeToBouncePeak);
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

  // ── Measurement content ────────────────────────────────────────────────────
  // Injected into the shell's children slot. All recorder logic stays here;
  // the shell only receives the already-rendered output.

  const measurementContent = (
    <SectionCard>
      {measurements.map((m) => {
        // Activity 5: bundle smoothness + vibration + time into one widget
        if (
          challenge.id === 5 &&
          ["smoothness", "vibrationData", "timeSeconds"].includes(m.key)
        ) {
          if (m.key !== "smoothness") return null;
          return (
            <FieldWrapper key="movementTest" label="Movement Test">
              <MovementTestRecorder
                existingValues={{
                  timeSeconds: current.measurements.timeSeconds,
                  vibrationData: current.measurements.vibrationData,
                  smoothness: current.measurements.smoothness,
                }}
                onCapture={(data) => {
                  saveMeasurement("timeSeconds", data.timeSeconds);
                  saveMeasurement("vibrationData", data.vibrationPeak);
                  saveMeasurement("smoothness", data.smoothness);
                }}
              />
            </FieldWrapper>
          );
        }

        return (
          <FieldWrapper key={m.key} label={m.label} unit={m.unit}>
            {renderRecorder(m)}
          </FieldWrapper>
        );
      })}
    </SectionCard>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ChallengeScreenShell
      challengeId={challenge.id}
      activeTab="doit"
      doitEnabled
      reflectEnabled={allPrototypesComplete}
      onBrief={() => router.back()}
      onDoit={() => {}}
      onReflect={goToReflect}
      onReflectDisabledPress={() => {
        haptic("warning");
        Alert.alert(
          max > 1
            ? "Reflect unlocks when every design is complete"
            : "Complete required measurements first",
          incompleteSummary,
        );
      }}
      timerMinutes={challenge.estimatedMinutes}
      onTimeout={handleTimeout}
      timerAutoStart={!timeExpired}
      timeExpired={timeExpired}
      currentDesignNum={currentNum}
      maxDesigns={max}
      challengeColor={challenge.color}
      prototypeDots={prototypeDots}
      onSelectPrototype={(i) => setCurrentPrototypeIndex(i)}
      allPrototypesComplete={allPrototypesComplete}
      missingFields={!canProceed ? missingOnCurrent : []}
      currentDesignIndex={current.index}
      canProceed={canProceed}
      onNext={handleNext}
      nextLabel={
        currentNum < max
          ? `Next Design (${currentNum} / ${max})`
          : "Go to Reflect"
      }
      onSaveAndExit={handleSaveDraft}
    >
      {measurementContent}
    </ChallengeScreenShell>
  );
}

// ── Styles (guard screens only — layout is owned by ChallengeScreenShell) ────

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: c.background,
      gap: 16,
    },
    centerText: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    goBackBtn: {
      backgroundColor: c.cta,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 14,
    },
    goBackText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    analyzerPlaceholder: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderStyle: "dashed",
      borderRadius: 12,
      padding: 18,
      alignItems: "center",
      backgroundColor: c.backgroundSecondary,
    },
    analyzerPlaceholderText: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: "center",
      lineHeight: 19,
    },
  });
}
