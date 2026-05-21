// app/(onboarding)/join-team.tsx
// Screen for students who are joining a team that already exists.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
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
import { storage } from "../../src/utils/storage";

export default function JoinTeamScreen() {
  const { setTeamData } = useTeam();

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
          <Ionicons name="enter-outline" size={32} color="#2563EB" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Join a Team</Text>
          <Text style={styles.headerSubtitle}>
            Enter the team name and the ID your team leader shared with you.
          </Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>
          {/* Hint box */}
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={16} color="#0F766E" />
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
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
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
              <Ionicons name="rocket-outline" size={17} color="#0F766E" />
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

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  content: {
    paddingBottom: 48,
  },

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
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "#FFF7ED",
  },

  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#2563EB",
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: "#0F766E",
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
    color: "#94A3B8",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#FFF7ED",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0F766E",
    backgroundColor: "#FFFFFF",
  },
  inputFilled: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },

  joinBtn: {
    backgroundColor: "#F97316",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  joinBtnDisabled: {
    backgroundColor: "#CBD5E1",
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
    backgroundColor: "#FFF7ED",
  },
  dividerText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },

  footer: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 12,
  },
  footerHint: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  createBtn: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#0F766E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FFF7ED",
  },
  createBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  createBtnText: {
    color: "#0F766E",
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
    color: "#94A3B8",
    fontWeight: "600",
  },
});
