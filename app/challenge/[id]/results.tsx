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
import { ChallengeTabBar } from "../../../src/components/challenge/ChallengeTabBar";
import { GPSMapView } from "../../../src/components/challenge/GPSMapView";
import { SoundMap } from "../../../src/components/challenge/SoundMap";
import { parseSoundMapPoints } from "../../../src/utils/soundMap";
import { checkNewBadges } from "../../../src/config/badges";
import { GAMIFICATION, SCORING } from "../../../src/config/constants";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import {
  buildChallengePointsBreakdown,
  buildPointsInputFromDraft,
} from "../../../src/services/challengeScoring";
import {
  ParachuteDerived,
  deriveParachute,
  gForceRiskCategory,
} from "../../../src/services/physics";
import { storage } from "../../../src/utils/storage";

const MATERIAL_STIFFNESS: Record<string, number> = {
  "Thin printer paper": 0.05,
  "Standard card stock": 0.2,
  "Thin cardboard": 0.5,
  "Corrugated cardboard": 2.5,
};

function deriveFanForce(material: string, bendAngleDeg: number): number | null {
  const k = MATERIAL_STIFFNESS[material];
  if (!k || isNaN(bendAngleDeg) || bendAngleDeg <= 0) return null;
  const thetaRad = (bendAngleDeg * Math.PI) / 180;
  return k * thetaRad;
}

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

export default function ResultsScreen() {
  const { id, timeExpired } = useLocalSearchParams<{
    id: string;
    timeExpired?: string;
  }>();

  const challenge = getChallengeById(Number(id));
  const { draft, finalize, clearDraft } = useActivity();
  const { team, updateTeamPoints } = useTeam();

  const [observations, setObservations] = useState<Record<number, string>>({});
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasTimeExpired = timeExpired === "true";

  const observationQuestions = challenge?.observationQuestions ?? [
    "What did you observe during the experiment?",
    "Were your predictions correct? What was different?",
    "What would you change if you ran the experiment again?",
  ];

  const combinedReflection = observationQuestions
    .map((q, i) => `${q}\n${observations[i] ?? ""}`)
    .join("\n\n");
  const totalReflectionChars = combinedReflection.length;

  const scoringDifficulty = draft.difficulty ?? "primary";

  const { items: breakdownItems, total: predictedPoints } = useMemo(() => {
    const input = buildPointsInputFromDraft({
      challengeId: challenge?.id ?? Number(id),
      difficulty: scoringDifficulty,
      prototypes: draft.prototypes,
      reflectionChars: totalReflectionChars,
      draftLocation: draft.location,
      completedInTime: !hasTimeExpired,
    });
    return buildChallengePointsBreakdown(input);
  }, [
    challenge?.id,
    id,
    draft.prototypes,
    draft.location,
    totalReflectionChars,
    scoringDifficulty,
    hasTimeExpired,
  ]);

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
      blockers.push("Select a star rating (1–5 stars).");
    }
    observationQuestions.forEach((_, i) => {
      const len = (observations[i] ?? "").trim().length;
      if (len < GAMIFICATION.OBSERVATION_MIN_CHARS) {
        blockers.push(
          `Question ${i + 1}: write at least ${GAMIFICATION.OBSERVATION_MIN_CHARS} characters (${len}/${GAMIFICATION.OBSERVATION_MIN_CHARS}).`,
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
        reflection: combinedReflection,
        completedInTime: !hasTimeExpired,
      });

      if (!result) {
        Alert.alert("Could not claim reward", describeFinalizeFailure());
        return;
      }

      const earnedPoints = result.points ?? 0;
      try {
        await updateTeamPoints(earnedPoints);
      } catch (e) {
        console.warn("Failed to update team points after save:", e);
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
        "Challenge Complete!",
        `+${earnedPoints} XP earned!\n\nGreat science, team!`,
        [
          {
            text: "Awesome!",
            onPress: () => {
              clearDraft();
              router.replace("/(tabs)/activity");
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
              parseFloat(String(p.measurements.contactTimeSeconds ?? "")) ||
              undefined,
            bounced: String(p.measurements.bounced) === "Yes",
          }),
        )
      : null;

  const movementAnalysis =
    challenge.id === 5
      ? draft.prototypes
          .map((p, index) => ({
            label: String(p.measurements.movementType ?? `Trial ${index + 1}`),
            smoothness: parseFloat(String(p.measurements.smoothness ?? "")),
            peakRotation: parseFloat(
              String(p.measurements.smoothnessPeakRotation ?? ""),
            ),
          }))
          .filter(
            (item) => !isNaN(item.smoothness) || !isNaN(item.peakRotation),
          )
      : [];

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

  const hasVideoEvidence = draft.prototypes.some((p) => p.measurements.video);

  const soundMapPoints = parseSoundMapPoints(challenge.id, draft.prototypes);

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
          <Ionicons name={challenge.icon as any} size={36} color="#2F80ED" />
        </View>
        <Text style={styles.headerTitle}>Reflect</Text>
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

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="help-circle-outline" size={16} color="#12343B" />
          <Text style={styles.cardTitle}>Your Prediction</Text>
        </View>
        <View style={styles.predictionBubble}>
          <Text style={styles.predictionText}>
            {draft.prediction || "Not recorded"}
          </Text>
        </View>
      </View>

      {draft.prototypes.length > 0 && tableKeys.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bar-chart-outline" size={16} color="#12343B" />
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

      {soundMapPoints.length > 0 && (
        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <Ionicons name="volume-high-outline" size={15} color="#007C7A" />
            <Text style={styles.mapCardTitle}>Sound Pollution Zone Map</Text>
          </View>
          <SoundMap points={soundMapPoints} />
        </View>
      )}

      {movementAnalysis.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="sync-outline" size={16} color="#12343B" />
            <Text style={styles.cardTitle}>Movement Control</Text>
          </View>

          {movementAnalysis.map((movement, index) => (
            <View key={index} style={styles.physicsBlock}>
              <Text style={styles.physicsBlockLabel}>{movement.label}</Text>
              {!isNaN(movement.smoothness) && (
                <Text style={styles.physicsRow}>
                  Smoothness score: {movement.smoothness.toFixed(0)}%
                </Text>
              )}
              {!isNaN(movement.peakRotation) && (
                <Text style={styles.physicsRow}>
                  Peak rotation: {movement.peakRotation.toFixed(2)} rad/s
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {hasVideoEvidence && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="videocam-outline" size={16} color="#12343B" />
            <Text style={styles.cardTitle}>Media Evidence</Text>
          </View>

          <Text style={styles.mediaSubtitle}>
            Review the experiment videos attached by your team.
          </Text>

          {draft.prototypes.map((p, index) => {
            const videoUri = p.measurements.video;

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
            <Ionicons name="flask-outline" size={16} color="#12343B" />
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
            <Ionicons name="flask-outline" size={16} color="#12343B" />
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
            <Ionicons name="location" size={15} color="#007C7A" />
            <Text style={styles.mapCardTitle}>Experiment Location</Text>
            <View style={styles.gpsBonusBadge}>
              <Text style={styles.gpsBonusText}>+{SCORING.EVIDENCE_BONUS} XP</Text>
            </View>
          </View>

          <GPSMapView lat={draft.location.lat} lng={draft.location.lng} />

          <Text style={styles.mapCoords}>
            {draft.location.lat.toFixed(5)}, {draft.location.lng.toFixed(5)}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="document-text-outline" size={16} color="#12343B" />
          <Text style={styles.cardTitle}>Your Observations</Text>
        </View>

        <Text style={styles.observationsSubtitle}>
          Answer each question as a team (at least{" "}
          {GAMIFICATION.OBSERVATION_MIN_CHARS} characters each)
        </Text>

        {observationQuestions.map((question, i) => {
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
              placeholderTextColor="#94A3B8"
              value={observations[i] ?? ""}
              onChangeText={(v) =>
                setObservations((prev) => ({ ...prev, [i]: v }))
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text
              style={[
                styles.observationCount,
                answerReady && styles.observationCountReady,
              ]}
            >
              {answerLen}/{GAMIFICATION.OBSERVATION_MIN_CHARS} characters
            </Text>
          </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="star-outline" size={16} color="#12343B" />
          <Text style={styles.cardTitle}>Rate this activity (required)</Text>
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
        disabled={isSubmitting}
      >
        <Text style={styles.claimBtnText}>
          {isSubmitting
            ? "Submitting..."
            : `CLAIM REWARD  +${predictedPoints} XP`}
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
                text: "Save Draft & Exit",
                onPress: () => {
                  router.replace("/(tabs)/activity");
                },
              },
            ],
          );
        }}
      >
        <Text style={styles.exitLinkText}>Save Draft & Exit</Text>
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
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#2F80ED",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#12343B" },
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
    color: "#12343B",
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
  tableCellBold: { fontWeight: "700", color: "#12343B" },
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
    color: "#12343B",
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
    borderLeftColor: "#2F80ED",
    paddingLeft: 12,
    marginBottom: 14,
  },
  physicsBlockLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#12343B",
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
    borderColor: "#BFD8FF",
  },
  mapCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#EEF5FF",
  },
  mapCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#007C7A",
  },
  gpsBonusBadge: {
    backgroundColor: "#2F80ED",
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
    color: "#12343B",
    backgroundColor: "#F8FAFC",
  },
  observationInputValid: {
    borderColor: "#2F80ED",
    backgroundColor: "#EEF5FF",
  },
  observationCount: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 6,
    textAlign: "right",
  },
  observationCountReady: { color: "#2F80ED", fontWeight: "600" },

  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  ratingNote: {
    alignSelf: "center",
    marginTop: 10,
    backgroundColor: "#EEF5FF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  ratingNoteText: { fontSize: 13, color: "#007C7A", fontWeight: "700" },

  pointsCard: {
    backgroundColor: "#EEF5FF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2F80ED",
  },
  pointsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2F80ED",
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
  pointsValue: { fontSize: 14, fontWeight: "700", color: "#2F80ED" },
  pointsDivider: {
    height: 1,
    backgroundColor: "#BFD8FF",
    marginVertical: 10,
  },
  pointsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsTotalLabel: { fontSize: 15, fontWeight: "700", color: "#12343B" },
  pointsTotalValue: { fontSize: 32, fontWeight: "800", color: "#2F80ED" },

  claimBtn: {
    backgroundColor: "#2F80ED",
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
  claimHint: {
    marginHorizontal: 20,
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  redoLink: { alignItems: "center", paddingVertical: 16 },
  redoLinkText: { fontSize: 14, color: "#64748B", fontWeight: "600" },
  exitLink: { alignItems: "center", paddingTop: 14, paddingBottom: 2 },
  exitLinkText: { fontSize: 14, color: "#B91C1C", fontWeight: "700" },

});
