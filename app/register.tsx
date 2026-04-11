import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTeam } from "../context/TeamContext";

export default function RegisterScreen() {
  const { setTeamData } = useTeam();

  const [teamName, setTeamName] = useState("");

  const [member1, setMember1] = useState("");
  const [member1Year, setMember1Year] = useState("");

  const [member2, setMember2] = useState("");
  const [member2Year, setMember2Year] = useState("");

  const [member3, setMember3] = useState("");
  const [member3Year, setMember3Year] = useState("");

  const [member4, setMember4] = useState("");
  const [member4Year, setMember4Year] = useState("");

  const discriminator = useMemo(() => {
    return "#" + Math.floor(1000 + Math.random() * 9000);
  }, []);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;

    const members = [
      { name: member1.trim(), year: member1Year.trim() },
      { name: member2.trim(), year: member2Year.trim() },
      { name: member3.trim(), year: member3Year.trim() },
      { name: member4.trim(), year: member4Year.trim() },
    ].filter((member) => member.name !== "");

    const data = {
      teamName,
      discriminator,
      members,
    };

    await setTeamData(data);

    router.push("/team-confirmation");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.decorCircleTop} />
        <View style={styles.decorCircleBottom} />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>🚀 Team Setup</Text>
        </View>

        <Text style={styles.title}>Create Your Team</Text>
        <Text style={styles.subtitle}>
          Gather your squad and start the adventure!
        </Text>
        <Text style={styles.description}>
          Add your team details below and get ready to explore exciting STEMM
          challenges together.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Enter Team Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. STEM Stars"
            placeholderTextColor="#94A3B8"
            value={teamName}
            onChangeText={setTeamName}
          />

          <Text style={styles.sectionTitle}>Team Members</Text>

          <View style={styles.memberBox}>
            <Text style={styles.memberTitle}>Team Member 1</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor="#94A3B8"
              value={member1}
              onChangeText={setMember1}
            />
            <TextInput
              style={[styles.input, styles.memberInputSpacing]}
              placeholder="Year level (e.g. Year 8)"
              placeholderTextColor="#94A3B8"
              value={member1Year}
              onChangeText={setMember1Year}
            />
          </View>

          <View style={styles.memberBox}>
            <Text style={styles.memberTitle}>Team Member 2</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor="#94A3B8"
              value={member2}
              onChangeText={setMember2}
            />
            <TextInput
              style={[styles.input, styles.memberInputSpacing]}
              placeholder="Year level (e.g. Year 9)"
              placeholderTextColor="#94A3B8"
              value={member2Year}
              onChangeText={setMember2Year}
            />
          </View>

          <View style={styles.memberBox}>
            <Text style={styles.memberTitle}>Team Member 3</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor="#94A3B8"
              value={member3}
              onChangeText={setMember3}
            />
            <TextInput
              style={[styles.input, styles.memberInputSpacing]}
              placeholder="Year level"
              placeholderTextColor="#94A3B8"
              value={member3Year}
              onChangeText={setMember3Year}
            />
          </View>

          <View style={styles.memberBox}>
            <Text style={styles.memberTitle}>Team Member 4</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor="#94A3B8"
              value={member4}
              onChangeText={setMember4}
            />
            <TextInput
              style={[styles.input, styles.memberInputSpacing]}
              placeholder="Year level"
              placeholderTextColor="#94A3B8"
              value={member4Year}
              onChangeText={setMember4Year}
            />
          </View>

          <Text style={styles.label}>Team Discriminator</Text>
          <View style={styles.discriminatorBox}>
            <Text style={styles.discriminatorText}>{discriminator}</Text>
            <Text style={styles.discriminatorNote}>
              Assigned automatically by the app
            </Text>
          </View>

          <Pressable style={styles.button} onPress={handleCreateTeam}>
            <Text style={styles.buttonText}>Create Team</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 24,
    paddingBottom: 40,
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
    bottom: 60,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 10,
  },
  description: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 18,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    marginTop: 12,
  },
  memberBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  memberTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
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
  memberInputSpacing: {
    marginTop: 8,
  },
  discriminatorBox: {
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
    borderRadius: 14,
    padding: 14,
    marginTop: 2,
  },
  discriminatorText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#15803D",
    marginBottom: 4,
  },
  discriminatorNote: {
    fontSize: 13,
    color: "#475569",
  },
  button: {
    backgroundColor: "#22C55E",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 26,
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
