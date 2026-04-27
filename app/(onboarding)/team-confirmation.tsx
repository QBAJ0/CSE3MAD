// app/(onboarding)/team-confirmation.tsx
// Shown after a team is successfully created.
// Displays team name, ID, and member list, then lets students go to the home screen.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTeam } from "../../src/context/TeamContext";

const AVATAR_COLORS = [
  "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4",
];

export default function TeamConfirmationScreen() {
  const { team } = useTeam();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* ── Hero section ── */}
      <View style={styles.heroSection}>
        <View style={styles.rocketCircle}>
          <Ionicons name="rocket" size={40} color="#FFFFFF" />
        </View>

        <View style={styles.successBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#166534" />
          <Text style={styles.successBadgeText}>Team Ready!</Text>
        </View>

        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>
          Your team has been created. Let the science begin!
        </Text>
      </View>

      {/* ── Team identity block ── */}
      <View style={styles.identityBlock}>
        <Text style={styles.teamName}>{team?.teamName ?? "My Team"}</Text>
        <Text style={styles.teamId}>
          Team ID: {team?.discriminator ?? "#0000"}
        </Text>
      </View>

      {/* ── Member list ── */}
      <View style={styles.memberSection}>
        <Text style={styles.memberSectionTitle}>Team Members</Text>
        <View style={styles.memberList}>
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
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                {member.grade ? (
                  <Text style={styles.memberGrade}>{member.grade}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Tip box ── */}
      <View style={styles.tipBox}>
        <Ionicons name="bulb-outline" size={15} color="#94A3B8" />
        <Text style={styles.tipText}>
          Complete challenges to earn XP and climb the leaderboard!
        </Text>
      </View>

      {/* ── Let's Go button ── */}
      <Pressable
        style={({ pressed }) => [styles.goBtn, pressed && styles.pressed]}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <View style={styles.goBtnRow}>
          <Ionicons name="flash" size={20} color="#FFFFFF" />
          <Text style={styles.goBtnText}>Let's Go!</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    alignItems: "center",
  },

  heroSection: {
    alignItems: "center",
    paddingTop: 40,
    marginBottom: 24,
  },
  rocketCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#22C55E",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  successBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#166534",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
  },

  identityBlock: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  teamName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  teamId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
  },

  memberSection: {
    width: "100%",
    marginBottom: 20,
  },
  memberSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#CBD5E1",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  memberList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  memberName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  memberGrade: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 19,
  },

  goBtn: {
    width: "100%",
    backgroundColor: "#22C55E",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  goBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.88,
  },
});
