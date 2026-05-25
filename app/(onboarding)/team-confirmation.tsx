// app/(onboarding)/team-confirmation.tsx
// Shown after a team is successfully created.

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
  "#0F766E", "#2563EB", "#FED7AA", "#F97316", "#0F766E", "#2563EB",
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
          <Ionicons name="checkmark-circle" size={14} color="#0F766E" />
          <Text style={styles.successBadgeText}>Team Ready!</Text>
        </View>

        <Text style={styles.title}>{"You're all set!"}</Text>
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
        <Ionicons name="bulb-outline" size={15} color="#2563EB" />
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
          <Text style={styles.goBtnText}>{"Let's Go!"}</Text>
        </View>
      </Pressable>
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
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FED7AA",
    borderWidth: 1.5,
    borderColor: "#F97316",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 14,
  },
  successBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F766E",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F766E",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  identityBlock: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#0F766E",
  },
  teamName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F766E",
    marginBottom: 4,
  },
  teamId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F97316",
  },

  memberSection: {
    width: "100%",
    marginBottom: 20,
  },
  memberSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#94A3B8",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFF7ED",
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
    color: "#0F766E",
  },
  memberGrade: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: "#2563EB",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#0F766E",
    lineHeight: 19,
  },

  goBtn: {
    width: "100%",
    backgroundColor: "#F97316",
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
