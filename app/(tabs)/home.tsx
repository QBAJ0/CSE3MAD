// app/(tabs)/home.tsx
// The main home screen shown after a team is set up.
// Shows team greeting, XP progress, stats, next challenge, and quick nav links.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTeam } from "../../src/context/TeamContext";
import { CHALLENGES } from "../../src/data/challenges";
import { useActivityCompletion } from "../../src/hooks/useActivityCompletion";
import { useHomeStats } from "../../src/hooks/useHomeStats";

const XP_PER_LEVEL = 500;

const AVATAR_COLORS = [
  "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4",
];

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function HomeScreen() {
  const { team } = useTeam();
  const { totalPoints, completedCount, streak } = useHomeStats();
  const { completedIds } = useActivityCompletion();

  const nextChallenge = CHALLENGES.find((c) => !completedIds.has(c.id));
  const allDone = completedCount >= CHALLENGES.length;

  const level = Math.floor(totalPoints / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalPoints % XP_PER_LEVEL;
  const xpPercent = Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Level badge */}
        <View style={styles.levelBadge}>
          <Ionicons name="star" size={11} color="#22C55E" />
          <Text style={styles.levelBadgeText}>Level {level}</Text>
        </View>

        <Text style={styles.greeting}>
          Hey, {team?.teamName ?? "Scientists"}!
        </Text>
        <Text style={styles.subGreeting}>
          {allDone
            ? "You've conquered all 7 challenges!"
            : `${CHALLENGES.length - completedCount} challenge${
                CHALLENGES.length - completedCount !== 1 ? "s" : ""
              } left to conquer`}
        </Text>

        {streak > 0 && (
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={14} color="#F59E0B" />
            <Text style={styles.streakText}>{streak}-day streak</Text>
          </View>
        )}
      </View>

      {/* ── XP progress bar ── */}
      <View style={styles.xpSection}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpLabel}>XP Progress</Text>
          <Text style={styles.xpLabel}>
            {xpIntoLevel} / {XP_PER_LEVEL} XP
          </Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${xpPercent}%` }]} />
        </View>
      </View>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <StatCard
          iconName="checkmark-circle"
          iconColor="#22C55E"
          value={`${completedCount}/${CHALLENGES.length}`}
          label="Challenges"
          valueColor="#22C55E"
        />
        <StatCard
          iconName="flash"
          iconColor="#F59E0B"
          value={String(totalPoints)}
          label="Total XP"
          valueColor="#F59E0B"
        />
        <StatCard
          iconName="people"
          iconColor="#3B82F6"
          value={String(team?.members.length ?? 0)}
          label="Members"
          valueColor="#3B82F6"
        />
      </View>

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
          <Ionicons name="trophy" size={40} color="#22C55E" />
          <Text style={styles.allDoneTitle}>All challenges complete!</Text>
          <Text style={styles.allDoneSub}>
            Your team is unstoppable. Check the leaderboard!
          </Text>
        </View>
      )}

      {/* ── Your squad ── */}
      <View style={styles.squadCard}>
        <View style={styles.squadTitleRow}>
          <Ionicons name="people" size={16} color="#0F172A" />
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

      {/* ── Quick navigation buttons ── */}
      <View style={styles.quickRow}>
        <QuickBtn
          iconName="flash-outline"
          label="Challenges"
          onPress={() => router.push("/(tabs)/activity")}
        />
        <QuickBtn
          iconName="trophy-outline"
          label="Leaderboard"
          onPress={() => router.push("/(tabs)/leaderboard")}
        />
        <QuickBtn
          iconName="person-outline"
          label="Profile"
          onPress={() => router.push("/(tabs)/profile")}
        />
      </View>
    </ScrollView>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  iconName,
  iconColor,
  value,
  label,
  valueColor,
}: {
  iconName: IoniconName;
  iconColor: string;
  value: string;
  label: string;
  valueColor: string;
}) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={iconName} size={22} color={iconColor} />
      <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

// ── Quick nav button ─────────────────────────────────────────────────────────
function QuickBtn({
  iconName,
  label,
  onPress,
}: {
  iconName: IoniconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={quickStyles.btn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={iconName} size={24} color="#64748B" />
      <Text style={quickStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingBottom: 40,
  },

  header: {
    backgroundColor: "#0F172A",
    paddingTop: 58,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
    gap: 6,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(34,197,94,0.18)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#22C55E",
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subGreeting: {
    fontSize: 14,
    color: "#94A3B8",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F59E0B",
  },

  xpSection: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  xpLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  xpLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  xpTrack: {
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 999,
  },

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
    backgroundColor: "#22C55E",
    borderRadius: 20,
    overflow: "hidden",
  },
  nextCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  nextCardText: {
    flex: 1,
  },
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
  nextCardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    flex: 1,
  },
  nextCardMeta: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  nextArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  allDoneCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#22C55E",
  },
  allDoneTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#166534",
  },
  allDoneSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },

  squadCard: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  squadTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  squadTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  memberList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  memberItem: {
    alignItems: "center",
    minWidth: 56,
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  memberInitial: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  memberName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    maxWidth: 60,
    textAlign: "center",
  },
  memberGrade: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 1,
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
  },
  label: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
});

const quickStyles = StyleSheet.create({
  btn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
});
