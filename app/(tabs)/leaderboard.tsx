// app/(tabs)/leaderboard.tsx

import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
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
import type { ColorTokens } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/themeContext";
import type { LeaderboardEntry } from "../../src/types";

const RANK_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const RANK_ICONS: Record<1 | 2 | 3, React.ComponentProps<typeof Ionicons>["name"]> = {
  1: "trophy",
  2: "medal-outline",
  3: "ribbon-outline",
};
const PODIUM_COLORS: Record<1 | 2 | 3, string> = {
  1: "#F97316",
  2: "#2563EB",
  3: "#FED7AA",
};
const PODIUM_HEIGHTS: Record<1 | 2 | 3, number> = { 1: 148, 2: 110, 3: 90 };

export default function LeaderboardScreen() {
  const { team } = useTeam();
  const [timeFrame, setTimeFrame] = useState<LeaderboardTimeFrame>("all");
  const { entries: leaderboard, loading } = useLeaderboard(timeFrame);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.info} />
      </View>
    );
  }

  const yourEntry = leaderboard.find((e) => e.discriminator === team?.discriminator);
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 10);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="trophy" size={30} color="#FED7AA" />
          </View>
          <View style={styles.heroStatPill}>
            <Ionicons name="people-outline" size={14} color={colors.primary} />
            <Text style={styles.heroStatText}>{leaderboard.length} teams</Text>
          </View>
        </View>
        <Text style={styles.title}>Top Scientists</Text>
        <Text style={styles.subtitle}>
          {"Who's winning the lab? Finish challenges to move up!"}
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

      {/* ── Your rank spotlight ── */}
      {yourEntry && yourEntry.rank > 3 && (
        <View style={styles.yourSpotlight}>
          <Text style={styles.yourSpotlightLabel}>YOUR SPOT</Text>
          <Text style={styles.yourSpotlightRank}>#{yourEntry.rank}</Text>
          <Text style={styles.yourSpotlightPoints}>{yourEntry.challengesCompleted} done</Text>
        </View>
      )}

      {/* ── Top 3 podium ── */}
      {top3.length > 0 && (
        <View style={styles.podiumWrapper}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles-outline" size={16} color={colors.cta} />
            <Text style={styles.podiumLabel}>Top Teams</Text>
          </View>

          <View style={styles.podiumRow}>
            {([top3[1], top3[0], top3[2]] as (LeaderboardEntry | undefined)[]).map(
              (entry, colIdx) => {
                const rank = ([2, 1, 3] as const)[colIdx];
                if (!entry) {
                  return (
                    <View key={colIdx} style={styles.podiumSlot}>
                      <View style={[styles.podiumEmptyCard, { height: PODIUM_HEIGHTS[rank] }]}>
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
                        { height: PODIUM_HEIGHTS[rank], backgroundColor: PODIUM_COLORS[rank] },
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
                      <Text style={styles.podiumName} numberOfLines={2}>{entry.teamName}</Text>
                      <Text style={styles.podiumXP}>{entry.challengesCompleted}</Text>
                      <Text style={styles.podiumXPLabel}>finished</Text>
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
          <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No teams yet!</Text>
          <Text style={styles.emptySubtitle}>
            Finish your first challenge to get on the board.
          </Text>
        </View>
      )}

      {/* ── Ranks 4–10 ── */}
      {rest.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="list-outline" size={16} color={colors.cta} />
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
                  <Text style={styles.rowXP}>{entry.challengesCompleted}</Text>
                  <Text style={styles.rowXPLabel}>done</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* ── Your team card (top 3) ── */}
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
              <Text style={styles.yourCardStatValue}>{yourEntry.challengesCompleted}</Text>
              <Text style={styles.yourCardStatLabel}>Done</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.background },

    hero: {
      backgroundColor: c.header,
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
      backgroundColor: c.surface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    heroStatText: { fontSize: 12, fontWeight: "800", color: c.primary },
    title: { fontSize: 30, fontWeight: "800", color: "#FFFFFF" },
    subtitle: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.82)", lineHeight: 20 },

    filterRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
    filterBtn: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: c.surface,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: c.border,
    },
    filterBtnActive: { backgroundColor: c.cta, borderColor: c.cta },
    filterBtnText: { fontSize: 13, fontWeight: "700", color: c.primary },
    filterBtnTextActive: { color: "#FFFFFF" },

    yourSpotlight: {
      backgroundColor: c.ctaLight,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
      borderWidth: 2,
      borderColor: c.cta,
    },
    yourSpotlightLabel: { fontSize: 11, fontWeight: "800", color: c.cta, letterSpacing: 1 },
    yourSpotlightRank: { fontSize: 28, fontWeight: "800", color: c.primary },
    yourSpotlightPoints: { fontSize: 16, fontWeight: "700", color: c.cta },

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
      color: c.primary,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    podiumRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 180 },
    podiumSlot: { flex: 1, justifyContent: "flex-end" },
    podiumCard: {
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      gap: 2,
    },
    podiumEmptyCard: {
      borderRadius: 16,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.border,
      borderStyle: "dashed",
    },
    podiumEmptyText: { fontSize: 24, color: c.textMuted },
    podiumRankCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    podiumRankText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.3 },
    podiumName: { fontSize: 11, fontWeight: "800", color: "#FFFFFF", textAlign: "center" },
    podiumXP: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
    podiumXPLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
    youBubble: {
      alignSelf: "center",
      backgroundColor: c.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginBottom: 4,
    },
    youBubbleText: { fontSize: 9, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 },

    emptyState: { alignItems: "center", gap: 12, paddingVertical: 40 },
    emptyTitle: { fontSize: 20, fontWeight: "800", color: c.primary, marginBottom: 6 },
    emptySubtitle: { fontSize: 14, color: c.textSecondary, textAlign: "center" },

    sectionLabel: { fontSize: 11, fontWeight: "800", color: c.primary, letterSpacing: 1 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    rowYou: {
      backgroundColor: c.ctaLight,
      borderWidth: 2,
      borderColor: c.cta,
    },
    rowRank: { width: 44, alignItems: "center" },
    rowRankText: { fontSize: 16, fontWeight: "800", color: c.textMuted },
    rowRankTextYou: { color: c.cta },
    rowInfo: { flex: 1, marginLeft: 10 },
    rowName: { fontSize: 15, fontWeight: "700", color: c.primary },
    rowNameYou: { fontWeight: "800" },
    rowId: { fontSize: 11, color: c.textMuted, marginTop: 2 },
    rowRight: { alignItems: "flex-end" },
    rowXP: { fontSize: 18, fontWeight: "800", color: c.cta },
    rowXPLabel: { fontSize: 10, color: c.textMuted },

    yourCard: {
      backgroundColor: c.primary,
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
    yourCardName: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", marginBottom: 16 },
    yourCardStats: { flexDirection: "row", alignItems: "center", gap: 20 },
    yourCardStat: { alignItems: "center" },
    yourCardStatValue: { fontSize: 26, fontWeight: "900", color: "#FFFFFF" },
    yourCardStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 },
    yourCardDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.3)" },
  });
}
