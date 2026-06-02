// app/(onboarding)/join-team.tsx
// Screen for students who are joining a team that already exists.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTeam } from "../../src/context/TeamContext";
import type { ColorTokens } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/themeContext";
import { storage } from "../../src/utils/storage";

export default function JoinTeamScreen() {
  const { setTeamData } = useTeam();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    const name = teamName.trim();
    const id = teamId.trim();

    if (!name || !id) {
      Alert.alert("Missing Info", "Please enter both your team name and team ID.");
      return;
    }

    setIsJoining(true);

    const savedTeam = await storage.getTeam();

    if (
      savedTeam &&
      savedTeam.teamName === name &&
      savedTeam.discriminator === id
    ) {
      await setTeamData({
        teamName: savedTeam.teamName,
        discriminator: savedTeam.discriminator,
        members: savedTeam.members,
      });
      router.push("/(onboarding)/team-confirmation");
    } else {
      setIsJoining(false);
      Alert.alert(
        "Team Not Found",
        "We couldn't find that team. Double-check the name and ID, or create a new team.",
        [
          { text: "Try Again", style: "cancel" },
          {
            text: "Create Team",
            onPress: () => router.replace("/(onboarding)/register"),
          },
        ]
      );
    }
  };

  const canJoin = teamName.trim().length > 0 && teamId.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Ionicons name="enter-outline" size={32} color="#FFFFFF" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Join a Team</Text>
          <Text style={styles.headerSubtitle}>
            Enter the team name and the ID your team leader shared with you.
          </Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>
          {/* Hint box */}
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={16} color={colors.primary} />
            <Text style={styles.hintText}>
              Ask your team leader for the Team ID — it looks like{" "}
              <Text style={styles.hintBold}>#4821</Text>
            </Text>
          </View>

          {/* Team Name input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>TEAM NAME</Text>
            <TextInput
              style={[styles.input, teamName.trim() ? styles.inputFilled : null]}
              placeholder="e.g. STEM Stars"
              placeholderTextColor={colors.textMuted}
              value={teamName}
              onChangeText={setTeamName}
              returnKeyType="next"
              autoCapitalize="words"
              maxLength={30}
            />
          </View>

          {/* Team ID input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>TEAM ID</Text>
            <TextInput
              style={[styles.input, teamId.trim() ? styles.inputFilled : null]}
              placeholder="e.g. #4821"
              placeholderTextColor={colors.textMuted}
              value={teamId}
              onChangeText={setTeamId}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={5}
              onSubmitEditing={canJoin ? handleJoin : undefined}
            />
          </View>

          {/* Join button */}
          <Pressable
            style={[styles.joinBtn, !canJoin && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={!canJoin || isJoining}
          >
            <Text style={styles.joinBtnText}>
              {isJoining ? "Joining..." : "Join Team"}
            </Text>
          </Pressable>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Create instead ── */}
        <View style={styles.footer}>
          <Text style={styles.footerHint}>{"Don't have a team yet?"}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.createBtn,
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace("/(onboarding)/register")}
          >
            <View style={styles.createBtnRow}>
              <Text style={styles.createBtnText}>Create a New Team</Text>
            </View>
          </Pressable>

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <Text style={styles.backLinkText}>Back to Welcome</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingBottom: 48,
    },

    // Header — teal kept hardcoded as brand splash
    header: {
      backgroundColor: "#0F766E",
      paddingTop: 56,
      paddingBottom: 32,
      paddingHorizontal: 24,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      marginBottom: 24,
      gap: 6,
    },
    headerIcon: {
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 30,
      fontWeight: "900",
      color: "#FFFFFF",
    },
    headerSubtitle: {
      fontSize: 15,
      color: "rgba(255,255,255,0.85)",
      lineHeight: 22,
    },

    card: {
      marginHorizontal: 20,
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 24,
      gap: 16,
      borderWidth: 1,
      borderColor: c.borderFaint,
    },

    hintBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: c.background,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1.5,
      borderColor: c.info,
    },
    hintText: {
      flex: 1,
      fontSize: 13,
      color: c.primary,
      lineHeight: 20,
    },
    hintBold: {
      fontWeight: "800",
    },

    fieldGroup: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.textMuted,
      letterSpacing: 1,
    },
    input: {
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: c.text,
      backgroundColor: c.input,
    },
    inputFilled: {
      borderColor: c.inputFilledBorder,
      backgroundColor: c.inputFilled,
    },

    joinBtn: {
      backgroundColor: c.cta,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 4,
    },
    joinBtnDisabled: {
      backgroundColor: c.border,
    },
    joinBtnText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "800",
    },

    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 24,
      marginVertical: 24,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.borderFaint,
    },
    dividerText: {
      fontSize: 13,
      color: c.textMuted,
      fontWeight: "600",
    },

    footer: {
      paddingHorizontal: 20,
      alignItems: "center",
      gap: 12,
    },
    footerHint: {
      fontSize: 14,
      color: c.textSecondary,
      fontWeight: "600",
    },
    createBtn: {
      width: "100%",
      borderWidth: 2,
      borderColor: c.primary,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      backgroundColor: c.background,
    },
    createBtnRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    createBtnText: {
      color: c.primary,
      fontSize: 16,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.85,
    },
    backLink: {
      paddingVertical: 8,
    },
    backLinkText: {
      fontSize: 14,
      color: c.textMuted,
      fontWeight: "600",
    },
  });
}
