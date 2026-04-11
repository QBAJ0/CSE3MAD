import { StyleSheet, Text, View } from "react-native";
import { useTeam } from "../../context/TeamContext";

export default function HomeScreen() {
  const { team } = useTeam();

  return (
    <View style={styles.container}>
      <View style={styles.decorCircleTop} />
      <View style={styles.decorCircleBottom} />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>🏠 Home Base</Text>
      </View>

      <Text style={styles.greeting}>
        Welcome, {team?.teamName || "My Team"}!
      </Text>
      <Text style={styles.subheading}>
        Ready to take on your next STEMM adventure?
      </Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Today’s Mission</Text>
        <Text style={styles.heroText}>
          Explore exciting hands-on activities, test your ideas, and discover
          the science behind real-world challenges.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Team ID</Text>
        <Text style={styles.cardText}>{team?.discriminator || "#0000"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Team Members</Text>
        {team?.members?.length ? (
          team.members.map((member, index) => (
            <Text key={index} style={styles.cardSmallText}>
              • {member.name}
              {member.year ? ` — ${member.year}` : ""}
            </Text>
          ))
        ) : (
          <Text style={styles.cardSmallText}>No members added yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next Challenge</Text>
        <Text style={styles.cardText}>Reaction Time Test</Text>
        <Text style={styles.cardSmallText}>
          Measure how fast your team responds and compare your results.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
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
    bottom: 40,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#DBEAFE",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFCCB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 10,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3F6212",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: "#64748B",
    lineHeight: 24,
    marginBottom: 22,
  },
  heroCard: {
    backgroundColor: "#DCFCE7",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#166534",
    marginBottom: 8,
  },
  heroText: {
    fontSize: 15,
    color: "#166534",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  cardSmallText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
    marginBottom: 4,
  },
});
