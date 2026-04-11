import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function JoinTeamScreen() {
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState("");

  const handleJoinTeam = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🤝 Join a Team</Text>
        </View>

        <Text style={styles.title}>Join Existing Team</Text>
        <Text style={styles.subtitle}>
          Enter the team name and team ID to join your group.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Team Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter team name"
            placeholderTextColor="#94A3B8"
            value={teamName}
            onChangeText={setTeamName}
          />

          <Text style={styles.label}>Team ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. #4821"
            placeholderTextColor="#94A3B8"
            value={teamId}
            onChangeText={setTeamId}
          />

          <Pressable style={styles.button} onPress={handleJoinTeam}>
            <Text style={styles.buttonText}>Join Team</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFCCB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCE3EC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
  },
  button: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 26,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
