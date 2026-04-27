// app/(onboarding)/welcome.tsx
// The first screen students see when they open the app for the first time.
// Two options: Create a new team OR join an existing one.

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SUBJECT_TILES = [
  { icon: "flask-outline" as const, label: "Science", color: "#22C55E" },
  { icon: "construct-outline" as const, label: "Engineering", color: "#3B82F6" },
  { icon: "heart-outline" as const, label: "Health", color: "#F59E0B" },
];

const FEATURE_TAGS = [
  { icon: "flask-outline" as const, label: "STEMM" },
  { icon: "game-controller-outline" as const, label: "Gamified" },
  { icon: "trophy-outline" as const, label: "Compete" },
];

export default function WelcomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* ── Top hero section ── */}
      <View style={styles.hero}>
        {/* Subject tiles */}
        <View style={styles.subjectRow}>
          {SUBJECT_TILES.map(({ icon, label, color }) => (
            <View key={label} style={[styles.subjectTile, { borderColor: color + "33" }]}>
              <View style={[styles.subjectIconCircle, { backgroundColor: color + "22" }]}>
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text style={[styles.subjectLabel, { color }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* App logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoTop}>WELCOME TO</Text>
          <Text style={styles.logoStemm}>STEMM</Text>
          <Text style={styles.logoLab}>LAB</Text>
          <View style={styles.logoDivider} />
          <Text style={styles.logoTagline}>
            Science is everywhere. Go find it.
          </Text>
        </View>
      </View>

      {/* ── Bottom card ── */}
      <View style={styles.card}>
        {/* Feature tags */}
        <View style={styles.tagsRow}>
          {FEATURE_TAGS.map(({ icon, label }) => (
            <View key={label} style={styles.tag}>
              <Ionicons name={icon} size={12} color="#166534" />
              <Text style={styles.tagText}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.heading}>Team up. Experiment. Win.</Text>
        <Text style={styles.body}>
          Take on hands-on science challenges, collect XP, earn badges, and
          battle for the top of the leaderboard.
        </Text>

        {/* Create Team button — green solid */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/(onboarding)/register")}
        >
          <View style={styles.btnRow}>
            <Ionicons name="rocket" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Create New Team</Text>
          </View>
          <Text style={styles.primaryBtnSub}>Start a new STEMM squad</Text>
        </Pressable>

        {/* Join Team button — outlined */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/(onboarding)/join-team")}
        >
          <View style={styles.btnRow}>
            <Ionicons name="people" size={18} color="#166534" />
            <Text style={styles.secondaryBtnText}>Join Existing Team</Text>
          </View>
          <Text style={styles.secondaryBtnSub}>Enter a team code from your group</Text>
        </Pressable>
      </View>
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
    flexGrow: 1,
  },

  // Hero (top dark section)
  hero: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },

  subjectRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  subjectTile: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  subjectIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  logoBox: {
    alignItems: "center",
  },
  logoTop: {
    fontSize: 11,
    letterSpacing: 5,
    color: "#22C55E",
    fontWeight: "700",
    marginBottom: 4,
  },
  logoStemm: {
    fontSize: 72,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 72,
    letterSpacing: -2,
  },
  logoLab: {
    fontSize: 72,
    fontWeight: "900",
    color: "#22C55E",
    lineHeight: 72,
    letterSpacing: -2,
    marginTop: -8,
  },
  logoDivider: {
    width: 56,
    height: 4,
    backgroundColor: "#22C55E",
    borderRadius: 2,
    marginVertical: 16,
  },
  logoTagline: {
    fontSize: 15,
    color: "#64748B",
    fontStyle: "italic",
    textAlign: "center",
  },

  // Bottom white card
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 52,
  },

  tagsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: "#64748B",
    marginBottom: 28,
  },

  // Icon + label row inside a button
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Create Team — green solid
  primaryBtn: {
    backgroundColor: "#22C55E",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
    gap: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  primaryBtnSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },

  // Join Team — outlined
  secondaryBtn: {
    borderWidth: 2,
    borderColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    gap: 4,
  },
  secondaryBtnText: {
    color: "#166534",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryBtnSub: {
    color: "#166534",
    fontSize: 13,
    marginTop: 2,
    opacity: 0.7,
  },

  // Slight shrink when pressed
  pressed: {
    opacity: 0.85,
  },
});
