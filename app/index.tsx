// app/index.tsx
// This is the first screen the app loads.
// It shows a splash screen for 2 seconds, then sends the user
// to the home page (if they already have a team) or the welcome page (if they don't).

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTeam } from "../src/context/TeamContext";

// How long to show the splash screen (in milliseconds)
const SPLASH_DURATION_MS = 2200;

export default function SplashScreen() {
  // Get the saved team from storage and whether it's still loading
  const { team, loading: isLoadingTeam } = useTeam();

  // Track whether the 2-second splash timer has finished
  const [splashFinished, setSplashFinished] = useState(false);

  // --- Step 1: Start the splash timer when the screen mounts ---
  useEffect(() => {
    // Wait 2.2 seconds, then mark the splash as done
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, SPLASH_DURATION_MS);

    // Clean up: cancel the timer if the component unmounts early
    return () => clearTimeout(timer);
  }, []); // empty array = only runs once when screen first loads

  // --- Step 2: Navigate once both the timer AND team data are ready ---
  useEffect(() => {
    // Wait until splash is done AND team data has finished loading from storage
    if (!splashFinished || isLoadingTeam) return;

    if (team) {
      // User already has a team saved → go straight to the home tab
      router.replace("/(tabs)/home");
    } else {
      // No team found → send them through onboarding
      router.replace("/(onboarding)/welcome");
    }

    // TODO: When Firebase is added, also check if the team exists in the database
    // and sync any remote data before navigating.
  }, [splashFinished, isLoadingTeam, team]);

  // --- UI: Show the splash screen while waiting ---
  return (
    <View style={styles.container}>

      {/* App logo circle */}
      <View style={styles.logoCircle}>
        <Text style={styles.logoLetter}>S</Text>
      </View>

      {/* App name */}
      <Text style={styles.appName}>STEMM LAB</Text>

      {/* Tagline */}
      <Text style={styles.tagline}>Exploring real-world challenges</Text>
      <Text style={styles.subTagline}>
        Learn by doing • Think like a problem solver
      </Text>

      {/* Loading spinner — shows while we wait for data */}
      <ActivityIndicator
        size="small"
        color="#22C55E"
        style={styles.spinner}
      />
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",   // dark navy background
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,             // makes it a perfect circle
    backgroundColor: "#22C55E",   // green
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  logoLetter: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 10,
  },

  tagline: {
    fontSize: 17,
    color: "#CBD5E1",             // light grey
    textAlign: "center",
  },

  subTagline: {
    fontSize: 14,
    color: "#94A3B8",             // slightly darker grey
    marginTop: 6,
    textAlign: "center",
  },

  spinner: {
    marginTop: 40,
  },
});
