// app/(tabs)/activity.tsx
// The challenges list screen.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CHALLENGES } from "../../src/data/challenges";
import { SCORING } from "../../src/config/constants";
import { useActivityCompletion } from "../../src/hooks/useActivityCompletion";

const ALL_CATEGORIES = [
  "All",
  ...Array.from(new Set(CHALLENGES.map((c) => c.category))),
];

function baseXP(maxPrototypes: number): number {
  let xp = SCORING.BASE_XP + SCORING.PREDICTION_BONUS;
  if (maxPrototypes >= 2) xp += SCORING.MULTI_DESIGN_2;
  if (maxPrototypes >= 3) xp += SCORING.MULTI_DESIGN_3;
  return xp;
}

export default function ActivityScreen() {
  const { completedIds, loading } = useActivityCompletion();
  const [activeFilter, setActiveFilter] = useState("All");

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
          <Ionicons name="flash" size={26} color="#0F766E" />
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
        <ActivityIndicator size="small" color="#2563EB" style={styles.progressLoading} />
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
        const xp = baseXP(challenge.maxPrototypes);

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
            {/* "Start Here" badge */}
            {isNext && (
              <View style={styles.startBadge}>
                <Text style={styles.startBadgeText}>START HERE</Text>
                <Ionicons name="arrow-forward" size={9} color="#FFFFFF" />
              </View>
            )}

            {/* Icon circle */}
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

            {/* Card body */}
            <View style={styles.cardBody}>
              <View style={styles.titleRowCard}>
                <Text
                  style={[
                    styles.challengeTitle,
                    isDone && styles.challengeTitleDone,
                    isNext && styles.challengeTitleNext,
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

              {/* Meta: time, designs, XP */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={11} color="#94A3B8" />
                  <Text style={styles.metaText}>{challenge.estimatedMinutes}m</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="refresh-outline" size={11} color="#94A3B8" />
                  <Text style={styles.metaText}>
                    {challenge.maxPrototypes > 1
                      ? `${challenge.maxPrototypes} designs`
                      : "1 design"}
                  </Text>
                </View>
                <View style={styles.xpPill}>
                  <Ionicons name="flash" size={11} color="#F97316" />
                  <Text style={styles.xpPillText}>Earn {xp}+ XP</Text>
                </View>
              </View>

              {!isDone && (
                <View style={styles.rewardHint}>
                  <Ionicons name="sparkles-outline" size={12} color="#2563EB" />
                  <Text style={styles.rewardHintText}>
                    Bonus XP for evidence and teamwork
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Empty state */}
      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="flask-outline" size={40} color="#94A3B8" />
          <Text style={styles.emptyText}>No challenges in this category</Text>
        </View>
      )}
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F766E",
  },
  progressPill: {
    backgroundColor: "#FED7AA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F97316",
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F766E",
  },

  progressTrack: {
    height: 7,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 16,
  },
  progressLoading: {
    marginBottom: 16,
    alignSelf: "flex-start",
  },

  filterScroll: {
    marginHorizontal: -20,
    marginBottom: 20,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FFF7ED",
  },
  chipActive: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardDone: {
    backgroundColor: "#FFF7ED",
    borderColor: "#2563EB",
  },
  cardNext: {
    backgroundColor: "#FFEDD5",
    borderColor: "#F97316",
  },

  startBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F97316",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 1,
  },
  startBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

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
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  cardBody: { flex: 1 },
  titleRowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F766E",
    flex: 1,
  },
  challengeTitleDone: {
    color: "#0F766E",
    opacity: 0.7,
  },
  challengeTitleNext: {
    color: "#0F766E",
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  category: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryDone: {
    color: "#94A3B8",
  },
  categoryNext: {
    color: "#F97316",
  },
  description: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 10,
    lineHeight: 18,
  },

  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  xpPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FED7AA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: "auto",
  },
  xpPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F97316",
  },
  rewardHint: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rewardHintText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },

  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "600",
  },
});
