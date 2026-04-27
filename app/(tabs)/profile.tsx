// app/(tabs)/profile.tsx
// Shows the team's profile: total XP, badges, members, and recent activity history.
// Also has a Reset button to clear all data and go back to onboarding.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BADGES, RARITY_BG, RARITY_BORDER, RARITY_COLOR } from "../../src/config/badges";
import { useTeam } from "../../src/context/TeamContext";
import { getChallengeById } from "../../src/data/challenges";
import { ActivityResult } from "../../src/types";
import { storage } from "../../src/utils/storage";

// A different colour for each member's avatar circle
const AVATAR_COLORS = [
  "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4",
];

export default function ProfileScreen() {
  const { team, clearTeamData } = useTeam();

  // Data loaded from storage
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [recentActivities, setRecentActivities] = useState<ActivityResult[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  // Reload data whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [badges, activities] = await Promise.all([
          storage.getEarnedBadges(),
          storage.getCompletedActivities(),
        ]);

        setEarnedBadgeIds(new Set(badges));

        // Sort by newest first and show the last 5
        const sorted = [...activities].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentActivities(sorted.slice(0, 5));

        // Sum up all XP from completed activities
        setTotalXP(activities.reduce((sum, a) => sum + (a.points ?? 0), 0));
      };
      load();
    }, [])
  );

  const handleReset = () => {
    Alert.alert(
      "Reset App",
      "This will erase all data and return to setup.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await storage.clearAll();
            await clearTeamData();
            router.replace("/(onboarding)/welcome");
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Team avatar circle */}
        <View style={styles.avatarCircle}>
          <Ionicons name="flask" size={40} color="#22C55E" />
        </View>

        <Text style={styles.teamName}>{team?.teamName ?? "My Team"}</Text>
        <Text style={styles.teamId}>{team?.discriminator ?? "—"}</Text>

        {/* Quick stats: XP, Badges, Members */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{earnedBadgeIds.size}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{team?.members.length ?? 0}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>
      </View>

      {/* ── Badge collection ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="ribbon-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Badge Collection</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {earnedBadgeIds.size}/{BADGES.length} earned
          </Text>
        </View>

        <View style={styles.badgeGrid}>
          {BADGES.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeTile,
                  {
                    backgroundColor: isEarned
                      ? RARITY_BG[badge.rarity]
                      : "#F1F5F9",
                    borderColor: isEarned
                      ? RARITY_BORDER[badge.rarity]
                      : "#E2E8F0",
                    opacity: isEarned ? 1 : 0.45,
                  },
                ]}
              >
                <Ionicons
                  name={badge.icon as any}
                  size={24}
                  color={isEarned ? RARITY_COLOR[badge.rarity] : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.badgeName,
                    {
                      color: isEarned
                        ? RARITY_COLOR[badge.rarity]
                        : "#94A3B8",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {badge.name}
                </Text>
                {isEarned && (
                  <View
                    style={[
                      styles.rarityDot,
                      { backgroundColor: RARITY_COLOR[badge.rarity] },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Team members ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="people-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Team Members</Text>
        </View>
        {team?.members.map((member, index) => (
          <View key={index} style={styles.memberRow}>
            <View
              style={[
                styles.memberAvatar,
                { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
              ]}
            >
              <Text style={styles.memberInitial}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              {member.grade ? (
                <Text style={styles.memberGrade}>{member.grade}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {/* ── Recent activity history ── */}
      {recentActivities.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="list-outline" size={16} color="#0F172A" />
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </View>
          {recentActivities.map((activity) => {
            const challenge = getChallengeById(activity.challengeId);
            if (!challenge) return null;

            const date = new Date(activity.createdAt).toLocaleDateString(
              "en-AU",
              { day: "numeric", month: "short" }
            );

            return (
              <TouchableOpacity
                key={activity.id}
                style={styles.historyRow}
                onPress={() => router.push(`/challenge/${activity.challengeId}`)}
                activeOpacity={0.8}
              >
                {/* Challenge icon */}
                <View style={styles.historyIcon}>
                  <Ionicons name={challenge.icon as any} size={22} color="#64748B" />
                </View>

                {/* Challenge name and meta */}
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{challenge.title}</Text>
                  <Text style={styles.historyMeta}>
                    {date}  ·  {"⭐".repeat(activity.rating)}  ·{" "}
                    {activity.difficulty === "highSchool"
                      ? "High School"
                      : "Primary"}
                  </Text>
                </View>

                {/* XP earned */}
                <View style={styles.historyXP}>
                  <Text style={styles.historyXPValue}>+{activity.points ?? 0}</Text>
                  <Text style={styles.historyXPLabel}>XP</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Reset button ── */}
      <Pressable
        style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
        onPress={handleReset}
      >
        <View style={styles.resetBtnRow}>
          <Ionicons name="warning-outline" size={15} color="#DC2626" />
          <Text style={styles.resetBtnText}>Reset App Data</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: { paddingBottom: 40 },

  // Header (dark navy)
  header: {
    backgroundColor: "#0F172A",
    paddingTop: 58,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 16,
    gap: 6,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(34,197,94,0.2)",
    borderWidth: 3,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  teamName: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
  teamId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 18,
  },

  // Quick stats bar
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  statLabel: { fontSize: 10, color: "#94A3B8", marginTop: 2, fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },

  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  // Badge grid (4 per row)
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeTile: {
    width: "22%",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1.5,
    gap: 4,
    minHeight: 80,
    justifyContent: "center",
  },
  badgeName: {
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 12,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },

  // Team members
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  memberGrade: { fontSize: 12, color: "#94A3B8", marginTop: 1 },

  // Activity history
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  historyMeta: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  historyXP: { alignItems: "flex-end" },
  historyXPValue: { fontSize: 16, fontWeight: "800", color: "#22C55E" },
  historyXPLabel: { fontSize: 10, color: "#94A3B8" },

  // Reset button
  resetBtn: {
    marginHorizontal: 16,
    marginTop: 6,
    padding: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  resetBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resetBtnText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
  pressed: { opacity: 0.8 },
});
