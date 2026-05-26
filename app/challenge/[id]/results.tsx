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
import { ChallengeTabBar } from "../../../src/components/challenge/ChallengeTabBar";
import { SoundMap } from "../../../src/components/challenge/SoundMap";
import { parseSoundMapPoints } from "../../../src/utils/soundMap";
import { GAMIFICATION, SCORING } from "../../../src/config/constants";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import {
  ParachuteDerived,
  deriveFanForce,
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

const G_FORCE_LABELS: Record<
  "none" | "minor" | "serious" | "severe" | "lifeThreatening",
  string
> = {
  none: "No injury risk",
  minor: "Minor injury risk",
  serious: "Serious injury possible",
  severe: "High injury risk",
  lifeThreatening: "Life-threatening",
};

type BreakdownItem = { label: string; value: string; isPenalty?: boolean };

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
  const requiredMeasurements = getActiveMeasurements(challenge, difficulty).filter(
    (measurement) => !EVIDENCE_RECORDERS.has(measurement.recorder) && !measurement.optional,
  );

  if (prototypes.length === 0 || requiredMeasurements.length === 0) {
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

function buildPointsBreakdown(
  prototypeCount: number,
  predictionChars: number,
  reflectionChars: number,
  hasCompleteData: boolean,
  hasEvidence: boolean,
  hasTeamwork: boolean,
  difficulty: string,
  hasTimeExpired: boolean,
): { items: BreakdownItem[]; total: number } {
  const items: BreakdownItem[] = [];
  let pts: number = SCORING.BASE_XP;
  items.push({ label: "Base completion", value: `+${SCORING.BASE_XP}` });

  if (predictionChars >= GAMIFICATION.PREDICTION_MIN_CHARS) {
    pts += SCORING.PREDICTION_BONUS;
    items.push({
      label: "Prediction made",
      value: `+${SCORING.PREDICTION_BONUS}`,
    });
  }

  if (prototypeCount >= 2) {
    const bonus =
      SCORING.MULTI_DESIGN_2 + (prototypeCount >= 3 ? SCORING.MULTI_DESIGN_3 : 0);
    pts += bonus;
    items.push({ label: `Multiple designs (×${prototypeCount})`, value: `+${bonus}` });
  }

  if (hasCompleteData) {
    pts += SCORING.DATA_QUALITY;
    items.push({
      label: "Complete data set",
      value: `+${SCORING.DATA_QUALITY}`,
    });
  }

  if (reflectionChars > GAMIFICATION.REFLECTION_THRESHOLD_1) {
    pts += SCORING.REFLECTION_BONUS_1;
    items.push({
      label: "Detailed observations",
      value: `+${SCORING.REFLECTION_BONUS_1}`,
    });
  }

  if (reflectionChars > GAMIFICATION.REFLECTION_THRESHOLD_2) {
    pts += SCORING.REFLECTION_BONUS_2;
    items.push({
      label: "Strong reflection",
      value: `+${SCORING.REFLECTION_BONUS_2}`,
    });
  }

  if (hasEvidence) {
    pts += SCORING.EVIDENCE_BONUS;
    items.push({
      label: "Evidence attached",
      value: `+${SCORING.EVIDENCE_BONUS}`,
    });
  }

  if (hasTeamwork) {
    pts += SCORING.TEAMWORK_BONUS;
    items.push({
      label: "Teamwork evidence",
      value: `+${SCORING.TEAMWORK_BONUS}`,
    });
  }

  if (difficulty === "highSchool") {
    pts = Math.floor(pts * SCORING.HIGH_SCHOOL_MULTIPLIER);
    items.push({ label: "High school multiplier", value: "x1.3" });
  }

  if (hasTimeExpired) {
    pts = Math.floor(pts * SCORING.TIME_PENALTY_MULTIPLIER);
    items.push({ label: "Time penalty", value: "-20%", isPenalty: true });
  }

  return { items, total: pts };
}

export default function ResultsScreen() {
  const { id, timeExpired } = useLocalSearchParams<{
    id: string;
    timeExpired?: string;
  }>();

  const challenge = getChallengeById(Number(id));
  const { draft, finalize, clearDraft, updatePrototype } = useActivity();
  const { team, updateTeamPoints } = useTeam();

  const [observations, setObservations] = useState<Record<number, string>>({});
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
  const hasCompleteData = hasCompleteRequiredData(
    challenge,
    draft.prototypes,
    scoringDifficulty,
  );
  const hasEvidence = hasEvidenceAttached(
    challenge,
    draft.prototypes,
    scoringDifficulty,
    !!draft.location,
  );
  const hasTeamwork = hasTeamworkEvidence(draft.prototypes);

  const { items: breakdownItems, total: predictedPoints } = useMemo(
    () =>
      buildPointsBreakdown(
        draft.prototypes.length,
        getPredictionCharsFromPrototypes(draft.prototypes),
        totalReflectionChars,
        hasCompleteData,
        hasEvidence,
        hasTeamwork,
        scoringDifficulty,
        hasTimeExpired,
      ),
    [
      draft.prototypes.length,
      draft.prototypes,
      totalReflectionChars,
      hasCompleteData,
      hasEvidence,
      hasTeamwork,
      scoringDifficulty,
      hasTimeExpired,
    ],
  );

  if (!challenge || !team) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isReadyToSubmit = () =>
    rating > 0 &&
    visibleObservationQuestions.every(
      (_, i) =>
        (observations[i] ?? "").trim().length >=
        GAMIFICATION.OBSERVATION_MIN_CHARS,
    );

  const handleSubmit = async () => {
    if (!isReadyToSubmit()) {
      Alert.alert(
        "Not quite done",
        "Answer the reflection questions and choose a rating.",
      );
      return;
    }

    setIsSubmitting(true);

    const result = await finalize({
      rating: rating as 1 | 2 | 3 | 4 | 5,
      reflection: combinedReflection,
      completedInTime: !hasTimeExpired,
    });

    if (result) {
      await updateTeamPoints(predictedPoints);
      await storage.updateStreak();

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
    }

    setIsSubmitting(false);
  };

  const fanPhysics =
    challenge.id === 3
      ? draft.prototypes.map((p) => ({
          designName: String(p.measurements.designName ?? `Design ${p.index + 1}`),
          material: String(p.measurements.material ?? ""),
          bendAngle: parseFloat(String(p.measurements.bendAngle ?? "")),
          force: deriveFanForce(
            String(p.measurements.material ?? ""),
            parseFloat(String(p.measurements.bendAngle ?? "")),
          ),
        }))
      : null;

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
          <Ionicons name={challenge.icon as any} size={36} color="#2563EB" />
        </View>
        <Text style={styles.headerTitle}>Step 3: Reflect</Text>
        <Text style={styles.headerSubtitle}>{challenge.title}</Text>
      </View>

      {hasTimeExpired && (
        <View style={styles.penaltyBanner}>
          <Ionicons name="alarm-outline" size={22} color="#DC2626" />
          <View>
            <Text style={styles.penaltyText}>Time expired</Text>
            <Text style={styles.penaltySubtext}>20% point penalty applied</Text>
          </View>
        </View>
      )}

      {draft.prototypes.length > 0 && tableKeys.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bar-chart-outline" size={16} color="#0F172A" />
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

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="help-circle-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Attempt Review</Text>
        </View>
        {draft.prototypes.map((prototype, idx) => {
          const predictionDisplay = formatPredictionDisplay(challenge.id, prototype);
          const outcomeText = getPrototypeOutcomeText(challenge.id, prototype);
          const selected = wereYouRightByPrototype[prototype.index];

          return (
            <View key={prototype.index} style={styles.attemptCard}>
              <Text style={styles.attemptTitle}>#{idx + 1}</Text>
              <Text style={styles.attemptLine}>
                Outcome: {outcomeText || "Not recorded"}
              </Text>
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

      {soundMapPoints.length > 0 && (
        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <Ionicons name="volume-high-outline" size={15} color="#0F766E" />
            <Text style={styles.mapCardTitle}>Sound Pollution Zone Map</Text>
          </View>
          <SoundMap points={soundMapPoints} />
        </View>
      )}

      {hasVideoEvidence && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="videocam-outline" size={16} color="#0F172A" />
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

      {fanPhysics && fanPhysics.some((f) => f.force != null) && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="flask-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Air Force Calculations</Text>
          </View>
          <Text style={styles.physicsRow}>
            Formula: F ≈ k · θ  (stiffness × bend angle in radians)
          </Text>

          {fanPhysics.map((f, i) => (
            <View key={i} style={styles.physicsBlock}>
              <Text style={styles.physicsBlockLabel}>{f.designName}</Text>
              {f.material !== "" && (
                <Text style={styles.physicsRow}>Material: {f.material}</Text>
              )}
              {!isNaN(f.bendAngle) && f.bendAngle > 0 && (
                <Text style={styles.physicsRow}>
                  Bend angle: {f.bendAngle}° = {((f.bendAngle * Math.PI) / 180).toFixed(3)} rad
                </Text>
              )}
              {f.force != null && (
                <Text style={styles.physicsRow}>
                  Estimated air force: {f.force.toFixed(4)} N
                </Text>
              )}
            </View>
          ))}

          {fanPhysics.filter((f) => f.force != null).length > 1 && (() => {
            const sorted = [...fanPhysics]
              .filter((f) => f.force != null)
              .sort((a, b) => (b.force ?? 0) - (a.force ?? 0));
            return (
              <View style={[styles.physicsBlock, { marginTop: 8 }]}>
                <Text style={styles.physicsBlockLabel}>Ranking (most air force first)</Text>
                {sorted.map((f, i) => (
                  <Text key={i} style={styles.physicsRow}>
                    {i + 1}. {f.designName} — {f.force!.toFixed(4)} N
                  </Text>
                ))}
              </View>
            );
          })()}
        </View>
      )}

      {parachutePhysics && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="flask-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Physics Calculations</Text>
          </View>

          {parachutePhysics.map((calc, i) => (
            <View key={i} style={styles.physicsBlock}>
              <Text style={styles.physicsBlockLabel}>Design #{i + 1}</Text>

              {calc.finalVelocity != null && (
                <Text style={styles.physicsRow}>
                  Final velocity: {calc.finalVelocity.toFixed(2)} m/s
                </Text>
              )}

              {calc.acceleration != null && (
                <Text style={styles.physicsRow}>
                  Acceleration: {calc.acceleration.toFixed(2)} m/s²
                </Text>
              )}

              {calc.netForce != null && (
                <Text style={styles.physicsRow}>
                  Net force: {calc.netForce.toFixed(3)} N
                </Text>
              )}

              {calc.dragForce != null && (
                <Text style={styles.physicsRow}>
                  Drag force: {calc.dragForce.toFixed(3)} N
                </Text>
              )}

              {calc.gForce != null && (
                <Text style={styles.physicsRow}>
                  G-force on impact: {calc.gForce.toFixed(1)} g —{" "}
                  <Text style={styles.physicsRisk}>
                    {G_FORCE_LABELS[gForceRiskCategory(calc.gForce)]}
                  </Text>
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {draft.location && (
        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <Ionicons name="location" size={15} color="#0F766E" />
            <Text style={styles.mapCardTitle}>Experiment Location</Text>
            <View style={styles.gpsBonusBadge}>
              <Text style={styles.gpsBonusText}>+{SCORING.EVIDENCE_BONUS} XP</Text>
            </View>
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
          <Ionicons name="document-text-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Reflect</Text>
        </View>

        <Text style={styles.observationsSubtitle}>
          Short answers are fine. Start with these questions.
        </Text>

        {visibleObservationQuestions.map((question, i) => (
          <View key={i} style={styles.observationField}>
            <Text style={styles.observationQuestion}>{question}</Text>

            <TextInput
              style={[
                styles.observationInput,
                (observations[i] ?? "").trim().length >= 5 &&
                  styles.observationInputValid,
              ]}
              placeholder="Write your answer here..."
              placeholderTextColor="#94A3B8"
              value={observations[i] ?? ""}
              onChangeText={(v) =>
                setObservations((prev) => ({ ...prev, [i]: v }))
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        ))}

        {observationQuestions.length > 3 && (
          <TouchableOpacity
            style={styles.moreQuestionsBtn}
            onPress={() => setShowAllQuestions((value) => !value)}
            activeOpacity={0.75}
          >
            <Text style={styles.moreQuestionsText}>
              {showAllQuestions ? "Show fewer questions" : "Add more reflection"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="star-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Rate it</Text>
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
                size={40}
                color={rating >= s ? "#FBBF24" : "#CBD5E1"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ratingNote}>
          <Text style={styles.ratingNoteText}>
            Your rating helps improve the activity. It does not change XP.
          </Text>
        </View>
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsTitle}>Points Breakdown</Text>

        {breakdownItems.map((item) => (
          <PointsRow
            key={item.label}
            label={item.label}
            value={item.value}
            isPenalty={item.isPenalty}
          />
        ))}

        <View style={styles.pointsDivider} />

        <View style={styles.pointsTotalRow}>
          <Text style={styles.pointsTotalLabel}>Total XP</Text>
          <Text style={styles.pointsTotalValue}>{predictedPoints}</Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.claimBtn,
          (!isReadyToSubmit() || isSubmitting) && styles.claimBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!isReadyToSubmit() || isSubmitting}
      >
        <Text style={styles.claimBtnText}>
          {isSubmitting ? "Submitting..." : `Claim +${predictedPoints} XP`}
        </Text>
      </Pressable>

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
        <Text style={styles.redoLinkText}>↺ Redo the experiment</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function PointsRow({
  label,
  value,
  isPenalty,
}: {
  label: string;
  value: string;
  isPenalty?: boolean;
}) {
  return (
    <View style={styles.pointsRow}>
      <Text style={[styles.pointsLabel, isPenalty && styles.penaltyText]}>
        {label}
      </Text>
      <Text style={[styles.pointsValue, isPenalty && styles.penaltyText]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { paddingTop: 16, paddingBottom: 40 },

  loadingText: {
    textAlign: "center",
    marginTop: 80,
    fontSize: 16,
    color: "#64748B",
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
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#2563EB",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  headerSubtitle: { fontSize: 14, color: "#64748B", marginTop: 2 },

  penaltyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  penaltyText: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
  penaltySubtext: { color: "#991B1B", fontSize: 12, marginTop: 2 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
    color: "#0F172A",
  },

  predictionBubble: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 14,
  },
  predictionText: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
    lineHeight: 20,
  },
  attemptCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 10,
  },
  attemptTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  attemptLine: { fontSize: 13, color: "#334155", marginBottom: 4 },
  attemptPrompt: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginTop: 6,
    marginBottom: 6,
  },
  rightRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  rightChoice: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  rightChoiceActive: {
    backgroundColor: "#0F766E",
    borderColor: "#0F766E",
  },
  rightChoiceText: { fontSize: 12, color: "#475569", fontWeight: "700" },
  rightChoiceTextActive: { color: "#FFFFFF" },
  attemptNoteInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 54,
    fontSize: 12,
    color: "#0F172A",
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tableHeaderRow: { borderBottomWidth: 2, borderBottomColor: "#E2E8F0" },
  tableRowAlt: { backgroundColor: "#F8FAFC" },
  tableCell: { flex: 1, fontSize: 12, color: "#334155", textAlign: "center" },
  designCell: { flex: 1.2, textAlign: "left" },
  tableCellBold: { fontWeight: "700", color: "#0F172A" },
  tableHeaderCell: { fontWeight: "700", color: "#64748B", fontSize: 11 },

  mediaSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: -6,
    marginBottom: 12,
  },
  mediaBlock: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mediaLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  mediaVideo: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#000",
  },

  physicsBlock: {
    borderLeftWidth: 3,
    borderLeftColor: "#2563EB",
    paddingLeft: 12,
    marginBottom: 14,
  },
  physicsBlockLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  physicsRow: { fontSize: 13, color: "#334155", marginBottom: 2 },
  physicsRisk: { fontWeight: "700", color: "#DC2626" },

  mapCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  mapCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#EFF6FF",
  },
  mapCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F766E",
  },
  gpsBonusBadge: {
    backgroundColor: "#0F766E",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  gpsBonusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  mapCoords: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
  },

  observationsSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
    marginTop: -6,
  },
  observationField: { marginBottom: 16 },
  observationQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    lineHeight: 20,
  },
  observationInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  observationInputValid: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  moreQuestionsBtn: {
    alignSelf: "center",
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFEDD5",
  },
  moreQuestionsText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F97316",
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
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  ratingNoteText: { fontSize: 13, color: "#0F766E", fontWeight: "700" },

  pointsCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  pointsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
  pointsLabel: { fontSize: 14, color: "#374151" },
  pointsValue: { fontSize: 14, fontWeight: "700", color: "#2563EB" },
  pointsDivider: {
    height: 1,
    backgroundColor: "#BFDBFE",
    marginVertical: 10,
  },
  pointsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsTotalLabel: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  pointsTotalValue: { fontSize: 32, fontWeight: "800", color: "#2563EB" },

  claimBtn: {
    backgroundColor: "#F97316",
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  claimBtnDisabled: { backgroundColor: "#CBD5E1" },
  claimBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  redoLink: { alignItems: "center", paddingVertical: 16 },
  redoLinkText: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  exitLink: { alignItems: "center", paddingTop: 14, paddingBottom: 2 },
  exitLinkText: { fontSize: 14, color: "#B91C1C", fontWeight: "700" },

});
