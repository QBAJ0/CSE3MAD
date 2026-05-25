// app/challenge/[id]/index.tsx
// The "Brief" screen — shows details about a challenge before students start it.
// Students choose difficulty, read steps, write a prediction, then tap Start.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChallengeTabBar } from "../../../src/components/challenge/ChallengeTabBar";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import {
  buildIncompleteSummary,
  getRequiredMeasurements,
  isPrototypeComplete,
} from "../../../src/utils/challengeRecordValidation";

export default function ChallengeBriefScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = getChallengeById(Number(id));
  const { team } = useTeam();
  const { startDraft, setPrediction, draft } = useActivity();

  // Which difficulty level is selected
  const [difficulty, setDifficulty] = useState<"primary" | "highSchool">(
    "primary"
  );

  // The team's prediction text (optional, earns bonus XP)
  const [prediction, setPredictionText] = useState("");

  // Whether to show all steps or just the first 3
  const [showAllSteps, setShowAllSteps] = useState(false);

  // Whether to show extra detail sections (equipment, science info)
  const [showDetails, setShowDetails] = useState(false);

  // Safety check — shouldn't happen, but handles bad URLs
  if (!challenge) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorText}>Challenge not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // True if this team already has an in-progress draft for this challenge
  const hasDraft =
    draft.challengeId === challenge.id && draft.prototypes.length > 0;

  const draftMeasurements = challenge.measurements.filter(
    (m) => !m.difficulty || m.difficulty === draft.difficulty,
  );
  const requiredForDraft = getRequiredMeasurements(draftMeasurements);
  const reflectReady =
    hasDraft &&
    draft.prototypes.every((p) =>
      isPrototypeComplete(p, requiredForDraft),
    );

  // True if this challenge has a harder high school mode
  const hasHighSchool = challenge.difficultyLevels.includes("highSchool");

  // How many steps to show (all or first 3)
  const visibleSteps = showAllSteps
    ? challenge.instructions
    : challenge.instructions.slice(0, 3);
  const hasMoreSteps = challenge.instructions.length > 3;

  const handleStart = () => {
    if (!team) {
      Alert.alert("No Team", "Please create or join a team first.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create Team",
          onPress: () => router.push("/(onboarding)/register"),
        },
      ]);
      return;
    }

    // Initialise the activity draft in context
    startDraft({
      challengeId: challenge.id,
      teamId: team.discriminator,
      teamName: team.teamName,
      difficulty,
    });

    // Save the prediction if they wrote one
    setPrediction(prediction.trim());

    router.push(`/challenge/${challenge.id}/record`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tab bar (Brief / Do It / Reflect) ── */}
        <ChallengeTabBar
          active="brief"
          onBrief={() => {}}
          onDoit={() => router.push(`/challenge/${challenge.id}/record`)}
          onReflect={() => router.push(`/challenge/${challenge.id}/results`)}
          onReflectDisabledPress={() =>
            Alert.alert(
              hasDraft
                ? "Reflect not ready yet"
                : "Start the challenge first",
              hasDraft
                ? buildIncompleteSummary(draft.prototypes, requiredForDraft)
                : "Complete measurements in Do It before opening Reflect.",
            )
          }
          doitEnabled={hasDraft}
          reflectEnabled={reflectReady}
        />

        {/* ── Hero section ── */}
        <View
          style={[
            styles.hero,
            { backgroundColor: `${challenge.color}18` },
          ]}
        >
          <View style={[styles.heroIconCircle, { backgroundColor: challenge.color + "22" }]}>
            <Ionicons name={challenge.icon as any} size={48} color={challenge.color} />
          </View>

          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: `${challenge.color}25`,
                borderColor: `${challenge.color}55`,
              },
            ]}
          >
            <Text style={[styles.categoryText, { color: challenge.color }]}>
              {challenge.category}
            </Text>
          </View>

          <Text style={styles.heroTitle}>{challenge.title}</Text>

          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="time-outline" size={13} color="#64748B" />
              <Text style={styles.heroBadgeText}>
                {challenge.estimatedMinutes} min
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="refresh-outline" size={13} color="#64748B" />
              <Text style={styles.heroBadgeText}>
                {challenge.maxPrototypes === 1
                  ? "1 design"
                  : `Up to ${challenge.maxPrototypes} designs`}
              </Text>
            </View>
          </View>

          <View style={styles.missionRow}>
            {["Predict", "Test", "Record", "Reflect"].map((label, index) => (
              <View key={label} style={styles.missionChip}>
                <Text style={styles.missionNumber}>{index + 1}</Text>
                <Text style={styles.missionText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Difficulty selector (only if challenge has high school mode) ── */}
        {hasHighSchool && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose your level</Text>
            <View style={styles.diffRow}>
              {/* Primary option */}
              <TouchableOpacity
                style={[
                  styles.diffCard,
                  difficulty === "primary" && styles.diffCardActive,
                ]}
                onPress={() => setDifficulty("primary")}
                activeOpacity={0.8}
              >
                <Ionicons name="school-outline" size={32} color="#64748B" style={styles.diffEmoji} />
                <Text
                  style={[
                    styles.diffLabel,
                    difficulty === "primary" && styles.diffLabelActive,
                  ]}
                >
                  Primary
                </Text>
                <Text style={styles.diffSub}>
                  Measurements &{"\n"}observations
                </Text>
                {difficulty === "primary" && (
                  <View style={styles.diffCheck}>
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              {/* High school option */}
              <TouchableOpacity
                style={[
                  styles.diffCard,
                  difficulty === "highSchool" && styles.diffCardActive,
                ]}
                onPress={() => setDifficulty("highSchool")}
                activeOpacity={0.8}
              >
                <Ionicons name="book-outline" size={32} color="#64748B" style={styles.diffEmoji} />
                <Text
                  style={[
                    styles.diffLabel,
                    difficulty === "highSchool" && styles.diffLabelActive,
                  ]}
                >
                  High School
                </Text>
                <Text style={styles.diffSub}>
                  Calculations +{"\n"}30% more XP
                </Text>
                {difficulty === "highSchool" && (
                  <View style={styles.diffCheck}>
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Steps (show first 3 by default) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start with these steps</Text>
          <View style={styles.stepsCard}>
            {visibleSteps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepNumber,
                    { backgroundColor: challenge.color },
                  ]}
                >
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            {/* Show more / show less toggle */}
            {hasMoreSteps && (
              <TouchableOpacity
                style={styles.showMoreBtn}
                onPress={() => setShowAllSteps((v) => !v)}
                activeOpacity={0.75}
              >
                <Text style={styles.showMoreText}>
                  {showAllSteps
                    ? "▲ Show less"
                    : `Show all ${challenge.instructions.length} steps`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Equipment & science info (collapsed by default) ── */}
        <TouchableOpacity
          style={styles.detailsToggle}
          onPress={() => setShowDetails((v) => !v)}
          activeOpacity={0.75}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? "Hide learn more" : "Learn more"}
          </Text>
        </TouchableOpacity>

        {showDetails && (
          <>
            {/* Equipment list */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="build-outline" size={17} color="#0F172A" />
                <Text style={styles.sectionTitle}>You will need</Text>
              </View>
              <View style={styles.equipRow}>
                {challenge.equipment.map((item, i) => (
                  <View key={i} style={styles.equipChip}>
                    <Text style={styles.equipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Science concept cards */}
            {challenge.thingsToKnow && challenge.thingsToKnow.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="bulb-outline" size={17} color="#0F172A" />
                  <Text style={styles.sectionTitle}>Things to Know</Text>
                </View>
                {challenge.thingsToKnow.map((card, i) => (
                  <View
                    key={i}
                    style={[
                      styles.knowCard,
                      { borderLeftColor: card.color },
                    ]}
                  >
                    <Text
                      style={[styles.knowHeading, { color: card.color }]}
                    >
                      {card.heading}
                    </Text>
                    {card.bullets.map((bullet, j) => (
                      <View key={j} style={styles.bulletRow}>
                        <View
                          style={[
                            styles.bulletDot,
                            { backgroundColor: card.color },
                          ]}
                        />
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Extension tip */}
            {challenge.extensionTip && (
              <View style={styles.extensionBox}>
                <View style={styles.extensionLabelRow}>
                  <Ionicons name="rocket-outline" size={13} color="#854D0E" />
                  <Text style={styles.extensionLabel}>Extension Challenge</Text>
                </View>
                <Text style={styles.extensionText}>
                  {challenge.extensionTip}
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── Prediction (optional, earns bonus XP) ── */}
        <View style={styles.section}>
          <View style={styles.predictionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="help-circle-outline" size={17} color="#0F172A" />
              <Text style={styles.sectionTitle}>Predict</Text>
            </View>
            <View style={styles.optionalPill}>
              <Text style={styles.optionalText}>optional +XP</Text>
            </View>
          </View>
          <Text style={styles.predictionHint}>
            {challenge.predictionPrompt ??
              "What do you think will happen? Write one team guess."}
          </Text>
          <TextInput
            style={[
              styles.predictionInput,
              prediction.trim().length > 0 && styles.predictionInputFilled,
            ]}
            placeholder="e.g. We think the bigger design will fall slower…"
            placeholderTextColor="#94A3B8"
            value={prediction}
            onChangeText={setPredictionText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── Start / Resume buttons ── */}
        <View style={styles.ctaSection}>
          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleStart}
          >
            <View style={styles.startBtnRow}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
              <Text style={styles.startBtnText}>Start testing</Text>
            </View>
          </Pressable>

          {hasDraft && (
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={() =>
                router.push(`/challenge/${challenge.id}/record`)
              }
              activeOpacity={0.8}
            >
              <Text style={styles.resumeBtnText}>
                Resume previous attempt
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Error screen
  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    fontWeight: "700",
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  backBtnText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
  },

  // Hero
  hero: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  heroIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.06)",
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 32,
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  missionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  missionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  missionNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F97316",
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 18,
  },
  missionText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0F766E",
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  // Difficulty cards
  diffRow: {
    flexDirection: "row",
    gap: 10,
  },
  diffCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  diffCardActive: {
    borderColor: "#0F766E",
    backgroundColor: "#EFF6FF",
  },
  diffEmoji: { marginBottom: 4 },
  diffLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#64748B",
    textAlign: "center",
  },
  diffLabelActive: { color: "#0F766E" },
  diffSub: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
  diffCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },

  // Steps card
  stepsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 4,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#475569",
    lineHeight: 21,
    paddingTop: 4,
  },
  showMoreBtn: {
    paddingTop: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
  },

  // Details toggle button
  detailsToggle: {
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  detailsToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  // Equipment chips
  equipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  equipChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  equipText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },

  // Science concept cards
  knowCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#E2E8F0",
    borderRightColor: "#E2E8F0",
    borderBottomColor: "#E2E8F0",
    gap: 8,
    marginBottom: 8,
  },
  knowHeading: {
    fontSize: 14,
    fontWeight: "800",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 19,
  },

  // Extension tip box
  extensionBox: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#FEFCE8",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE047",
    gap: 6,
  },
  extensionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  extensionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#854D0E",
  },
  extensionText: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 19,
  },

  // Prediction
  predictionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionalPill: {
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FDE047",
  },
  optionalText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#854D0E",
  },
  predictionHint: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 19,
  },
  predictionInput: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#0F172A",
    minHeight: 80,
    backgroundColor: "#FFFFFF",
    lineHeight: 21,
  },
  predictionInputFilled: {
    borderColor: "#0F766E",
    backgroundColor: "#ECFDF5",
  },

  // CTA
  ctaSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  startBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  startBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.88,
  },
  resumeBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  resumeBtnText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },
});
