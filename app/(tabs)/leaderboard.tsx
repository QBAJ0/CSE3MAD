// app/(tabs)/leaderboard.tsx
// Shows all teams ranked by XP. Filter by week, month, or all time.

import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
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
import { fetchLeaderboard } from "../../src/services/resultDb";
import type { LeaderboardEntry } from "../../src/types";
import type { LeaderboardRow } from "../../src/types/db";

const RANK_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const RANK_ICONS: Record<1 | 2 | 3, React.ComponentProps<typeof Ionicons>["name"]> = {
  1: "trophy",
  2: "medal-outline",
  3: "ribbon-outline",
};

const PODIUM_COLORS: Record<1 | 2 | 3, string> = {
  1: "#F97316",   // Ochre — bold first place
  2: "#2563EB",   // Sky Blue — cool second place
  3: "#FED7AA",   // Peach — warm third place
};

const PODIUM_HEIGHTS: Record<1 | 2 | 3, number> = {
  1: 148,
  2: 110,
  3: 90,
};

export default function LeaderboardScreen() {
  const { team } = useTeam();
  const [timeFrame, setTimeFrame] = useState<LeaderboardTimeFrame>("all");

  const [sqlRows, setSqlRows] = useState<LeaderboardRow[]>([]);
  const [sqlLoading, setSqlLoading] = useState(false);

  const loadSqlLeaderboard = useCallback(async () => {
    try {
      setSqlLoading(true);
      setSqlRows(await fetchLeaderboard());
    } catch {
      setSqlRows([]);
    } finally {
      setSqlLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSqlLeaderboard();
    }, [loadSqlLeaderboard]),
  );

  // Load leaderboard data for the selected time frame
  const { entries: leaderboard, loading } = useLeaderboard(timeFrame);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

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
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="trophy" size={30} color="#FED7AA" />
          </View>
          <View style={styles.heroStatPill}>
            <Ionicons name="people-outline" size={14} color="#0F766E" />
            <Text style={styles.heroStatText}>{leaderboard.length} teams</Text>
          </View>
        </View>

        <Text style={styles.title}>Team XP Race</Text>
        <Text style={styles.subtitle}>
          Who is leading the lab? Complete challenges to climb the board.
        </Text>
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
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles-outline" size={16} color="#F97316" />
            <Text style={styles.podiumLabel}>Top Performers</Text>
          </View>

          <View style={styles.podiumRow}>
            {([top3[1], top3[0], top3[2]] as (LeaderboardEntry | undefined)[]).map(
              (entry, colIdx) => {
                const rank = ([2, 1, 3] as const)[colIdx];

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
                    {isYou && (
                      <View style={styles.youBubble}>
                        <Text style={styles.youBubbleText}>YOU</Text>
                      </View>
                    )}

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
                        <Ionicons
                          name={RANK_ICONS[rank]}
                          size={rank === 1 ? 17 : 15}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.podiumRankText}>{RANK_LABEL[rank]}</Text>
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
          <Text style={styles.emptyTitle}>Launch your team</Text>
          <Text style={styles.emptySubtitle}>
            Complete your first challenge to land on the XP race board.
          </Text>
        </View>
      )}

      {/* ── Ranks 4–10 list ── */}
      {rest.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="list-outline" size={16} color="#F97316" />
            <Text style={styles.sectionLabel}>RANKINGS</Text>
          </View>
          {rest.map((entry) => {
            const isYou = entry.discriminator === team?.discriminator;
            return (
              <View
                key={entry.discriminator}
                style={[styles.row, isYou && styles.rowYou]}
              >
                <View style={styles.rowRank}>
                  <Text style={[styles.rowRankText, isYou && styles.rowRankTextYou]}>
                    #{entry.rank}
                  </Text>
                </View>

                <View style={styles.rowInfo}>
                  <Text style={[styles.rowName, isYou && styles.rowNameYou]}>
                    {entry.teamName}
                  </Text>
                  <Text style={styles.rowId}>{entry.discriminator}</Text>
                </View>

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

      <View style={styles.labSectionWrap}>
        <View style={styles.labHeaderRow}>
          <View style={styles.labHeaderIcon}>
            <Ionicons name="phone-portrait-outline" size={18} color="#2563EB" />
          </View>
          <View style={styles.labHeaderText}>
            <Text style={styles.labTitle}>Device Lab Scores</Text>
            <Text style={styles.labSectionHint}>
              Local SQLite activity totals, separate from the XP race.
            </Text>
          </View>
        </View>
        {sqlLoading ? (
          <View style={[styles.row, { justifyContent: "center" }]}>
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : sqlRows.length === 0 ? (
          <Text style={styles.labEmpty}>No lab results saved yet.</Text>
        ) : (
          sqlRows.map((r) => {
            const isYou = team?.teamName === r.teamName;
            return (
              <View
                key={`sql-${r.teamId}`}
                style={[styles.row, isYou && styles.rowYou]}
              >
                <View style={styles.rowRank}>
                  <Text style={styles.rowRankText}>#{r.rank}</Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{r.teamName}</Text>
                  <Text style={styles.rowId}>
                    {r.completedActivityCount} activities recorded
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowXP}>{r.totalScore}</Text>
                  <Text style={styles.rowXPLabel}>LAB</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
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
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },

  hero: {
    backgroundColor: "#0F766E",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    gap: 8,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F766E",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
    lineHeight: 20,
  },

  // Time frame filter — full box, rectangular
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF7ED",
  },
  filterBtnActive: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
  },
  filterBtnTextActive: { color: "#FFFFFF" },

  // Your rank spotlight (rank > 3)
  yourSpotlight: {
    backgroundColor: "#FFEDD5",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#F97316",
  },
  yourSpotlightLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#F97316",
    letterSpacing: 1,
  },
  yourSpotlightRank: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F766E",
  },
  yourSpotlightPoints: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F97316",
  },

  // Podium
  podiumWrapper: { marginBottom: 20 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
    marginTop: 4,
  },
  podiumLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F766E",
    textTransform: "uppercase",
    letterSpacing: 1,
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF7ED",
    borderStyle: "dashed",
  },
  podiumEmptyText: { fontSize: 24, color: "#94A3B8" },
  podiumRankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
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
    color: "rgba(255,255,255,0.8)",
  },
  youBubble: {
    alignSelf: "center",
    backgroundColor: "#0F766E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
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
    color: "#0F766E",
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
    color: "#0F766E",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFF7ED",
  },
  rowYou: {
    backgroundColor: "#FFEDD5",
    borderWidth: 2,
    borderColor: "#F97316",
  },
  rowRank: { width: 44, alignItems: "center" },
  rowRankText: { fontSize: 16, fontWeight: "800", color: "#94A3B8" },
  rowRankTextYou: { color: "#F97316" },
  rowInfo: { flex: 1, marginLeft: 10 },
  rowName: { fontSize: 15, fontWeight: "700", color: "#0F766E" },
  rowNameYou: { color: "#0F766E", fontWeight: "800" },
  rowId: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  rowXP: { fontSize: 18, fontWeight: "800", color: "#F97316" },
  rowXPLabel: { fontSize: 10, color: "#94A3B8" },

  // Your team card (when in top 3)
  yourCard: {
    backgroundColor: "#0F766E",
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

  labSectionWrap: {
    marginTop: 28,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FED7AA",
    gap: 10,
  },
  labHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  labHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  labHeaderText: {
    flex: 1,
    gap: 2,
  },
  labTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F766E",
  },
  labSectionHint: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  labEmpty: {
    fontSize: 14,
    color: "#94A3B8",
    paddingVertical: 8,
  },
});
