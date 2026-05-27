// app/challenge/[id]/index.tsx
// The "Brief" screen — shows details about a challenge before students start it.
// Students choose difficulty, read steps, write a prediction, then tap Start.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ChallengeTabBar } from "../../../src/components/challenge/ChallengeTabBar";
import { useActivity } from "../../../src/context/ActivityContext";
import { useTeam } from "../../../src/context/TeamContext";
import { getChallengeById } from "../../../src/data/challenges";
import type { ColorTokens } from "../../../src/theme/colors";
import { useTheme } from "../../../src/theme/themeContext";
import {
  buildIncompleteSummary,
  getRequiredMeasurements,
  isPrototypeComplete,
} from "../../../src/utils/challengeRecordValidation";
import { HUMAN_PERFORMANCE_CHALLENGE_ID } from "../../../src/utils/humanPerformance";

export default function ChallengeBriefScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = getChallengeById(Number(id));
  const { team, computedDifficulty } = useTeam();
  const { startDraft, draft } = useActivity();

  const [showAllSteps, setShowAllSteps] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const goBackToChallenges = () => {
    router.replace("/(tabs)/activity");
  };

  // Safety check — shouldn't happen, but handles bad URLs
  if (!challenge) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorText}>Challenge not found</Text>
        <Pressable style={styles.backBtn} onPress={goBackToChallenges}>
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
    draft.prototypes.length >= challenge.maxPrototypes &&
    draft.prototypes.every((p) =>
      isPrototypeComplete(p, requiredForDraft, challenge.id),
    );

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
      difficulty: computedDifficulty,
    });

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
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.heroBadgeText}>
                {challenge.estimatedMinutes} min
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="refresh-outline" size={13} color={colors.textMuted} />
              <Text style={styles.heroBadgeText}>
                {challenge.maxPrototypes === 1
                  ? "1 design"
                  : `Up to ${challenge.maxPrototypes} designs`}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.difficultyBadge,
              computedDifficulty === "highSchool"
                ? styles.difficultyBadgeHS
                : styles.difficultyBadgePrimary,
            ]}
          >
            <Ionicons
              name={computedDifficulty === "highSchool" ? "school" : "star"}
              size={13}
              color={computedDifficulty === "highSchool" ? "#2563EB" : "#0F766E"}
            />
            <Text
              style={[
                styles.difficultyBadgeText,
                computedDifficulty === "highSchool"
                  ? styles.difficultyBadgeTextHS
                  : styles.difficultyBadgeTextPrimary,
              ]}
            >
              {computedDifficulty === "highSchool"
                ? "High School Mode"
                : "Primary Mode"}
            </Text>
          </View>

        </View>

        {/* ── Equipment ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.equipRow}>
            {challenge.equipment.map((item, i) => (
              <View key={i} style={styles.equipChip}>
                <Text style={styles.equipText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Steps (show first 3 by default) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
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
            {/* Science concept cards */}
            {challenge.thingsToKnow && challenge.thingsToKnow.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="bulb-outline" size={17} color={colors.text} />
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
          </>
        )}

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

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingTop: 24,
      paddingBottom: 24,
    },

    errorScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 24,
      backgroundColor: c.background,
    },
    errorText: {
      fontSize: 18,
      color: c.danger,
      fontWeight: "700",
    },
    backBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 999,
      backgroundColor: c.backgroundSecondary,
    },
    backBtnText: {
      fontSize: 15,
      color: c.textSecondary,
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
      borderColor: c.borderFaint,
    },
    heroIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      borderWidth: 2,
      borderColor: c.borderFaint,
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
      color: c.text,
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
      backgroundColor: c.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
    },
    heroBadgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: c.textSecondary,
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
      color: c.text,
    },

    // Steps card
    stepsCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: c.border,
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
      color: c.textSecondary,
      lineHeight: 21,
      paddingTop: 4,
    },
    showMoreBtn: {
      paddingTop: 10,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 4,
    },
    showMoreText: {
      fontSize: 13,
      fontWeight: "700",
      color: c.info,
    },

    // Details toggle button
    detailsToggle: {
      marginHorizontal: 16,
      marginBottom: 20,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: c.backgroundSecondary,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    detailsToggleText: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textSecondary,
    },

    // Equipment chips
    equipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    equipChip: {
      backgroundColor: c.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    equipText: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: "500",
    },

    // Science concept cards
    knowCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderTopWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderTopColor: c.border,
      borderRightColor: c.border,
      borderBottomColor: c.border,
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
      color: c.textSecondary,
      lineHeight: 19,
    },

    // Prediction
    predictionHint: {
      fontSize: 13,
      color: c.textMuted,
      lineHeight: 19,
    },
    predictionInput: {
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      color: c.text,
      minHeight: 80,
      backgroundColor: c.input,
      lineHeight: 21,
    },
    predictionInputFilled: {
      borderColor: c.inputFilledBorder,
      backgroundColor: c.inputFilled,
    },

    // CTA
    ctaSection: {
      paddingHorizontal: 16,
      gap: 10,
    },
    startBtn: {
      backgroundColor: c.cta,
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
      color: c.textMuted,
      fontWeight: "600",
    },

    // Difficulty badge (intentional design colors — not themed)
    difficultyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1.5,
      marginTop: 10,
    },
    difficultyBadgePrimary: {
      backgroundColor: "#ECFDF5",
      borderColor: "#6EE7B7",
    },
    difficultyBadgeHS: {
      backgroundColor: "#EFF6FF",
      borderColor: "#93C5FD",
    },
    difficultyBadgeText: {
      fontSize: 12,
      fontWeight: "700",
    },
    difficultyBadgeTextPrimary: {
      color: "#0F766E",
    },
    difficultyBadgeTextHS: {
      color: "#2563EB",
    },
  });
}
