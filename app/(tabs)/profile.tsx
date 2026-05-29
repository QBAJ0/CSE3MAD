// app/(tabs)/profile.tsx

import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { BatteryStatusCard } from "../../src/components/BatteryStatusCard";
import { useTeam } from "../../src/context/TeamContext";
import { CHALLENGES, getChallengeById } from "../../src/data/challenges";
import type { ColorTokens } from "../../src/theme/colors";
import { getChallengeAccent } from "../../src/utils/challengeAccent";
import { AppearanceSetting, useTheme } from "../../src/theme/themeContext";
import { ActivityResult } from "../../src/types";
import { scheduleStreakReminder, cancelStreakReminder } from "../../src/utils/notifications";
import { DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE, storage } from "../../src/utils/storage";

const AVATAR_COLORS = [
  "#0F766E", "#2563EB", "#FED7AA", "#F97316", "#0F766E", "#2563EB",
];

const APPEARANCE_OPTIONS: { value: AppearanceSetting; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark",  label: "Dark",  icon: "moon-outline" },
  { value: "system",label: "System",icon: "phone-portrait-outline" },
];

export default function ProfileScreen() {
  const { team, clearTeamData } = useTeam();
  const { colors, appearance, setAppearance } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [recentActivities, setRecentActivities] = useState<ActivityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminderHour, setReminderHour] = useState(DEFAULT_REMINDER_HOUR);
  const [reminderMinute, setReminderMinute] = useState(DEFAULT_REMINDER_MINUTE);

  const isFirstLoad = useRef(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (isFirstLoad.current) setLoading(true);

        const [activities, savedHour, savedMinute] = await Promise.all([
          storage.getCompletedActivities(),
          storage.getReminderHour(),
          storage.getReminderMinute(),
        ]);

        const sorted = [...activities].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setRecentActivities(sorted);
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
        <ActivityIndicator size="large" color={colors.info} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Profile header ── */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Ionicons name="flask" size={40} color="#FED7AA" />
        </View>

        <Text style={styles.teamName}>{team?.teamName ?? "My Team"}</Text>
        <Text style={styles.teamId}>{team?.discriminator ?? "—"}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{recentActivities.length}</Text>
            <Text style={styles.statLabel}>Experiments</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {new Set(recentActivities.map((a) => a.challengeId)).size}
            </Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
        </View>
      </View>

      {/* ── Preferences (Appearance) ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="settings-outline" size={16} color={colors.primary} />
          <Text style={styles.cardTitle}>Preferences</Text>
        </View>

        <Text style={styles.prefLabel}>Appearance</Text>
        <View style={styles.segmentedControl}>
          {APPEARANCE_OPTIONS.map((opt) => {
            const isActive = appearance === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.segmentOption, isActive && styles.segmentOptionActive]}
                onPress={() => setAppearance(opt.value)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={14}
                  color={isActive ? "#FFFFFF" : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <BatteryStatusCard />

      {/* ── Completed challenges ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.cardTitle}>Completed Challenges</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {new Set(recentActivities.map((a) => a.challengeId)).size}/{CHALLENGES.length} done
          </Text>
        </View>

        <View style={styles.badgeGrid}>
          {CHALLENGES.map((challenge) => {
            const isDone = recentActivities.some((a) => a.challengeId === challenge.id);
            const accent = getChallengeAccent(challenge);
            return (
              <View
                key={challenge.id}
                style={[
                  styles.badgeTile,
                  {
                    backgroundColor: isDone ? accent.tint : colors.backgroundSecondary,
                    borderColor: isDone ? accent.border : colors.border,
                    opacity: isDone ? 1 : 0.45,
                  },
                ]}
              >
                <Ionicons
                  name={challenge.icon as any}
                  size={24}
                  color={isDone ? accent.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.badgeName,
                    { color: isDone ? accent.accent : colors.textMuted },
                  ]}
                  numberOfLines={2}
                >
                  {challenge.title}
                </Text>
                {isDone && (
                  <View style={[styles.rarityDot, { backgroundColor: accent.accent }]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Team members ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="people-outline" size={16} color={colors.primary} />
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
              <Text style={styles.memberGrade}>
                {member.grade || "Student"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Results history ── */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.cardTitle}>Results History</Text>
        </View>

        {recentActivities.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons name="flask-outline" size={32} color={colors.border} />
            <Text style={styles.emptyActivityText}>No experiments yet</Text>
            <Text style={styles.emptyActivitySub}>
              Complete a challenge to see saved results here.
            </Text>
          </View>
        ) : (
          recentActivities.map((activity) => {
            const challenge = getChallengeById(activity.challengeId);
            if (!challenge) return null;

            const accent = getChallengeAccent(challenge);

            const date = new Date(activity.createdAt).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const videoAttached = hasVideoEvidence(activity);
            const gpsAttached = Boolean(activity.location);

            return (
              <View key={activity.id} style={styles.historyCard}>
                <View style={styles.historyTopRow}>
                  <View style={[styles.historyIcon, { backgroundColor: accent.tint }]}>
                    <Ionicons name={challenge.icon as any} size={22} color={accent.accent} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>{challenge.title}</Text>
                    <Text style={styles.historyMeta}>{date}</Text>
                  </View>
                </View>

                <View style={styles.historyDetailsRow}>
                  <View style={styles.historyBadge}>
                    <Ionicons name="star" size={13} color={colors.cta} />
                    <Text style={styles.historyBadgeText}>{activity.rating}/5</Text>
                  </View>
                  <View style={styles.historyBadge}>
                    <Ionicons name="construct-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.historyBadgeText}>
                      {activity.prototypes.length} design
                      {activity.prototypes.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                  {videoAttached && (
                    <View style={[styles.historyBadge, { borderColor: colors.info }]}>
                      <Ionicons name="videocam" size={13} color={colors.primary} />
                      <Text style={styles.historyBadgeText}>Video saved</Text>
                    </View>
                  )}
                  {gpsAttached && (
                    <View style={[styles.historyBadge, { borderColor: colors.info }]}>
                      <Ionicons name="location" size={13} color={colors.primary} />
                      <Text style={styles.historyBadgeText}>GPS</Text>
                    </View>
                  )}
                </View>

                {activity.reflection ? (
                  <Text style={styles.historyReflection} numberOfLines={2}>
                    {activity.reflection}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      {/* ── Notification reminder ── */}
      <NotificationTimeCard
        initialHour={reminderHour}
        initialMinute={reminderMinute}
        onSave={handleSaveReminderTime}
      />

      {/* ── Reset ── */}
      <Pressable
        style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
        onPress={handleReset}
      >
        <View style={styles.resetBtnRow}>
          <Ionicons name="warning-outline" size={15} color={colors.danger} />
          <Text style={styles.resetBtnText}>Reset App Data</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

// ── NotificationTimeCard ──────────────────────────────────────────────────────

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        <Ionicons name="notifications-outline" size={16} color={colors.primary} />
        <Text style={styles.cardTitle}>Challenge Reminder</Text>
      </View>

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
          <View style={styles.spinnerCol}>
            <TouchableOpacity onPress={() => stepHour(1)} style={styles.spinnerBtn}>
              <Ionicons name="chevron-up" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.spinnerValue}>{hour12.toString().padStart(2, "0")}</Text>
            <TouchableOpacity onPress={() => stepHour(-1)} style={styles.spinnerBtn}>
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.timeSeparator}>:</Text>

          <View style={styles.spinnerCol}>
            <TouchableOpacity onPress={() => stepMinute(1)} style={styles.spinnerBtn}>
              <Ionicons name="chevron-up" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.spinnerValue}>{minute.toString().padStart(2, "0")}</Text>
            <TouchableOpacity onPress={() => stepMinute(-1)} style={styles.spinnerBtn}>
              <Ionicons name="chevron-down" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

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
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.stepValue}>{durationHrs}h</Text>
            <TouchableOpacity onPress={() => stepDuration(1)} style={styles.stepBtn}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.durationResult}>→ {fmt12(durationHour(), 0)}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.saveReminderBtn} onPress={handleSave} activeOpacity={0.85}>
        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
        <Text style={styles.saveReminderText}>Save Reminder</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: 40 },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
    },

    header: {
      backgroundColor: c.header,
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
    teamName: { fontSize: 24, fontWeight: "800", color: "#FFFFFF" },
    teamId: { fontSize: 13, fontWeight: "700", color: "#FED7AA", marginBottom: 18 },
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
    stat: { alignItems: "center", flex: 1 },
    statValue: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
    statLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: "600" },
    statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
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
    cardTitle: { fontSize: 16, fontWeight: "800", color: c.primary },
    cardSubtitle: { fontSize: 12, color: c.textMuted, fontWeight: "600" },

    // Preferences section
    prefLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textSecondary,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: c.backgroundSecondary,
      borderRadius: 12,
      padding: 3,
    },
    segmentOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 10,
      borderRadius: 10,
    },
    segmentOptionActive: {
      backgroundColor: c.primary,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    segmentText: { fontSize: 13, fontWeight: "600", color: c.textSecondary },
    segmentTextActive: { color: "#FFFFFF", fontWeight: "700" },


    badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
    badgeName: { fontSize: 9, fontWeight: "700", textAlign: "center", lineHeight: 12 },
    rarityDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },

    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.borderFaint,
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
    memberName: { fontSize: 15, fontWeight: "700", color: c.primary },
    memberGrade: { fontSize: 12, color: c.textMuted, marginTop: 1 },

    historyCard: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    historyTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    historyIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    historyInfo: { flex: 1 },
    historyName: { fontSize: 14, fontWeight: "800", color: c.primary },
    historyMeta: { fontSize: 11, color: c.textMuted, marginTop: 3 },
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
      backgroundColor: c.surface,
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: c.border,
    },
    historyBadgeText: { fontSize: 11, color: c.primary, fontWeight: "700" },
    historyReflection: {
      marginTop: 10,
      fontSize: 12,
      color: c.textSecondary,
      lineHeight: 17,
    },

    emptyActivity: { alignItems: "center", paddingVertical: 24, gap: 8 },
    emptyActivityText: { fontSize: 15, fontWeight: "700", color: c.textMuted },
    emptyActivitySub: { fontSize: 13, color: c.border, textAlign: "center" },

    resetBtn: {
      marginHorizontal: 16,
      marginTop: 6,
      padding: 16,
      backgroundColor: c.dangerLight,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.danger,
    },
    resetBtnRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    resetBtnText: { color: c.danger, fontWeight: "700", fontSize: 15 },
    pressed: { opacity: 0.8 },

    // Notification card
    modeToggle: {
      flexDirection: "row",
      backgroundColor: c.backgroundSecondary,
      borderRadius: 12,
      padding: 3,
      marginBottom: 16,
    },
    modeBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
    modeBtnActive: {
      backgroundColor: c.surface,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    modeBtnText: { fontSize: 13, fontWeight: "600", color: c.textMuted },
    modeBtnTextActive: { color: c.primary, fontWeight: "700" },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginBottom: 16,
    },
    spinnerCol: { alignItems: "center", gap: 4 },
    spinnerBtn: { padding: 6 },
    spinnerValue: {
      fontSize: 36,
      fontWeight: "800",
      color: c.primary,
      minWidth: 54,
      textAlign: "center",
    },
    timeSeparator: { fontSize: 32, fontWeight: "800", color: c.primary, marginBottom: 4 },
    ampmBtn: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginLeft: 4,
    },
    ampmText: { fontSize: 16, fontWeight: "800", color: c.primary },
    durationRow: { alignItems: "center", gap: 10, marginBottom: 16 },
    durationLabel: { fontSize: 14, color: c.textSecondary, fontWeight: "600" },
    durationStepper: { flexDirection: "row", alignItems: "center", gap: 16 },
    stepBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    stepValue: {
      fontSize: 28,
      fontWeight: "800",
      color: c.primary,
      minWidth: 56,
      textAlign: "center",
    },
    durationResult: { fontSize: 13, color: c.cta, fontWeight: "700" },
    saveReminderBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: c.cta,
      borderRadius: 12,
      paddingVertical: 12,
    },
    saveReminderText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  });
}
