// app/challenge/[id]/results.tsx
// The "Reflect" screen — students review their results, answer observation
// questions, rate the activity, then claim their XP reward.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
import { GAMIFICATION, SCORING } from "../../../src/config/constants";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import {
  ParachuteDerived,
  deriveParachute,
  gForceRiskCategory,
} from "../../../src/services/physics";
import { storage } from "../../../src/utils/storage";

export default function ResultsScreen() {
  const { id, timeExpired } = useLocalSearchParams<{
    id: string;
    timeExpired?: string;
  }>();
  const challenge = getChallengeById(Number(id));
  const { draft, finalize, clearDraft } = useActivity();
  const { team, updateTeamPoints } = useTeam();

  // Observation answers — one per question (keyed by question index)
  const [observations, setObservations] = useState<Record<number, string>>({});

  // Star rating selected by the team (1–5)
  const [rating, setRating] = useState(0);

  // Tracks whether the form is being submitted
  const [isSubmitting, setIsSubmitting] = useState(false);

  // True if the challenge timer ran out before they finished
  const hasTimeExpired = timeExpired === "true";

  // Safety check
  if (!challenge || !team) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Use the challenge's own questions, or fall back to generic ones
  const observationQuestions = challenge.observationQuestions ?? [
    "What did you observe during the experiment?",
    "Were your predictions correct? What was different?",
    "What would you change if you ran the experiment again?",
  ];

  // Total characters written across all observation answers
  const totalReflectionChars = Object.values(observations).join(" ").length;

  // Combine all answers into one block for saving
  const combinedReflection = observationQuestions
    .map((q, i) => `${q}\n${observations[i] ?? ""}`)
    .join("\n\n");

  // Work out how many XP points this attempt is worth
  const calculatePoints = () => {
    let pts = SCORING.BASE_XP;

    if (draft.prototypes.length >= 2) pts += SCORING.MULTI_DESIGN_2;
    if (draft.prototypes.length >= 3) pts += SCORING.MULTI_DESIGN_3;
    if (rating >= 4) pts += SCORING.HIGH_RATING_4;
    if (rating === 5) pts += SCORING.HIGH_RATING_5;
    if (totalReflectionChars > GAMIFICATION.REFLECTION_THRESHOLD_1)
      pts += SCORING.REFLECTION_BONUS;
    if (totalReflectionChars > GAMIFICATION.REFLECTION_THRESHOLD_2)
      pts += SCORING.REFLECTION_BONUS;
    if (draft.location) pts += SCORING.GPS_TAGGED;
    if (draft.difficulty === "highSchool")
      pts = Math.floor(pts * SCORING.HIGH_SCHOOL_MULTIPLIER);
    if (hasTimeExpired)
      pts = Math.floor(pts * SCORING.TIME_PENALTY_MULTIPLIER);

    return pts;
  };

  // Check the form is complete enough to submit
  const isReadyToSubmit = () =>
    rating > 0 &&
    observationQuestions.every(
      (_, i) =>
        (observations[i] ?? "").trim().length >=
        GAMIFICATION.OBSERVATION_MIN_CHARS
    );

  const handleSubmit = async () => {
    if (!isReadyToSubmit()) {
      Alert.alert(
        "Not quite done",
        "Please answer all observation questions (5+ characters each) and rate the activity."
      );
      return;
    }

    setIsSubmitting(true);

    const points = calculatePoints();

    // Save the completed activity and update team points
    const result = await finalize({
      rating: rating as 1 | 2 | 3 | 4 | 5,
      reflection: combinedReflection,
      completedInTime: !hasTimeExpired,
    });

    if (result) {
      await updateTeamPoints(points);
      await storage.updateStreak();

      Alert.alert(
        "🎉 CHALLENGE COMPLETE!",
        `✨ +${points} XP earned!\n\nGreat science, team!`,
        [
          {
            text: "Awesome!",
            onPress: () => {
              clearDraft();
              router.replace("/(tabs)/activity");
            },
          },
        ]
      );
    }

    setIsSubmitting(false);
  };

  // Points preview shown before submitting
  const predictedPoints = calculatePoints();

  // Physics calculations for the Parachute challenge (high school mode only)
  const parachutePhysics: ParachuteDerived[] | null =
    challenge.id === 1 && draft.difficulty === "highSchool"
      ? draft.prototypes.map((p) =>
          deriveParachute({
            dropHeightMeters: parseFloat(
              String(p.measurements.dropHeightMeters ?? "")
            ),
            fallTimeSeconds: parseFloat(
              String(p.measurements.fallTimeSeconds ?? "")
            ),
            toyMassKg:
              parseFloat(String(p.measurements.toyMassKg ?? "")) || undefined,
            contactTimeSeconds:
              parseFloat(String(p.measurements.contactTimeSeconds ?? "")) ||
              undefined,
            bounced: String(p.measurements.bounced) === "Yes",
          })
        )
      : null;

  // Columns to show in the results table (skip GPS, video, photo etc.)
  const tableKeys = challenge.measurements
    .filter(
      (m) =>
        !["gps", "video", "photo", "videoAnalyzer", "slowMotion", "teamReaction"].includes(
          m.recorder
        )
    )
    .slice(0, 3);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ── Tab bar ── */}
      <ChallengeTabBar
        active="reflect"
        onBrief={() => router.push(`/challenge/${challenge.id}`)}
        onDoit={() => router.back()}
        onReflect={() => {}}
        doitEnabled={true}
        reflectEnabled={true}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerIconCircle}>
          <Ionicons name={challenge.icon as any} size={36} color="#22C55E" />
        </View>
        <Text style={styles.headerTitle}>Reflect</Text>
        <Text style={styles.headerSubtitle}>{challenge.title}</Text>
      </View>

      {/* ── Time penalty banner ── */}
      {hasTimeExpired && (
        <View style={styles.penaltyBanner}>
          <Ionicons name="alarm-outline" size={22} color="#DC2626" />
          <View>
            <Text style={styles.penaltyText}>Time expired</Text>
            <Text style={styles.penaltySubtext}>20% point penalty applied</Text>
          </View>
        </View>
      )}

      {/* ── Prediction recap ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="help-circle-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Your Prediction</Text>
        </View>
        <View style={styles.predictionBubble}>
          <Text style={styles.predictionText}>
            {draft.prediction || "Not recorded"}
          </Text>
        </View>
      </View>

      {/* ── Results table ── */}
      {draft.prototypes.length > 0 && tableKeys.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bar-chart-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Results</Text>
          </View>

          {/* Header row */}
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <Text style={[styles.tableCell, styles.tableHeaderCell, styles.designCell]}>
              Design
            </Text>
            {tableKeys.map((k) => (
              <Text key={k.key} style={[styles.tableCell, styles.tableHeaderCell]}>
                {k.label}{k.unit ? ` (${k.unit})` : ""}
              </Text>
            ))}
          </View>

          {/* Data rows */}
          {draft.prototypes.map((p, idx) => (
            <View
              key={p.index}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.designCell, styles.tableCellBold]}>
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

      {/* ── Physics calculations (Parachute + high school only) ── */}
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
              {calc.gForce != null && (
                <Text style={styles.physicsRow}>
                  G-force on impact: {calc.gForce.toFixed(1)} g —{" "}
                  <Text style={styles.physicsRisk}>
                    {gForceRiskCategory(calc.gForce) === "none" && "No injury risk"}
                    {gForceRiskCategory(calc.gForce) === "minor" && "Minor injury risk"}
                    {gForceRiskCategory(calc.gForce) === "serious" && "Serious injury possible"}
                    {gForceRiskCategory(calc.gForce) === "severe" && "High injury risk"}
                    {gForceRiskCategory(calc.gForce) === "lifeThreatening" && "Life-threatening"}
                  </Text>
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ── GPS location tag ── */}
      {draft.location && (
        <View style={styles.gpsTag}>
          <Ionicons name="location-outline" size={14} color="#166534" />
          <Text style={styles.gpsText}>
            {draft.location.lat.toFixed(4)}, {draft.location.lng.toFixed(4)}
          </Text>
        </View>
      )}

      {/* ── Observation questions ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="document-text-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Your Observations</Text>
        </View>
        <Text style={styles.observationsSubtitle}>
          Answer each question as a team
        </Text>
        {observationQuestions.map((question, i) => (
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
      </View>

      {/* ── Star rating ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="star-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Rate this activity</Text>
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
        {rating >= 4 && (
          <View style={styles.ratingBonus}>
            <Text style={styles.ratingBonusText}>
              +{SCORING.HIGH_RATING_4 + (rating === 5 ? SCORING.HIGH_RATING_5 : 0)} XP bonus!
            </Text>
          </View>
        )}
      </View>

      {/* ── Points breakdown ── */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsTitle}>Points Breakdown</Text>

        <PointsRow label="Base completion" value={`+${SCORING.BASE_XP}`} />
        {draft.prototypes.length >= 2 && (
          <PointsRow
            label={`Multiple designs (×${draft.prototypes.length})`}
            value={`+${SCORING.MULTI_DESIGN_2 + (draft.prototypes.length >= 3 ? SCORING.MULTI_DESIGN_3 : 0)}`}
          />
        )}
        {rating >= 4 && (
          <PointsRow
            label={`High rating (${rating}★)`}
            value={`+${SCORING.HIGH_RATING_4 + (rating === 5 ? SCORING.HIGH_RATING_5 : 0)}`}
          />
        )}
        {totalReflectionChars > GAMIFICATION.REFLECTION_THRESHOLD_1 && (
          <PointsRow
            label="Detailed observations"
            value={`+${SCORING.REFLECTION_BONUS + (totalReflectionChars > GAMIFICATION.REFLECTION_THRESHOLD_2 ? SCORING.REFLECTION_BONUS : 0)}`}
          />
        )}
        {draft.location && (
          <PointsRow label="GPS tagged" value={`+${SCORING.GPS_TAGGED}`} />
        )}
        {draft.difficulty === "highSchool" && (
          <PointsRow label="High school multiplier" value="×1.5" />
        )}
        {hasTimeExpired && (
          <PointsRow label="⏰ Time penalty" value="-20%" isPenalty />
        )}

        <View style={styles.pointsDivider} />

        <View style={styles.pointsTotalRow}>
          <Text style={styles.pointsTotalLabel}>Total XP</Text>
          <Text style={styles.pointsTotalValue}>{predictedPoints}</Text>
        </View>
      </View>

      {/* ── Claim reward button ── */}
      <Pressable
        style={[
          styles.claimBtn,
          (!isReadyToSubmit() || isSubmitting) && styles.claimBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!isReadyToSubmit() || isSubmitting}
      >
        <Text style={styles.claimBtnText}>
          {isSubmitting
            ? "Submitting..."
            : `CLAIM REWARD  +${predictedPoints} XP`}
        </Text>
      </Pressable>

      {/* ── Redo link ── */}
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
            ]
          );
        }}
      >
        <Text style={styles.redoLinkText}>↺ Redo the experiment</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ── Small helper: one row in the points breakdown table ─────────────────────
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

// --- Styles ---
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { paddingTop: 16, paddingBottom: 40 },

  loadingText: {
    textAlign: "center",
    marginTop: 80,
    fontSize: 16,
    color: "#64748B",
  },

  // Header
  header: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#22C55E",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  headerSubtitle: { fontSize: 14, color: "#64748B", marginTop: 2 },

  // Time penalty banner
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

  // Generic white card
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

  // Prediction
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

  // Results table
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

  // Physics
  physicsBlock: {
    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
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

  // GPS tag
  gpsTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  gpsText: { fontSize: 13, color: "#166534", fontWeight: "600" },

  // Observations
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
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },

  // Stars
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  ratingBonus: {
    alignSelf: "center",
    marginTop: 10,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ratingBonusText: { fontSize: 13, color: "#166534", fontWeight: "700" },

  // Points card (dark)
  pointsCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  pointsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
  pointsLabel: { fontSize: 14, color: "#CBD5E1" },
  pointsValue: { fontSize: 14, fontWeight: "700", color: "#22C55E" },
  pointsDivider: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 10,
  },
  pointsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsTotalLabel: { fontSize: 15, fontWeight: "700", color: "#F8FAFC" },
  pointsTotalValue: { fontSize: 32, fontWeight: "800", color: "#22C55E" },

  // Claim button
  claimBtn: {
    backgroundColor: "#22C55E",
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

  // Redo link
  redoLink: { alignItems: "center", paddingVertical: 16 },
  redoLinkText: { fontSize: 14, color: "#64748B", fontWeight: "600" },
});
