import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTeam } from "../context/TeamContext";

export default function TeamConfirmationScreen() {
  const { team } = useTeam();

  return (
    <View style={styles.container}>
      <View style={styles.decorCircleTop} />
      <View style={styles.decorCircleBottom} />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>🎉 Team Ready</Text>
      </View>

      <Text style={styles.title}>Your Team is Ready!</Text>
      <Text style={styles.subtitle}>
        Amazing work! Your team has been created successfully and is ready to
        start exploring exciting STEMM challenges.
      </Text>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🚀</Text>
        </View>

        <Text style={styles.teamName}>{team?.teamName || "My Team"}</Text>
        <Text style={styles.discriminator}>
          Team ID: {team?.discriminator || "#0000"}
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Team Members</Text>
          {team?.members?.length ? (
            team.members.map((member, index) => (
              <Text key={index} style={styles.infoText}>
                • {member.name}
                {member.year ? ` — ${member.year}` : ""}
              </Text>
            ))
          ) : (
            <Text style={styles.infoText}>No team members added yet.</Text>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What’s Next?</Text>
          <Text style={styles.infoText}>
            Start completing activities, earning points, and climbing the
            leaderboard together.
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Text style={styles.buttonText}>Go to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
    paddingVertical: 50,
    justifyContent: "center",
    position: "relative",
  },
  decorCircleTop: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#DCFCE7",
  },
  decorCircleBottom: {
    position: "absolute",
    bottom: 50,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#DBEAFE",
  },
  badge: {
    alignSelf: "center",
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
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  iconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#DCFCE7",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  discriminator: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16A34A",
    textAlign: "center",
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 6,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
