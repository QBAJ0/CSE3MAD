// app/(tabs)/profile.tsx

import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BADGES,
  RARITY_BG,
  RARITY_BORDER,
  RARITY_COLOR,
} from "../../src/config/badges";
import { useTeam } from "../../src/context/TeamContext";
import { getChallengeById } from "../../src/data/challenges";
import { ActivityResult } from "../../src/types";
import { storage } from "../../src/utils/storage";

const AVATAR_COLORS = [
  "#22C55E",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
];

export default function ProfileScreen() {
  const { team, clearTeamData } = useTeam();

  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [recentActivities, setRecentActivities] = useState<ActivityResult[]>(
    [],
  );
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  const isFirstLoad = useRef(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (isFirstLoad.current) setLoading(true);

        const [badges, activities] = await Promise.all([
          storage.getEarnedBadges(),
          storage.getCompletedActivities(),
        ]);

        const sorted = [...activities].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setEarnedBadgeIds(new Set(badges));
        setRecentActivities(sorted);
        setTotalXP(activities.reduce((sum, a) => sum + (a.points ?? 0), 0));

        setLoading(false);
        isFirstLoad.current = false;
      };

      load();
    }, []),
  );

  const handleReset = () => {
    Alert.alert("Reset App", "This will erase all data and return to setup.", [
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
    ]);
  };

  const hasVideoEvidence = (activity: ActivityResult) =>
    activity.prototypes.some((p) => Boolean(p.measurements.video));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Ionicons name="flask" size={40} color="#22C55E" />
        </View>

        <Text style={styles.teamName}>{team?.teamName ?? "My Team"}</Text>
        <Text style={styles.teamId}>{team?.discriminator ?? "—"}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statValue}>{recentActivities.length}</Text>
            <Text style={styles.statLabel}>Experiments</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statValue}>{earnedBadgeIds.size}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="construct-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Data & tools</Text>
        </View>
        <Text style={styles.toolsHint}>
          Local lab saves, SQLite checks, and account sign-in (optional).
        </Text>

        <Pressable
          style={({ pressed }) => [styles.toolRow, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/activities")}
        >
          <Ionicons name="flask-outline" size={20} color="#0F172A" />
          <Text style={styles.toolLabel}>Lab activities</Text>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.toolRow, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/results")}
        >
          <Ionicons name="document-text-outline" size={20} color="#0F172A" />
          <Text style={styles.toolLabel}>Lab results (SQLite)</Text>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.toolRow, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/sqlite-test")}
        >
          <Ionicons name="hardware-chip-outline" size={20} color="#0F172A" />
          <Text style={styles.toolLabel}>SQLite check</Text>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.toolRow, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/auth")}
        >
          <Ionicons name="log-in-outline" size={20} color="#0F172A" />
          <Text style={styles.toolLabel}>Email sign-in</Text>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>
      </View>

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
                      color: isEarned ? RARITY_COLOR[badge.rarity] : "#94A3B8",
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
                {
                  backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
                },
              ]}
            >
              <Text style={styles.memberInitial}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberGrade}>
                {member.grade || member.year || "Student"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="time-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Results History</Text>
        </View>

        {recentActivities.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons name="flask-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyActivityText}>No experiments yet</Text>
            <Text style={styles.emptyActivitySub}>
              Complete a challenge to see saved results here.
            </Text>
          </View>
        ) : (
          recentActivities.map((activity) => {
            const challenge = getChallengeById(activity.challengeId);
            if (!challenge) return null;

            const date = new Date(activity.createdAt).toLocaleDateString(
              "en-AU",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              },
            );

            const videoAttached = hasVideoEvidence(activity);
            const gpsAttached = Boolean(activity.location);

            return (
              <TouchableOpacity
                key={activity.id}
                style={styles.historyCard}
                onPress={() =>
                  router.push(`/challenge/${activity.challengeId}/details?resultId=${activity.id}`)
                }
                activeOpacity={0.85}
              >
                <View style={styles.historyTopRow}>
                  <View style={styles.historyIcon}>
                    <Ionicons
                      name={challenge.icon as any}
                      size={22}
                      color="#22C55E"
                    />
                  </View>

                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>{challenge.title}</Text>
                    <Text style={styles.historyMeta}>
                      {date} ·{" "}
                      {activity.difficulty === "highSchool"
                        ? "High School"
                        : "Primary"}
                    </Text>
                  </View>

                  <View style={styles.historyXP}>
                    <Text style={styles.historyXPValue}>
                      +{activity.points ?? 0}
                    </Text>
                    <Text style={styles.historyXPLabel}>XP</Text>
                  </View>
                </View>

                <View style={styles.historyDetailsRow}>
                  <View style={styles.historyBadge}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.historyBadgeText}>
                      {activity.rating}/5
                    </Text>
                  </View>

                  <View style={styles.historyBadge}>
                    <Ionicons
                      name="construct-outline"
                      size={13}
                      color="#64748B"
                    />
                    <Text style={styles.historyBadgeText}>
                      {activity.prototypes.length} design
                      {activity.prototypes.length === 1 ? "" : "s"}
                    </Text>
                  </View>

                  {videoAttached && (
                    <View style={styles.videoBadge}>
                      <Ionicons name="videocam" size={13} color="#0369A1" />
                      <Text style={styles.videoBadgeText}>Video saved</Text>
                    </View>
                  )}

                  {gpsAttached && (
                    <View style={styles.gpsBadge}>
                      <Ionicons name="location" size={13} color="#166534" />
                      <Text style={styles.gpsBadgeText}>GPS</Text>
                    </View>
                  )}
                </View>

                {activity.reflection ? (
                  <Text style={styles.historyReflection} numberOfLines={2}>
                    {activity.reflection}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </View>

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

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

  teamName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  teamId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#22C55E",
    marginBottom: 18,
  },

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

  stat: {
    alignItems: "center",
    flex: 1,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  statLabel: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "600",
  },

  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

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
    marginBottom: 12,
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

  toolsHint: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 12,
  },

  toolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  toolLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

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

  memberInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  memberGrade: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 1,
  },

  historyCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  historyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },

  historyInfo: {
    flex: 1,
  },

  historyName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },

  historyMeta: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
  },

  historyXP: {
    alignItems: "flex-end",
  },

  historyXPValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#22C55E",
  },

  historyXPLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
  },

  historyDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  historyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  historyBadgeText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "700",
  },

  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },

  videoBadgeText: {
    fontSize: 11,
    color: "#0369A1",
    fontWeight: "800",
  },

  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  gpsBadgeText: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "800",
  },

  historyReflection: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
  },

  emptyActivity: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },

  emptyActivityText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#94A3B8",
  },

  emptyActivitySub: {
    fontSize: 13,
    color: "#CBD5E1",
    textAlign: "center",
  },

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

  resetBtnText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 15,
  },

  pressed: {
    opacity: 0.8,
  },
});
