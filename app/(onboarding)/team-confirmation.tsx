// app/(onboarding)/team-confirmation.tsx
// Shown after a team is successfully created.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTeam } from "../../src/context/TeamContext";
import type { ColorTokens } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/themeContext";

const AVATAR_COLORS = [
  "#0F766E", "#2563EB", "#FED7AA", "#F97316", "#0F766E", "#2563EB",
];

export default function TeamConfirmationScreen() {
  const { team } = useTeam();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
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
        <Ionicons name="bulb-outline" size={15} color={colors.info} />
        <Text style={styles.tipText}>
          Complete challenges and climb the leaderboard!
        </Text>
      </View>

      {/* ── Let's Go button ── */}
      <Pressable
        style={({ pressed }) => [styles.goBtn, pressed && styles.pressed]}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <View style={styles.goBtnRow}>
          <Text style={styles.goBtnText}>{"Let's Go!"}</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
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
      backgroundColor: c.cta,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    successBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.ctaLight,
      borderWidth: 1.5,
      borderColor: c.cta,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 14,
    },
    successBadgeText: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primary,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: c.primary,
      marginBottom: 6,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },

    identityBlock: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 2,
      borderColor: c.primary,
    },
    teamName: {
      fontSize: 22,
      fontWeight: "800",
      color: c.primary,
      marginBottom: 4,
    },
    teamId: {
      fontSize: 14,
      fontWeight: "700",
      color: c.cta,
    },

    memberSection: {
      width: "100%",
      marginBottom: 20,
    },
    memberSectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: c.textMuted,
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
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: c.borderFaint,
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
      color: c.primary,
    },
    memberGrade: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 1,
    },

    tipBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 28,
      borderWidth: 1.5,
      borderColor: c.info,
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      color: c.primary,
      lineHeight: 19,
    },

    goBtn: {
      width: "100%",
      backgroundColor: c.cta,
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
}
