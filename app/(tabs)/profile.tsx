// app/(tabs)/profile.tsx

import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { BatteryStatusCard } from "../../src/components/BatteryStatusCard";
import { useTeam } from "../../src/context/TeamContext";
import { getChallengeById } from "../../src/data/challenges";
import { ActivityResult } from "../../src/types";
import { scheduleStreakReminder, cancelStreakReminder } from "../../src/utils/notifications";
import { DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE, storage } from "../../src/utils/storage";

const AVATAR_COLORS = [
  "#0F766E",
  "#2563EB",
  "#FED7AA",
  "#F97316",
  "#0F766E",
  "#2563EB",
];

export default function ProfileScreen() {
  const { team, clearTeamData } = useTeam();

  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [recentActivities, setRecentActivities] = useState<ActivityResult[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reminderHour, setReminderHour] = useState(DEFAULT_REMINDER_HOUR);
  const [reminderMinute, setReminderMinute] = useState(DEFAULT_REMINDER_MINUTE);

  const isFirstLoad = useRef(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (isFirstLoad.current) setLoading(true);

        const [badges, activities, savedHour, savedMinute] = await Promise.all([
          storage.getEarnedBadges(),
          storage.getCompletedActivities(),
          storage.getReminderHour(),
          storage.getReminderMinute(),
        ]);

        const sorted = [...activities].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setEarnedBadgeIds(new Set(badges));
        setRecentActivities(sorted);
        setTotalXP(activities.reduce((sum, a) => sum + (a.points ?? 0), 0));
        setReminderHour(savedHour);
        setReminderMinute(savedMinute);

        setLoading(false);
        isFirstLoad.current = false;
      };

      load();
    }, []),
  );

  const handleSaveReminderTime = async (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    await Promise.all([
      storage.saveReminderHour(hour),
      storage.saveReminderMinute(minute),
    ]);
    const streak = await storage.getStreak();
    if (streak > 0) {
      scheduleStreakReminder(streak, hour, minute).catch(console.error);
    } else {
      cancelStreakReminder().catch(console.error);
    }
  };

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
    activity.prototypes.some((p) =>
      Object.entries(p.measurements).some(
        ([key, value]) => key.toLowerCase().includes("video") && Boolean(value),
      ),
    );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
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
          <Ionicons name="flask" size={40} color="#FED7AA" />
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

      <BatteryStatusCard />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="ribbon-outline" size={16} color="#0F766E" />
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
                      : "#FFF7ED",
                    borderColor: isEarned
                      ? RARITY_BORDER[badge.rarity]
                      : "#FFF7ED",
                    opacity: isEarned ? 1 : 0.5,
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
          <Ionicons name="people-outline" size={16} color="#0F766E" />
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
          <Ionicons name="time-outline" size={16} color="#0F766E" />
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
                      color="#2563EB"
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
                    <Ionicons name="star" size={13} color="#F97316" />
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
                      <Ionicons name="videocam" size={13} color="#0F766E" />
                      <Text style={styles.videoBadgeText}>Video saved</Text>
                    </View>
                  )}

                  {gpsAttached && (
                    <View style={styles.gpsBadge}>
                      <Ionicons name="location" size={13} color="#0F766E" />
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

      <NotificationTimeCard
        initialHour={reminderHour}
        initialMinute={reminderMinute}
        onSave={handleSaveReminderTime}
      />

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

function fmt12(hour: number, minute: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  return `${h}:${m} ${period}`;
}

function NotificationTimeCard({
  initialHour,
  initialMinute,
  onSave,
}: {
  initialHour: number;
  initialMinute: number;
  onSave: (hour: number, minute: number) => void;
}) {
  const [mode, setMode] = useState<"time" | "duration">("time");

  const toH12 = (h: number) => h % 12 || 12;
  const [hour12, setHour12] = useState(toH12(initialHour));
  const [minute, setMinute] = useState(initialMinute);
  const [isPM, setIsPM] = useState(initialHour >= 12);

  useEffect(() => {
    setHour12(toH12(initialHour));
    setMinute(initialMinute);
    setIsPM(initialHour >= 12);
  }, [initialHour, initialMinute]);

  const [durationHrs, setDurationHrs] = useState(2);

  const durationHour = () => {
    const now = new Date();
    return (now.getHours() + durationHrs) % 24;
  };

  const handleSave = () => {
    if (mode === "time") {
      const h24 = isPM ? (hour12 === 12 ? 12 : hour12 + 12) : hour12 === 12 ? 0 : hour12;
      onSave(h24, minute);
    } else {
      onSave(durationHour(), 0);
    }
  };

  const stepMinute = (dir: 1 | -1) => setMinute((m) => (m + dir * 15 + 60) % 60);
  const stepHour = (dir: 1 | -1) => setHour12((h) => (h - 1 + dir + 12) % 12 + 1);
  const stepDuration = (dir: 1 | -1) =>
    setDurationHrs((d) => Math.min(12, Math.max(1, d + dir)));

  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <Ionicons name="notifications-outline" size={16} color="#0F766E" />
        <Text style={styles.cardTitle}>Streak Reminder Time</Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "time" && styles.modeBtnActive]}
          onPress={() => setMode("time")}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeBtnText, mode === "time" && styles.modeBtnTextActive]}>
            Set a time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "duration" && styles.modeBtnActive]}
          onPress={() => setMode("duration")}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeBtnText, mode === "duration" && styles.modeBtnTextActive]}>
            In X hours
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "time" ? (
        <View style={styles.pickerRow}>
          {/* Hour */}
          <View style={styles.spinnerCol}>
            <TouchableOpacity onPress={() => stepHour(1)} style={styles.spinnerBtn}>
              <Ionicons name="chevron-up" size={20} color="#0F766E" />
            </TouchableOpacity>
            <Text style={styles.spinnerValue}>{hour12.toString().padStart(2, "0")}</Text>
            <TouchableOpacity onPress={() => stepHour(-1)} style={styles.spinnerBtn}>
              <Ionicons name="chevron-down" size={20} color="#0F766E" />
            </TouchableOpacity>
          </View>

          <Text style={styles.timeSeparator}>:</Text>

          {/* Minute */}
          <View style={styles.spinnerCol}>
            <TouchableOpacity onPress={() => stepMinute(1)} style={styles.spinnerBtn}>
              <Ionicons name="chevron-up" size={20} color="#0F766E" />
            </TouchableOpacity>
            <Text style={styles.spinnerValue}>{minute.toString().padStart(2, "0")}</Text>
            <TouchableOpacity onPress={() => stepMinute(-1)} style={styles.spinnerBtn}>
              <Ionicons name="chevron-down" size={20} color="#0F766E" />
            </TouchableOpacity>
          </View>

          {/* AM/PM */}
          <TouchableOpacity
            style={styles.ampmBtn}
            onPress={() => setIsPM((p) => !p)}
            activeOpacity={0.8}
          >
            <Text style={styles.ampmText}>{isPM ? "PM" : "AM"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.durationRow}>
          <Text style={styles.durationLabel}>Remind me in</Text>
          <View style={styles.durationStepper}>
            <TouchableOpacity onPress={() => stepDuration(-1)} style={styles.stepBtn}>
              <Ionicons name="remove" size={20} color="#0F766E" />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{durationHrs}h</Text>
            <TouchableOpacity onPress={() => stepDuration(1)} style={styles.stepBtn}>
              <Ionicons name="add" size={20} color="#0F766E" />
            </TouchableOpacity>
          </View>
          <Text style={styles.durationResult}>
            → {fmt12(durationHour(), 0)}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.saveReminderBtn} onPress={handleSave} activeOpacity={0.85}>
        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
        <Text style={styles.saveReminderText}>Save Reminder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },

  content: {
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },

  header: {
    backgroundColor: "#0F766E",
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
    backgroundColor: "rgba(255,202,167,0.2)",
    borderWidth: 3,
    borderColor: "#FED7AA",
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
    color: "#FED7AA",
    marginBottom: 18,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
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
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    fontWeight: "600",
  },

  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFF7ED",
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
    color: "#0F766E",
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
    borderBottomColor: "#FFF7ED",
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
    color: "#0F766E",
  },

  memberGrade: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 1,
  },

  historyCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFF7ED",
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  historyInfo: {
    flex: 1,
  },

  historyName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
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
    color: "#F97316",
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
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FFF7ED",
  },

  historyBadgeText: {
    fontSize: 11,
    color: "#0F766E",
    fontWeight: "700",
  },

  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#2563EB",
  },

  videoBadgeText: {
    fontSize: 11,
    color: "#0F766E",
    fontWeight: "800",
  },

  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#2563EB",
  },

  gpsBadgeText: {
    fontSize: 11,
    color: "#0F766E",
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

  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  modeBtnTextActive: {
    color: "#0F766E",
    fontWeight: "700",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  spinnerCol: {
    alignItems: "center",
    gap: 4,
  },
  spinnerBtn: {
    padding: 6,
  },
  spinnerValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#0F766E",
    minWidth: 54,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F766E",
    marginBottom: 4,
  },
  ampmBtn: {
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 4,
  },
  ampmText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F766E",
  },
  durationRow: {
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  durationLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  durationStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F766E",
    minWidth: 56,
    textAlign: "center",
  },
  durationResult: {
    fontSize: 13,
    color: "#F97316",
    fontWeight: "700",
  },
  saveReminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 12,
  },
  saveReminderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
