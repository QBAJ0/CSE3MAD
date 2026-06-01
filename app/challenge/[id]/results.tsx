// app/challenge/[id]/results.tsx

import Ionicons from "@expo/vector-icons/Ionicons";
import { ResizeMode, Video } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ResultLocationMap } from "@/src/components/ResultLocationMap";
import { HumanPerformanceReflect } from "../../../src/components/challenge/HumanPerformanceReflect";
import { ChallengeTabBar } from "../../../src/components/challenge/ChallengeTabBar";
import { SoundMap } from "../../../src/components/challenge/SoundMap";
import { parseSoundMapPoints } from "../../../src/utils/soundMap";
import { checkNewBadges } from "../../../src/config/badges";
import { GAMIFICATION } from "../../../src/config/constants";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import type { ColorTokens } from "../../../src/theme/colors";
import { useTheme } from "../../../src/theme/themeContext";
import {
  ParachuteDerived,
  deriveParachute,
  gForceRiskCategory,
} from "../../../src/services/physics";
import {
  Challenge,
  DifficultyMode,
  Measurement,
  Prototype,
} from "../../../src/types";
import {
  WereYouRightValue,
  getPredictionCharsFromPrototypes,
  getPrototypeOutcomeText,
  formatPredictionDisplay,
  getPrototypeWereYouRight,
} from "../../../src/utils/prototypePrediction";
import { exitToTabFromChallenge } from "../../../src/utils/exitToTabFromChallenge";
import { storage } from "../../../src/utils/storage";
import {
  HUMAN_PERFORMANCE_CHALLENGE_ID,
  isHumanPerformancePrototypeComplete,
} from "../../../src/utils/humanPerformance";

const G_FORCE_LABELS: Record<
  "none" | "minor" | "serious" | "severe" | "lifeThreatening",
  string
> = {
  none:            "No injury risk",
  minor:           "Minor injury risk",
  serious:         "Serious injury possible",
  severe:          "High injury risk",
  lifeThreatening: "Life-threatening",
};

const G_FORCE_COLORS: Record<
  "none" | "minor" | "serious" | "severe" | "lifeThreatening",
  string
> = {
  none:            "#0F766E",
  minor:           "#F59E0B",
  serious:         "#F97316",
  severe:          "#DC2626",
  lifeThreatening: "#7C3AED",
};

const EVIDENCE_RECORDERS = new Set<Measurement["recorder"]>([
  "gps",
  "video",
  "videoAnalyzer",
  "slowMotion",
  "photo",
]);

const hasMeasurementValue = (value: unknown) =>
  value !== undefined && value !== null && String(value).trim().length > 0;

const getVideoEvidenceUri = (prototype: Prototype): string | null => {
  const entry = Object.entries(prototype.measurements).find(
    ([key, value]) =>
      key.toLowerCase().includes("video") && hasMeasurementValue(value),
  );
  return entry ? String(entry[1]) : null;
};

const getActiveMeasurements = (
  challenge: Challenge | undefined,
  difficulty: DifficultyMode,
) =>
  challenge?.measurements.filter(
    (measurement) =>
      !measurement.difficulty || measurement.difficulty === difficulty,
  ) ?? [];

const hasCompleteRequiredData = (
  challenge: Challenge | undefined,
  prototypes: Prototype[],
  difficulty: DifficultyMode,
) => {
  if (!challenge || prototypes.length === 0) return false;

  if (challenge.id === HUMAN_PERFORMANCE_CHALLENGE_ID) {
    return prototypes.every(isHumanPerformancePrototypeComplete);
  }

  const requiredMeasurements = getActiveMeasurements(challenge, difficulty).filter(
    (measurement) => !EVIDENCE_RECORDERS.has(measurement.recorder) && !measurement.optional,
  );

  if (requiredMeasurements.length === 0) {
    return false;
  }

  return prototypes.every((prototype) =>
    requiredMeasurements.every((measurement) =>
      hasMeasurementValue(prototype.measurements[measurement.key]),
    ),
  );
};

const hasEvidenceAttached = (
  challenge: Challenge | undefined,
  prototypes: Prototype[],
  difficulty: DifficultyMode,
  hasLocation: boolean,
) => {
  if (hasLocation) return true;

  const evidenceKeys = getActiveMeasurements(challenge, difficulty)
    .filter((measurement) => EVIDENCE_RECORDERS.has(measurement.recorder))
    .map((measurement) => measurement.key);

  return prototypes.some((prototype) =>
    evidenceKeys.some((key) => hasMeasurementValue(prototype.measurements[key])),
  );
};

const hasTeamworkEvidence = (prototypes: Prototype[]) =>
  prototypes.some((prototype) => {
    const rawTeamResults = prototype.measurements.teamResults;
    if (!hasMeasurementValue(rawTeamResults)) return false;

    if (typeof rawTeamResults !== "string") return true;

    try {
      const parsed = JSON.parse(rawTeamResults);
      return Array.isArray(parsed) && parsed.length > 1;
    } catch {
      return true;
    }
  });

export default function ResultsScreen() {
  const { id, timeExpired } = useLocalSearchParams<{
    id: string;
    timeExpired?: string;
  }>();

  const challenge = getChallengeById(Number(id));
  const { draft, finalize, clearDraft, updatePrototype } = useActivity();
  const isHumanPerformance = challenge?.id === HUMAN_PERFORMANCE_CHALLENGE_ID;
  const { team } = useTeam();

  const [observations, setObservations] = useState<Record<number, string>>({});
  const [comment, setComment] = useState("");
  const [wereYouRightByPrototype, setWereYouRightByPrototype] = useState<
    Record<number, WereYouRightValue | "">
  >(() =>
    Object.fromEntries(
      draft.prototypes.map((prototype) => [
        prototype.index,
        getPrototypeWereYouRight(prototype),
      ]),
    ),
  );
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const hasTimeExpired = timeExpired === "true";

  const observationQuestions = challenge?.observationQuestions ?? [
    "What did you observe during the experiment?",
    "Were your predictions correct? What was different?",
    "What would you change if you ran the experiment again?",
  ];
  const visibleObservationQuestions = showAllQuestions
    ? observationQuestions
    : observationQuestions.slice(0, 3);

  const combinedReflection = visibleObservationQuestions
    .map((q, i) => `${q}\n${observations[i] ?? ""}`)
    .join("\n\n");
  const totalReflectionChars = combinedReflection.length;

  const scoringDifficulty = draft.difficulty ?? "primary";

  if (!challenge || !team) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const getSubmitBlockers = (): string[] => {
    const blockers: string[] = [];
    if (rating === 0) {
      blockers.push("Tap the stars to rate this activity.");
    }
    visibleObservationQuestions.forEach((_, i) => {
      const len = (observations[i] ?? "").trim().length;
      if (len < GAMIFICATION.OBSERVATION_MIN_CHARS) {
        const remaining = GAMIFICATION.OBSERVATION_MIN_CHARS - len;
        blockers.push(
          len === 0
            ? `Answer question ${i + 1} before claiming.`
            : `Question ${i + 1} needs ${remaining} more character${remaining === 1 ? "" : "s"}.`,
        );
      }
    });
    return blockers;
  };

  const isReadyToSubmit = () => getSubmitBlockers().length === 0;

  const describeFinalizeFailure = (): string => {
    if (
      !draft.id ||
      draft.challengeId === undefined ||
      !draft.teamId ||
      !draft.teamName ||
      !draft.difficulty
    ) {
      return "Your session data is incomplete. Return to Do It and restart the challenge from the brief screen.";
    }
    return "Could not save your result on this device. Check storage space and try Claim again. Cloud sync is optional and does not block saving.";
  };

  const handleSubmit = async () => {
    const blockers = getSubmitBlockers();
    if (blockers.length > 0) {
      Alert.alert("Not quite done", blockers.join("\n\n"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await finalize({
        rating: rating as 1 | 2 | 3 | 4 | 5,
        reflection: comment.trim()
          ? `${combinedReflection}\n\nTeam comment: ${comment.trim()}`
          : combinedReflection,
        completedInTime: !hasTimeExpired,
      });

      if (!result) {
        Alert.alert("Could not claim reward", describeFinalizeFailure());
        return;
      }

      try {
        const streak = await storage.updateStreak();
        const [allCompleted, earnedList, savedTeam] = await Promise.all([
          storage.getCompletedActivities(),
          storage.getEarnedBadges(),
          storage.getTeam(),
        ]);
        const newBadgeIds = checkNewBadges({
          result,
          allCompleted,
          streak,
          newTotalXP: savedTeam?.totalPoints ?? 0,
          earnedIds: new Set(earnedList),
          teamMemberCount: savedTeam?.members.length ?? 0,
        });
        if (newBadgeIds.length > 0) {
          await storage.unlockBadges(newBadgeIds);
        }
      } catch (e) {
        console.warn("Post-claim extras failed (result was saved):", e);
      }

      Alert.alert(
        "Claim saved.",
        "Your result has been saved and added to the leaderboard.",
        [
          {
            text: "Back to Challenges",
            onPress: () => {
              exitToTabFromChallenge("/(tabs)/activity", clearDraft);
            },
          },
        ],
      );
    } catch (e) {
      console.error("Claim failed:", e);
      Alert.alert(
        "Could not claim reward",
        e instanceof Error
          ? e.message
          : "Something went wrong while submitting. Your answers are still here — try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const parachutePhysics: ParachuteDerived[] | null =
    challenge.id === 1 && draft.difficulty === "highSchool"
      ? draft.prototypes.map((p) =>
          deriveParachute({
            dropHeightMeters: parseFloat(
              String(p.measurements.dropHeightMeters ?? ""),
            ),
            fallTimeSeconds: parseFloat(
              String(p.measurements.fallTimeSeconds ?? ""),
            ),
            toyMassKg:
              parseFloat(String(p.measurements.toyMassKg ?? "")) || undefined,
            contactTimeSeconds:
              parseFloat(
                String(
                  p.measurements.contactTimeSeconds ??
                    p.measurements.contactTime ??
                    "",
                ),
              ) ||
              undefined,
            bounced: String(p.measurements.bounced) === "Yes",
            timeToMaxHeightSeconds:
              parseFloat(
                String(
                  p.measurements.timeToMaxHeightSeconds ??
                    p.measurements.timeToBouncePeak ??
                    "",
                ),
              ) || undefined,
          }),
        )
      : null;

  const tableKeys = challenge.measurements
    .filter(
      (m) =>
        ![
          "gps",
          "video",
          "photo",
          "videoAnalyzer",
          "slowMotion",
          "teamReaction",
        ].includes(m.recorder),
    )
    .slice(0, 3);

  const hasVideoEvidence = draft.prototypes.some((p) => getVideoEvidenceUri(p));

  const soundMapPoints = parseSoundMapPoints(challenge.id, draft.prototypes);

  const SOUND_ZONES = [
    { max: 60,       label: "Safe",    color: "#2563EB" },
    { max: 85,       label: "Caution", color: "#F59E0B" },
    { max: 100,      label: "Warning", color: "#F97316" },
    { max: Infinity, label: "Danger",  color: "#EF4444" },
  ];
  const getSoundZone = (db: number) => SOUND_ZONES.find((z) => db <= z.max) ?? SOUND_ZONES[3];

  const soundRankings =
    challenge.id === 2
      ? draft.prototypes
          .map((p) => ({
            action: String(p.measurements.action ?? `Scan ${p.index + 1}`),
            db: parseFloat(String(p.measurements.soundLevel ?? "")),
          }))
          .filter((r) => !isNaN(r.db))
          .sort((a, b) => b.db - a.db)
      : [];

  const setWereYouRight = (prototypeIndex: number, value: WereYouRightValue) => {
    setWereYouRightByPrototype((prev) => ({ ...prev, [prototypeIndex]: value }));
    updatePrototype(prototypeIndex, {
      measurements: { wereYouRight: value },
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ChallengeTabBar
        active="reflect"
        onBrief={() => router.push(`/challenge/${challenge.id}`)}
        onDoit={() => router.back()}
        onReflect={() => {}}
        doitEnabled={true}
        reflectEnabled={true}
      />

      <View style={styles.header}>
        <View style={styles.headerIconCircle}>
          <Ionicons name={challenge.icon as any} size={36} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>Reflect</Text>
        <Text style={styles.headerSubtitle}>{challenge.title}</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.headerMetaText}>
            {team.teamName} {team.discriminator}
          </Text>
          <Text style={styles.headerMetaDot}>·</Text>
          <Text style={styles.headerMetaText}>
            {draft.difficulty === "highSchool" ? "High School" : "Primary"}
          </Text>
          <Text style={styles.headerMetaDot}>·</Text>
          <Text style={styles.headerMetaText}>
            {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>

      {hasTimeExpired && (
        <View style={styles.penaltyBanner}>
          <Ionicons name="alarm-outline" size={22} color={colors.danger} />
          <Text style={styles.penaltyText}>Time expired</Text>
        </View>
      )}

      {isHumanPerformance ? (
        <HumanPerformanceReflect
          prototypes={draft.prototypes}
          teamPrediction={draft.prediction ?? ""}
          onUpdatePrototype={updatePrototype}
        />
      ) : null}

      {!isHumanPerformance && draft.prototypes.length > 0 && tableKeys.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bar-chart-outline" size={16} color={colors.text} />
            <Text style={styles.cardTitle}>Results</Text>
          </View>

          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text
              style={[
                styles.tableCell,
                styles.tableHeaderCell,
                styles.designCell,
              ]}
            >
              Design
            </Text>

            {tableKeys.map((k) => (
              <Text
                key={k.key}
                style={[styles.tableCell, styles.tableHeaderCell]}
              >
                {k.label}
                {k.unit ? ` (${k.unit})` : ""}
              </Text>
            ))}
          </View>

          {draft.prototypes.map((p, idx) => (
            <View
              key={p.index}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
            >
              <Text
                style={[
                  styles.tableCell,
                  styles.designCell,
                  styles.tableCellBold,
                ]}
              >
                Design {idx + 1}
              </Text>

              {tableKeys.map((k) => (
                <Text key={k.key} style={styles.tableCell}>
                  {String(p.measurements[k.key] ?? "—")}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {!isHumanPerformance && (
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="help-circle-outline" size={16} color={colors.text} />
          <Text style={styles.cardTitle}>Attempt Review</Text>
        </View>
        {draft.prototypes.map((prototype, idx) => {
          const predictionDisplay = formatPredictionDisplay(challenge.id, prototype);
          const outcomeText = getPrototypeOutcomeText(challenge.id, prototype);
          const selected = wereYouRightByPrototype[prototype.index];

          return (
            <View key={prototype.index} style={styles.attemptCard}>
              <Text style={styles.attemptTitle}>
                {challenge.id === 7 && prototype.measurements.condition
                  ? String(prototype.measurements.condition)
                  : `#${idx + 1}`}
              </Text>
              <Text style={styles.attemptLine}>
                Outcome: {outcomeText || "Not recorded"}
              </Text>
              {challenge.id === 7 && (() => {
                const raw = prototype.measurements.breathingData;
                if (typeof raw !== "string" || !raw.trim()) return null;
                try {
                  const members = JSON.parse(raw) as Array<{ name: string; bpm: number }>;
                  if (!Array.isArray(members) || members.length === 0) return null;
                  return (
                    <View style={styles.memberBreakdown}>
                      {members.map((m, i) => (
                        <View key={i} style={styles.memberRow}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          <Text style={styles.memberBpm}>{Math.round(m.bpm)} bpm</Text>
                        </View>
                      ))}
                    </View>
                  );
                } catch {
                  return null;
                }
              })()}
              <Text style={styles.attemptLine}>
                Prediction: {predictionDisplay || "Not recorded"}
              </Text>

              <Text style={styles.attemptPrompt}>Were you right?</Text>
              <View style={styles.rightRow}>
                {([
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "No" },
                ] as const).map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.rightChoice,
                      selected === option.id && styles.rightChoiceActive,
                      selected === option.id && option.id === "no" && styles.rightChoiceNo,
                    ]}
                    onPress={() => setWereYouRight(prototype.index, option.id)}
                  >
                    <Text
                      style={[
                        styles.rightChoiceText,
                        selected === option.id && styles.rightChoiceTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </View>
      )}

      {soundMapPoints.length > 0 && (
        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <Ionicons name="volume-high-outline" size={15} color={colors.info} />
            <Text style={styles.mapCardTitle}>Sound Pollution Zone Map</Text>
          </View>
          <SoundMap points={soundMapPoints} />
        </View>
      )}

      {soundRankings.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="podium-outline" size={16} color={colors.text} />
            <Text style={styles.cardTitle}>Loudness Ranking</Text>
          </View>

          {soundRankings.map((r, idx) => {
            const zone = getSoundZone(r.db);
            return (
              <View key={idx} style={styles.rankRow}>
                <View style={styles.rankNum}>
                  <Text style={styles.rankNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.rankAction} numberOfLines={1}>{r.action}</Text>
                <View style={[styles.rankZoneBadge, { backgroundColor: zone.color + "22" }]}>
                  <Text style={[styles.rankZoneText, { color: zone.color }]}>{zone.label}</Text>
                </View>
                <Text style={[styles.rankDb, { color: zone.color }]}>{r.db} dB</Text>
              </View>
            );
          })}

          {(() => {
            const maxDb = soundRankings[0].db;
            const allSafe = maxDb < 85;
            return (
              <View style={[
                styles.earSafetyBanner,
                { backgroundColor: allSafe ? "#2563EB22" : "#EF444422", borderColor: allSafe ? "#2563EB" : "#EF4444" },
              ]}>
                <Ionicons
                  name={allSafe ? "ear-outline" : "warning-outline"}
                  size={16}
                  color={allSafe ? "#2563EB" : "#EF4444"}
                />
                <Text style={[styles.earSafetyText, { color: allSafe ? "#2563EB" : "#EF4444" }]}>
                  {allSafe
                    ? "All readings are in the safe zone — no ear protection needed."
                    : `Loudest reading (${maxDb} dB) exceeds safe limit. Ear protection recommended!`}
                </Text>
              </View>
            );
          })()}
        </View>
      )}

      {hasVideoEvidence && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="videocam-outline" size={16} color={colors.text} />
            <Text style={styles.cardTitle}>Media Evidence</Text>
          </View>

          <Text style={styles.mediaSubtitle}>
            Review the experiment videos attached by your team.
          </Text>

          {draft.prototypes.map((p, index) => {
            const videoUri = getVideoEvidenceUri(p);

            if (!videoUri) return null;

            return (
              <View key={p.index} style={styles.mediaBlock}>
                <Text style={styles.mediaLabel}>Design {index + 1} Video</Text>

                <Video
                  source={{ uri: String(videoUri) }}
                  style={styles.mediaVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                />
              </View>
            );
          })}
        </View>
      )}

      {parachutePhysics && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="flask-outline" size={16} color={colors.text} />
            <Text style={styles.cardTitle}>Step-by-Step Physics</Text>
          </View>

          <Text style={styles.physicsIntro}>
            All formulas from the spec. Values derived from your recorded measurements.
          </Text>

          {parachutePhysics.map((calc, i) => {
            const proto = draft.prototypes[i];
            const h  = parseFloat(String(proto?.measurements.dropHeightMeters ?? ""));
            const t  = parseFloat(String(proto?.measurements.fallTimeSeconds  ?? ""));
            const m  = parseFloat(String(proto?.measurements.toyMassKg        ?? ""));

            return (
              <View key={i} style={styles.physicsBlock}>
                <Text style={styles.physicsBlockLabel}>
                  Design {i + 1}{proto?.measurements.designName ? ` — ${proto.measurements.designName}` : ""}
                </Text>

                {/* Step 3 */}
                {calc.finalVelocity != null && (
                  <View style={styles.physicsStep}>
                    <Text style={styles.physicsStepNum}>Step 3</Text>
                    <Text style={styles.physicsFormula}>
                      v = distance ÷ time = {isNaN(h) ? "?" : h} ÷ {isNaN(t) ? "?" : t}
                    </Text>
                    <Text style={styles.physicsResult}>
                      Final velocity = {calc.finalVelocity.toFixed(2)} m/s
                    </Text>
                  </View>
                )}

                {/* Step 4 */}
                {calc.acceleration != null && (
                  <View style={styles.physicsStep}>
                    <Text style={styles.physicsStepNum}>Step 4</Text>
                    <Text style={styles.physicsFormula}>
                      a = v ÷ t = {calc.finalVelocity?.toFixed(2)} ÷ {isNaN(t) ? "?" : t}
                    </Text>
                    <Text style={styles.physicsResult}>
                      Acceleration = {calc.acceleration.toFixed(2)} m/s²
                    </Text>
                  </View>
                )}

                {/* Step 5 */}
                {calc.netForce != null && (
                  <View style={styles.physicsStep}>
                    <Text style={styles.physicsStepNum}>Step 5</Text>
                    <Text style={styles.physicsFormula}>
                      F = m × a = {isNaN(m) ? "?" : m} × {calc.acceleration?.toFixed(2)}
                    </Text>
                    <Text style={styles.physicsResult}>
                      Net force = {calc.netForce.toFixed(3)} N
                    </Text>
                  </View>
                )}

                {/* Step 6 */}
                {calc.dragForce != null && (
                  <View style={styles.physicsStep}>
                    <Text style={styles.physicsStepNum}>Step 6</Text>
                    <Text style={styles.physicsFormula}>
                      Drag = weight − net force = {(m * 9.8).toFixed(3)} − {calc.netForce?.toFixed(3)}
                    </Text>
                    <Text style={styles.physicsResult}>
                      Drag force = {calc.dragForce.toFixed(3)} N
                    </Text>
                  </View>
                )}

                {/* G-force */}
                {calc.gForce != null && (
                  <View style={[styles.physicsStep, styles.physicsStepGForce]}>
                    <Text style={styles.physicsStepNum}>G-Force</Text>
                    <Text style={styles.physicsFormula}>
                      g-force = Δv ÷ t_contact ÷ 9.8
                    </Text>
                    <Text style={styles.physicsResult}>
                      {calc.gForce.toFixed(1)} g
                    </Text>
                    <View style={[
                      styles.gRiskBadge,
                      { backgroundColor: G_FORCE_COLORS[gForceRiskCategory(calc.gForce)] + "22" },
                    ]}>
                      <Text style={[
                        styles.gRiskText,
                        { color: G_FORCE_COLORS[gForceRiskCategory(calc.gForce)] },
                      ]}>
                        {G_FORCE_LABELS[gForceRiskCategory(calc.gForce)]}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {draft.location && (
        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <Ionicons name="location" size={15} color={colors.info} />
            <Text style={styles.mapCardTitle}>Experiment Location</Text>
          </View>

          <ResultLocationMap
            lat={draft.location.lat}
            lng={draft.location.lng}
            title="Experiment site"
            description={challenge.title}
            interactive={false}
            regionDelta={0.005}
          />

          <Text style={styles.mapCoords}>
            {draft.location.lat.toFixed(5)}, {draft.location.lng.toFixed(5)}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="document-text-outline" size={16} color={colors.text} />
            <Text style={styles.cardTitle}>Reflect</Text>
        </View>

        <Text style={styles.observationsSubtitle}>
          Answer as a team — even a short sentence counts!
        </Text>

        {visibleObservationQuestions.map((question, i) => {
          const answerLen = (observations[i] ?? "").trim().length;
          const answerReady =
            answerLen >= GAMIFICATION.OBSERVATION_MIN_CHARS;
          return (
          <View key={i} style={styles.observationField}>
            <Text style={styles.observationQuestion}>{question}</Text>

            <TextInput
              style={[
                styles.observationInput,
                answerReady && styles.observationInputValid,
              ]}
              placeholder="Write your answer here..."
              placeholderTextColor={colors.textMuted}
              value={observations[i] ?? ""}
              onChangeText={(v) =>
                setObservations((prev) => ({ ...prev, [i]: v }))
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {answerReady ? null : answerLen > 0 ? (
              <Text style={styles.observationCount}>
                {GAMIFICATION.OBSERVATION_MIN_CHARS - answerLen} more characters needed
              </Text>
            ) : null}
          </View>
          );
        })}

        {observationQuestions.length > 3 && (
          <TouchableOpacity
            style={styles.moreQuestionsBtn}
            onPress={() => setShowAllQuestions((value) => !value)}
            activeOpacity={0.75}
          >
            <Text style={styles.moreQuestionsText}>
              {showAllQuestions ? "Show fewer questions" : "Add more questions"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="star-outline" size={16} color={colors.text} />
          <Text style={styles.cardTitle}>Rate It</Text>
        </View>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setRating(s)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={rating >= s ? "star" : "star-outline"}
                size={46}
                color={rating >= s ? colors.warning : colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ratingNote}>
          <Text style={styles.ratingNoteText}>
            How fun was it? Your rating helps the team.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
          <Text style={styles.cardTitle}>Team Notes</Text>
        </View>
        <Text style={styles.commentHint}>
          Shout-outs, surprises, what went wrong — anything goes!
        </Text>
        <TextInput
          style={[styles.commentInput, comment.trim() ? styles.commentInputFilled : null]}
          placeholder="Write a comment here…"
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <Pressable
        style={[
          styles.claimBtn,
          (!isReadyToSubmit() || isSubmitting) && styles.claimBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.claimBtnText}>
          {isSubmitting ? "Saving..." : "Claim Reward"}
        </Text>
      </Pressable>

      {!isReadyToSubmit() && !isSubmitting && (
        <Text style={styles.claimHint}>
          {rating === 0
            ? "Select a star rating and complete every observation above."
            : "Complete every observation above to claim."}
        </Text>
      )}

      <TouchableOpacity
        style={styles.exitLink}
        onPress={() => {
          Alert.alert(
            "Save draft and exit?",
            "Your current activity results will be kept so you can resume later.",
            [
              { text: "Keep Reflecting", style: "cancel" },
              {
                text: "Save and exit",
                onPress: () => {
                  exitToTabFromChallenge("/(tabs)/activity");
                },
              },
            ],
          );
        }}
      >
        <Text style={styles.exitLinkText}>Save and exit</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.redoLink}
        onPress={() => {
          Alert.alert(
            "Redo experiment?",
            "This will discard your current results.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Redo",
                style: "destructive",
                onPress: () => {
                  clearDraft();
                  router.replace(`/challenge/${challenge.id}`);
                },
              },
            ],
          );
        }}
      >
        <Text style={styles.redoLinkText}>↺ Try Again</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { paddingTop: 24, paddingBottom: 40 },

    loadingText: {
      textAlign: "center",
      marginTop: 80,
      fontSize: 16,
      color: c.textSecondary,
    },

    header: {
      alignItems: "center",
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    headerIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
      borderWidth: 2,
      borderColor: c.primary,
    },
    headerTitle: { fontSize: 28, fontWeight: "800", color: c.text },
    headerSubtitle: { fontSize: 14, color: c.textSecondary, marginTop: 2 },
    headerMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap", justifyContent: "center" },
    headerMetaText: { fontSize: 12, color: c.textSecondary },
    headerMetaDot: { fontSize: 12, color: c.textSecondary },

    penaltyBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.dangerLight,
      borderRadius: 12,
      padding: 14,
      marginHorizontal: 20,
      marginBottom: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: c.danger,
    },
    penaltyText: { color: c.danger, fontWeight: "700", fontSize: 14 },

    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.borderFaint,
    },
    cardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: c.text,
    },

    attemptCard: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      marginBottom: 10,
    },
    attemptTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: c.text,
      marginBottom: 6,
    },
    attemptLine: { fontSize: 13, color: c.textSecondary, marginBottom: 4 },
    memberBreakdown: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginBottom: 6,
      gap: 4,
    },
    memberRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    memberName: { fontSize: 13, color: c.textSecondary, flex: 1 },
    memberBpm: { fontSize: 13, fontWeight: "700", color: c.text },
    attemptPrompt: {
      fontSize: 12,
      fontWeight: "700",
      color: c.textSecondary,
      marginTop: 6,
      marginBottom: 6,
    },
    rightRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    rightChoice: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
      backgroundColor: c.surface,
    },
    rightChoiceActive: {
      backgroundColor: c.success,
      borderColor: c.success,
    },
    rightChoiceNo: {
      backgroundColor: c.danger,
      borderColor: c.danger,
    },
    rightChoiceText: { fontSize: 12, color: c.textSecondary, fontWeight: "700" },
    rightChoiceTextActive: { color: "#FFFFFF" },

    tableRow: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderFaint,
    },
    tableHeaderRow: { borderBottomWidth: 2, borderBottomColor: c.border },
    tableRowAlt: { backgroundColor: c.backgroundSecondary },
    tableCell: { flex: 1, fontSize: 12, color: c.textSecondary, textAlign: "center" },
    designCell: { flex: 1.2, textAlign: "left" },
    tableCellBold: { fontWeight: "700", color: c.text },
    tableHeaderCell: { fontWeight: "700", color: c.textMuted, fontSize: 11 },

    mediaSubtitle: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: -6,
      marginBottom: 12,
    },
    mediaBlock: {
      marginTop: 10,
      padding: 10,
      backgroundColor: c.backgroundSecondary,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    mediaLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.text,
      marginBottom: 8,
    },
    mediaVideo: {
      width: "100%",
      height: 220,
      borderRadius: 12,
      backgroundColor: "#000",
    },

    physicsIntro: {
      fontSize: 13,
      color: c.textMuted,
      marginBottom: 12,
      marginTop: -6,
      lineHeight: 18,
    },
    physicsBlock: {
      borderLeftWidth: 3,
      borderLeftColor: c.info,
      paddingLeft: 12,
      marginBottom: 18,
    },
    physicsBlockLabel: {
      fontSize: 14,
      fontWeight: "800",
      color: c.text,
      marginBottom: 8,
    },
    physicsRow: { fontSize: 13, color: c.textSecondary, marginBottom: 2 },
    physicsRisk: { fontWeight: "700", color: c.danger },
    physicsStep: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: 10,
      padding: 10,
      marginBottom: 6,
      gap: 2,
    },
    physicsStepGForce: {
      borderWidth: 1,
      borderColor: c.border,
    },
    physicsStepNum: {
      fontSize: 10,
      fontWeight: "800",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    physicsFormula: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: "monospace",
      lineHeight: 18,
    },
    physicsResult: {
      fontSize: 14,
      fontWeight: "700",
      color: c.text,
    },
    gRiskBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 4,
    },
    gRiskText: {
      fontSize: 12,
      fontWeight: "800",
    },

    mapCard: {
      marginHorizontal: 20,
      marginBottom: 14,
      backgroundColor: c.surface,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.borderFaint,
    },
    mapCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.backgroundSecondary,
    },
    mapCardTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: c.info,
    },
    mapCoords: {
      fontSize: 11,
      color: c.textMuted,
      fontWeight: "600",
      textAlign: "center",
      paddingVertical: 8,
      backgroundColor: c.backgroundSecondary,
    },

    observationsSubtitle: {
      fontSize: 13,
      color: c.textSecondary,
      marginBottom: 16,
      marginTop: -6,
    },
    observationField: { marginBottom: 16 },
    observationQuestion: {
      fontSize: 14,
      fontWeight: "600",
      color: c.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    observationInput: {
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      minHeight: 70,
      color: c.text,
      backgroundColor: c.input,
    },
    observationInputValid: {
      borderColor: c.success,
      backgroundColor: c.successLight,
    },
    moreQuestionsBtn: {
      alignSelf: "center",
      marginTop: 2,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: c.ctaLight,
    },
    moreQuestionsText: {
      fontSize: 13,
      fontWeight: "800",
      color: c.cta,
    },
    observationCount: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 4,
      textAlign: "right",
    },
    observationCountReady: {
      fontSize: 12,
      fontWeight: "600",
      color: c.success,
      marginTop: 4,
      textAlign: "right",
    },

    starsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
      marginTop: 4,
    },
    ratingNote: {
      alignSelf: "center",
      marginTop: 10,
      backgroundColor: c.infoLight,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 12,
    },
    ratingNoteText: { fontSize: 13, color: c.info, fontWeight: "700" },

    commentHint: {
      fontSize: 13,
      color: c.textMuted,
      lineHeight: 18,
    },
    commentInput: {
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      color: c.text,
      minHeight: 80,
      backgroundColor: c.input,
      lineHeight: 21,
      marginTop: 8,
    },
    commentInputFilled: {
      borderColor: c.inputFilledBorder,
      backgroundColor: c.inputFilled,
    },

    claimBtn: {
      backgroundColor: c.cta,
      marginHorizontal: 20,
      paddingVertical: 20,
      borderRadius: 20,
      alignItems: "center",
    },
    claimBtnDisabled: { backgroundColor: c.border },
    claimBtnText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    claimHint: {
      marginHorizontal: 20,
      marginTop: 10,
      fontSize: 13,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 18,
    },

    redoLink: { alignItems: "center", paddingVertical: 16 },
    redoLinkText: { fontSize: 14, color: c.textSecondary, fontWeight: "600" },
    exitLink: { alignItems: "center", paddingTop: 14, paddingBottom: 2 },
    exitLinkText: { fontSize: 14, color: c.danger, fontWeight: "700" },

    rankRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.borderFaint,
    },
    rankNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    rankNumText: { fontSize: 13, fontWeight: "800", color: c.textMuted },
    rankAction: { flex: 1, fontSize: 14, fontWeight: "600", color: c.text },
    rankZoneBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    rankZoneText: { fontSize: 11, fontWeight: "800" },
    rankDb: { fontSize: 16, fontWeight: "800", minWidth: 56, textAlign: "right" },
    earSafetyBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    earSafetyText: { flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  });
}
