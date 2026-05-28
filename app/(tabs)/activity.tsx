// app/(tabs)/activity.tsx
// The challenges list screen.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CHALLENGES } from "../../src/data/challenges";
import { useActivityCompletion } from "../../src/hooks/useActivityCompletion";
import type { ColorTokens } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/themeContext";

const ALL_CATEGORIES = [
  "All",
  ...Array.from(new Set(CHALLENGES.map((c) => c.category))),
];

export default function ActivityScreen() {
  const { completedIds, loading } = useActivityCompletion();
  const [activeFilter, setActiveFilter] = useState("All");
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const filtered =
    activeFilter === "All"
      ? CHALLENGES
      : CHALLENGES.filter((c) => c.category === activeFilter);

  const firstIncompleteId = CHALLENGES.find(
    (c) => !completedIds.has(c.id)
  )?.id;

  const completionPercent = Math.round(
    (completedIds.size / CHALLENGES.length) * 100
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Challenges</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>
            {loading ? "—" : `${completedIds.size}/${CHALLENGES.length} done`}
          </Text>
        </View>
      </View>

      {/* ── Overall progress bar ── */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.info} style={styles.progressLoading} />
      ) : (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{completionPercent}% complete</Text>
        </>
      )}

      {/* ── Category filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {ALL_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, activeFilter === cat && styles.chipActive]}
            onPress={() => setActiveFilter(cat)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                activeFilter === cat && styles.chipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Challenge cards ── */}
      {filtered.map((challenge) => {
        const isDone = completedIds.has(challenge.id);
        const isNext = challenge.id === firstIncompleteId && !isDone;

        return (
          <TouchableOpacity
            key={challenge.id}
            style={[
              styles.card,
              isDone && styles.cardDone,
              isNext && styles.cardNext,
            ]}
            onPress={() => router.push(`/challenge/${challenge.id}`)}
            activeOpacity={0.85}
          >
            {isNext && (
              <View style={styles.startBadge}>
                <Text style={styles.startBadgeText}>START HERE</Text>
                <Ionicons name="arrow-forward" size={9} color="#FFFFFF" />
              </View>
            )}

            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${challenge.color}22` },
              ]}
            >
              <Ionicons name={challenge.icon as any} size={26} color={challenge.color} />
              {isDone && (
                <View style={styles.doneTick}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              )}
            </View>

            <View style={styles.cardBody}>
              <View style={styles.titleRowCard}>
                <Text
                  style={[
                    styles.challengeTitle,
                    isDone && styles.challengeTitleDone,
                  ]}
                  numberOfLines={1}
                >
                  {challenge.title}
                </Text>
                {isDone && (
                  <View style={styles.doneBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    <Text style={styles.doneBadgeText}>Done</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.category,
                  isDone && styles.categoryDone,
                  isNext && styles.categoryNext,
                ]}
              >
                {challenge.category}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {challenge.shortDescription}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>{challenge.estimatedMinutes}m</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="refresh-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {challenge.maxPrototypes > 1
                      ? `${challenge.maxPrototypes} designs`
                      : "1 design"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="flask-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No challenges in this category</Text>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 36 },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { fontSize: 30, fontWeight: "800", color: c.primary },
    progressPill: {
      backgroundColor: c.ctaLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.cta,
    },
    progressPillText: { fontSize: 12, fontWeight: "700", color: c.primary },

    progressTrack: {
      height: 7,
      backgroundColor: c.surface,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 4,
    },
    progressFill: { height: "100%", backgroundColor: c.info, borderRadius: 4 },
    progressLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontWeight: "600",
      marginBottom: 16,
    },
    progressLoading: { marginBottom: 16, alignSelf: "flex-start" },

    filterScroll: { marginHorizontal: -20, marginBottom: 20 },
    filterRow: { paddingHorizontal: 20, gap: 8 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: c.cta, borderColor: c.cta },
    chipText: { fontSize: 13, fontWeight: "700", color: c.primary },
    chipTextActive: { color: "#FFFFFF" },

    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      flexDirection: "row",
      borderWidth: 2,
      borderColor: "transparent",
    },
    cardDone: { backgroundColor: c.surface, borderColor: c.info },
    cardNext: { backgroundColor: c.ctaLight, borderColor: c.cta },

    startBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: c.cta,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      zIndex: 1,
    },
    startBadgeText: { fontSize: 9, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 },

    iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
      flexShrink: 0,
    },
    doneTick: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: c.info,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.surface,
    },

    cardBody: { flex: 1 },
    titleRowCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 3,
    },
    challengeTitle: { fontSize: 16, fontWeight: "700", color: c.primary, flex: 1 },
    challengeTitleDone: { opacity: 0.7 },
    doneBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: c.info,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    doneBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
    category: {
      fontSize: 11,
      fontWeight: "700",
      color: c.info,
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    categoryDone: { color: c.textMuted },
    categoryNext: { color: c.cta },
    description: { fontSize: 13, color: c.textSecondary, marginBottom: 10, lineHeight: 18 },

    metaRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
    metaText: { fontSize: 11, color: c.textMuted },

    emptyState: { alignItems: "center", gap: 12, paddingVertical: 40 },
    emptyText: { fontSize: 16, color: c.textMuted, fontWeight: "600" },
  });
}
