// app/(tabs)/home.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdMobBanner } from "../../src/components/AdMobBanner";
import { useTeam } from "../../src/context/TeamContext";
import { CHALLENGES } from "../../src/data/challenges";
import { useActivityCompletion } from "../../src/hooks/useActivityCompletion";
import { useHomeStats } from "../../src/hooks/useHomeStats";
import { useStreakReminder } from "../../src/hooks/useStreakReminder";
import type { ColorTokens } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/themeContext";

const AVATAR_COLORS = [
  "#0F766E", "#2563EB", "#FED7AA", "#F97316", "#0F766E", "#2563EB",
];

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function HomeScreen() {
  const { team } = useTeam();
  const { streak, loading: statsLoading } = useHomeStats();
  const { completedIds, loading: activityLoading } = useActivityCompletion();
  const { showReminder } = useStreakReminder();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const dataLoading = statsLoading || activityLoading;
  const nextChallenge = CHALLENGES.find((c) => !completedIds.has(c.id));
  const allDone = completedIds.size >= CHALLENGES.length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hey, {team?.teamName ?? "Scientists"}!
        </Text>
        <Text style={styles.subGreeting}>
          {allDone
            ? "You've conquered all 7 challenges!"
            : `${CHALLENGES.length - completedIds.size} challenge${
                CHALLENGES.length - completedIds.size !== 1 ? "s" : ""
              } left to conquer`}
        </Text>

        {streak > 0 && (
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={14} color="#FED7AA" />
            <Text style={styles.streakText}>{streak}-day streak</Text>
          </View>
        )}
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <StatCard
          iconName="checkmark-circle"
          iconColor={colors.info}
          value={`${completedIds.size}/${CHALLENGES.length}`}
          label="Challenges"
          valueColor={colors.info}
          loading={dataLoading}
          colors={colors}
        />
        <StatCard
          iconName="flame"
          iconColor={colors.cta}
          value={String(streak)}
          label="Day Streak"
          valueColor={colors.cta}
          loading={dataLoading}
          colors={colors}
        />
        <StatCard
          iconName="people"
          iconColor="#FED7AA"
          value={String(team?.members.length ?? 0)}
          label="Members"
          valueColor={colors.primary}
          loading={dataLoading}
          colors={colors}
        />
      </View>

      {/* ── Challenge reminder ── */}
      {showReminder && nextChallenge && (
        <View style={styles.challengeReminderCard}>
          <View style={styles.reminderContent}>
            <View style={styles.reminderLeft}>
              <Ionicons name="alert-circle" size={24} color={colors.cta} />
            </View>
            <View style={styles.reminderMiddle}>
              <Text style={styles.challengeReminderTitle}>Challenge Reminder</Text>
              <Text style={styles.reminderText}>
                Ready for your next challenge: {nextChallenge.title}?
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.reminderButton}
            onPress={() => router.push(`/challenge/${nextChallenge.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.reminderButtonText}>Start Challenge</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Next challenge card ── */}
      {nextChallenge && !allDone && (
        <TouchableOpacity
          style={styles.nextCard}
          onPress={() => router.push(`/challenge/${nextChallenge.id}`)}
          activeOpacity={0.88}
        >
          <View style={styles.nextCardInner}>
            <View style={styles.nextCardText}>
              <Text style={styles.nextCardLabel}>UP NEXT</Text>
              <View style={styles.nextCardTitleRow}>
                <Ionicons name={nextChallenge.icon as any} size={20} color="#FFFFFF" />
                <Text style={styles.nextCardTitle}>{nextChallenge.title}</Text>
              </View>
              <Text style={styles.nextCardMeta}>
                {nextChallenge.estimatedMinutes} min  ·  {nextChallenge.category}
              </Text>
            </View>
            <View style={styles.nextArrow}>
              <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ── All done celebration ── */}
      {allDone && (
        <View style={styles.allDoneCard}>
          <Ionicons name="trophy" size={40} color={colors.cta} />
          <Text style={styles.allDoneTitle}>All challenges complete!</Text>
          <Text style={styles.allDoneSub}>
            Your team is unstoppable. Check the leaderboard!
          </Text>
        </View>
      )}

      {/* ── Your squad ── */}
      <View style={styles.squadCard}>
        <View style={styles.squadTitleRow}>
          <Ionicons name="people" size={16} color={colors.primary} />
          <Text style={styles.squadTitle}>Your Squad</Text>
        </View>
        <View style={styles.memberList}>
          {team?.members.map((member, index) => (
            <View key={index} style={styles.memberItem}>
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
              <Text style={styles.memberName} numberOfLines={1}>
                {member.name}
              </Text>
              {member.grade ? (
                <Text style={styles.memberGrade}>{member.grade}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      <AdMobBanner />
    </ScrollView>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  iconName,
  iconColor,
  value,
  label,
  valueColor,
  loading,
  colors,
}: {
  iconName: IoniconName;
  iconColor: string;
  value: string;
  label: string;
  valueColor: string;
  loading?: boolean;
  colors: ColorTokens;
}) {
  return (
    <View style={[statCardStyle.card, { backgroundColor: colors.surface, borderColor: colors.borderFaint }]}>
      <Ionicons name={iconName} size={22} color={iconColor} />
      <Text style={[statCardStyle.value, { color: loading ? colors.border : valueColor }]}>
        {loading ? "—" : value}
      </Text>
      <Text style={[statCardStyle.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const statCardStyle = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  value: { fontSize: 22, fontWeight: "800" },
  label: { fontSize: 11, fontWeight: "600" },
});

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: 40 },

    header: {
      backgroundColor: c.header,
      paddingTop: 58,
      paddingBottom: 24,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      marginBottom: 16,
      gap: 6,
    },
    greeting: { fontSize: 26, fontWeight: "800", color: c.headerText },
    subGreeting: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
    streakRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
    streakText: { fontSize: 14, fontWeight: "700", color: "#FED7AA" },

    statsRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      marginTop: 12,
      marginBottom: 16,
    },

    nextCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: c.cta,
      borderRadius: 20,
      overflow: "hidden",
    },
    nextCardInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
    },
    nextCardText: { flex: 1 },
    nextCardLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: "rgba(255,255,255,0.7)",
      letterSpacing: 2,
      marginBottom: 4,
    },
    nextCardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    nextCardTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", flex: 1 },
    nextCardMeta: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
    nextArrow: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
    },

    challengeReminderCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.ctaLight,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 12,
    },
    reminderContent: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    reminderLeft: { paddingTop: 2 },
    reminderMiddle: { flex: 1, gap: 2 },
    challengeReminderTitle: { fontSize: 14, fontWeight: "700", color: c.cta },
    reminderText: { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
    reminderButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.cta,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      gap: 4,
      alignSelf: "flex-start",
    },
    reminderButtonText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

    allDoneCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 22,
      alignItems: "center",
      gap: 8,
      borderWidth: 2,
      borderColor: c.primary,
    },
    allDoneTitle: { fontSize: 18, fontWeight: "800", color: c.primary },
    allDoneSub: { fontSize: 13, color: c.textSecondary, textAlign: "center" },

    squadCard: {
      marginHorizontal: 16,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.borderFaint,
    },
    squadTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    squadTitle: { fontSize: 16, fontWeight: "800", color: c.primary },
    memberList: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
    memberItem: { alignItems: "center", minWidth: 56 },
    memberAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    memberInitial: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
    memberName: {
      fontSize: 12,
      fontWeight: "600",
      color: c.primary,
      maxWidth: 60,
      textAlign: "center",
    },
    memberGrade: { fontSize: 10, color: c.textMuted, marginTop: 1 },
  });
}
