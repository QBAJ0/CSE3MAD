// app/(tabs)/activity.tsx
// The challenges list screen.
// Students can filter by category and tap a challenge to open it.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CHALLENGES } from "../../src/data/challenges";
import { useActivityCompletion } from "../../src/hooks/useActivityCompletion";

const ALL_CATEGORIES = [
  "All",
  ...Array.from(new Set(CHALLENGES.map((c) => c.category))),
];

function baseXP(maxPrototypes: number): number {
  let xp = 100;
  if (maxPrototypes >= 2) xp += 30;
  if (maxPrototypes >= 3) xp += 50;
  return xp;
}

export default function ActivityScreen() {
  const { completedIds } = useActivityCompletion();
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
          <Ionicons name="flash" size={26} color="#0F172A" />
          <Text style={styles.title}>Challenges</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>
            {completedIds.size}/{CHALLENGES.length} done
          </Text>
        </View>
      </View>

      {/* ── Overall progress bar ── */}
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${completionPercent}%` }]}
        />
      </View>
      <Text style={styles.progressLabel}>{completionPercent}% complete</Text>

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
                <Text style={styles.challengeTitle} numberOfLines={1}>
                  {challenge.title}
                </Text>
                {isDone && (
                  <View style={styles.doneBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    <Text style={styles.doneBadgeText}>Done</Text>
                  </View>
                )}
              </View>

              <Text style={styles.category}>{challenge.category}</Text>
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
                  <Ionicons name="flash" size={11} color="#F59E0B" />
                  <Text style={styles.xpPillText}>{xp}+ XP</Text>
                </View>
              </View>
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
    backgroundColor: "#F8FAFC",
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
    color: "#0F172A",
  },
  progressPill: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },

  progressTrack: {
    height: 7,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 16,
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
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
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
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  cardNext: {
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
    borderRadius: 999,
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
    backgroundColor: "#22C55E",
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
    color: "#0F172A",
    flex: 1,
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  category: {
    fontSize: 11,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: "auto",
  },
  xpPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F59E0B",
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
