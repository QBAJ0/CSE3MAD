import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.decorCircleTop} />
      <View style={styles.decorCircleBottom} />

      <View style={styles.topSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✨ Learn • Play • Explore</Text>
        </View>

        <Text style={styles.title}>Welcome to STEMM Lab</Text>

        <Text style={styles.subtitle}>
          Team up, take on fun hands-on challenges, and discover the science in
          everyday life.
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.primaryButtonText}>Create Team</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/join-team")}
        >
          <Text style={styles.secondaryButtonText}>Join Existing Team</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 50,
    position: "relative",
  },
  decorCircleTop: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#DCFCE7",
  },
  decorCircleBottom: {
    position: "absolute",
    bottom: 90,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#DBEAFE",
  },
  topSection: {
    marginTop: 40,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFCCB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3F6212",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: "#475569",
    maxWidth: "95%",
  },
  bottomSection: {
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#22C55E",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "800",
  },
});
