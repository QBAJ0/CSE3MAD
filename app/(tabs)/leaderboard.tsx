// app/(tabs)/leaderboard.tsx
// Shows all teams ranked by XP. Students can filter by week, month, or all time.
// The top 3 teams get a podium display, the rest appear in a ranked list.

import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTeam } from "../../src/context/TeamContext";
import { LeaderboardTimeFrame, useLeaderboard } from "../../src/hooks/useLeaderboard";
import { LeaderboardEntry } from "../../src/types";

// Text labels for top 3 ranks
const RANK_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

// Background colour for each podium position
const PODIUM_COLORS: Record<1 | 2 | 3, string> = {
  1: "#F59E0B",   // gold
  2: "#94A3B8",   // silver
  3: "#D97706",   // bronze
};

// Height of each podium column (1st is tallest)
const PODIUM_HEIGHTS: Record<1 | 2 | 3, number> = {
  1: 148,
  2: 110,
  3: 90,
};

export default function LeaderboardScreen() {
  const { team } = useTeam();

  // Which time filter is active: this week, this month, or all time
  const [timeFrame, setTimeFrame] = useState<LeaderboardTimeFrame>("all");

  // Load leaderboard data for the selected time frame
  const { entries: leaderboard, loading } = useLeaderboard(timeFrame);

  // Show a spinner while data loads
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  // Find this team's entry and split the list into podium vs. the rest
  const yourEntry = leaderboard.find(
    (e) => e.discriminator === team?.discriminator
  );
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 10);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Title ── */}
      <View style={styles.titleRow}>
        <Ionicons name="trophy" size={26} color="#0F172A" />
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      {/* ── Time frame filter ── */}
      <View style={styles.filterRow}>
        {(["week", "month", "all"] as const).map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[styles.filterBtn, timeFrame === tf && styles.filterBtnActive]}
            onPress={() => setTimeFrame(tf)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterBtnText,
                timeFrame === tf && styles.filterBtnTextActive,
              ]}
            >
              {tf === "week" ? "This Week" : tf === "month" ? "This Month" : "All Time"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Your rank spotlight (only shown when rank is 4 or lower) ── */}
      {yourEntry && yourEntry.rank > 3 && (
        <View style={styles.yourSpotlight}>
          <Text style={styles.yourSpotlightLabel}>YOUR RANK</Text>
          <Text style={styles.yourSpotlightRank}>#{yourEntry.rank}</Text>
          <Text style={styles.yourSpotlightPoints}>{yourEntry.totalPoints} XP</Text>
        </View>
      )}

      {/* ── Top 3 podium ── */}
      {top3.length > 0 && (
        <View style={styles.podiumWrapper}>
          <Text style={styles.podiumLabel}>Top Performers</Text>

          {/* Order: 2nd left · 1st centre · 3rd right */}
          <View style={styles.podiumRow}>
            {([top3[1], top3[0], top3[2]] as (LeaderboardEntry | undefined)[]).map(
              (entry, colIdx) => {
                const rank = ([2, 1, 3] as const)[colIdx];

                // Empty slot (fewer than 3 teams exist yet)
                if (!entry) {
                  return (
                    <View key={colIdx} style={styles.podiumSlot}>
                      <View
                        style={[
                          styles.podiumEmptyCard,
                          { height: PODIUM_HEIGHTS[rank] },
                        ]}
                      >
                        <Text style={styles.podiumEmptyText}>?</Text>
                      </View>
                    </View>
                  );
                }

                const isYou = entry.discriminator === team?.discriminator;

                return (
                  <View key={entry.discriminator} style={styles.podiumSlot}>
                    {/* "YOU" bubble above the card */}
                    {isYou && (
                      <View style={styles.youBubble}>
                        <Text style={styles.youBubbleText}>YOU</Text>
                      </View>
                    )}

                    {/* Coloured podium card */}
                    <View
                      style={[
                        styles.podiumCard,
                        {
                          height: PODIUM_HEIGHTS[rank],
                          backgroundColor: PODIUM_COLORS[rank],
                        },
                      ]}
                    >
                      <View style={styles.podiumRankCircle}>
                        <Text style={styles.podiumRankText}>{RANK_LABEL[rank]}</Text>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={2}>
                        {entry.teamName}
                      </Text>
                      <Text style={styles.podiumXP}>{entry.totalPoints}</Text>
                      <Text style={styles.podiumXPLabel}>XP</Text>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        </View>
      )}

      {/* ── Empty state ── */}
      {leaderboard.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="trophy-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete a challenge to appear on the leaderboard!
          </Text>
        </View>
      )}

      {/* ── Ranks 4–10 list ── */}
      {rest.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>RANKINGS</Text>
          {rest.map((entry) => {
            const isYou = entry.discriminator === team?.discriminator;
            return (
              <View
                key={entry.discriminator}
                style={[styles.row, isYou && styles.rowYou]}
              >
                {/* Rank number */}
                <View style={styles.rowRank}>
                  <Text style={styles.rowRankText}>#{entry.rank}</Text>
                </View>

                {/* Team name + ID */}
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{entry.teamName}</Text>
                  <Text style={styles.rowId}>{entry.discriminator}</Text>
                </View>

                {/* XP */}
                <View style={styles.rowRight}>
                  <Text style={styles.rowXP}>{entry.totalPoints}</Text>
                  <Text style={styles.rowXPLabel}>XP</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* ── Your team card (shown at bottom when in top 3) ── */}
      {yourEntry && yourEntry.rank <= 3 && (
        <View style={styles.yourCard}>
          <Text style={styles.yourCardLabel}>YOUR TEAM</Text>
          <Text style={styles.yourCardName}>{yourEntry.teamName}</Text>
          <View style={styles.yourCardStats}>
            <View style={styles.yourCardStat}>
              <Text style={styles.yourCardStatValue}>#{yourEntry.rank}</Text>
              <Text style={styles.yourCardStatLabel}>Rank</Text>
            </View>
            <View style={styles.yourCardDivider} />
            <View style={styles.yourCardStat}>
              <Text style={styles.yourCardStatValue}>{yourEntry.totalPoints}</Text>
              <Text style={styles.yourCardStatLabel}>XP</Text>
            </View>
            <View style={styles.yourCardDivider} />
            <View style={styles.yourCardStat}>
              <Text style={styles.yourCardStatValue}>
                {yourEntry.challengesCompleted}
              </Text>
              <Text style={styles.yourCardStatLabel}>Done</Text>
            </View>
          </View>
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
  },

  // Time frame filter
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  filterBtnActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterBtnTextActive: { color: "#FFFFFF" },

  // Your rank spotlight (rank > 3)
  yourSpotlight: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#22C55E",
  },
  yourSpotlightLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#22C55E",
    letterSpacing: 1,
  },
  yourSpotlightRank: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  yourSpotlightPoints: {
    fontSize: 16,
    fontWeight: "700",
    color: "#22C55E",
  },

  // Podium
  podiumWrapper: { marginBottom: 20 },
  podiumLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 180,
  },
  podiumSlot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  podiumCard: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 2,
  },
  podiumEmptyCard: {
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  podiumEmptyText: { fontSize: 24, color: "#94A3B8" },
  podiumRankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  podiumRankText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  podiumName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  podiumXP: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  podiumXPLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
  },
  youBubble: {
    alignSelf: "center",
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
  },
  youBubbleText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  // Empty state
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 40 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  // Ranks 4–10
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  rowYou: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#22C55E",
  },
  rowRank: { width: 44, alignItems: "center" },
  rowRankText: { fontSize: 16, fontWeight: "800", color: "#94A3B8" },
  rowInfo: { flex: 1, marginLeft: 10 },
  rowName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  rowId: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  rowXP: { fontSize: 18, fontWeight: "800", color: "#22C55E" },
  rowXPLabel: { fontSize: 10, color: "#94A3B8" },

  // Your team card (when in top 3)
  yourCard: {
    backgroundColor: "#22C55E",
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    alignItems: "center",
  },
  yourCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 2,
    marginBottom: 4,
  },
  yourCardName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  yourCardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  yourCardStat: { alignItems: "center" },
  yourCardStatValue: { fontSize: 26, fontWeight: "900", color: "#FFFFFF" },
  yourCardStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  yourCardDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});
