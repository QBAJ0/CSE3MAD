import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  fetchTeamWithMembers,
  insertMember,
  insertTeam,
} from "@/src/services/teamDb";

export default function SqliteTestScreen() {
  const [status, setStatus] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const runTest = useCallback(async () => {
    setBusy(true);
    setStatus("Running...");
    setOutput("");
    try {
      const createdAt = new Date().toISOString();
      const teamId = await insertTeam("SQLite test team", "Year 7", createdAt);
      await insertMember(teamId, "Alex");
      const row = await fetchTeamWithMembers(teamId);
      if (!row) {
        setStatus("Fetch returned nothing.");
        return;
      }
      setStatus("OK");
      setOutput(
        JSON.stringify(
          {
            team: row.team,
            members: row.members,
          },
          null,
          2,
        ),
      );
    } catch (e) {
      setStatus("Error");
      setOutput(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="hardware-chip-outline" size={30} color="#FED7AA" />
        </View>
        <Text style={styles.title}>SQLite check</Text>
        <Text style={styles.hint}>
          Inserts one team and one member, then reads them back from the local
          database.
        </Text>
      </View>

      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={runTest}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.buttonLabel}>Run insert + fetch</Text>
          </>
        )}
      </Pressable>

      <View style={styles.statusPill}>
        <Ionicons
          name={status === "OK" ? "checkmark-circle" : "ellipse-outline"}
          size={16}
          color={status === "OK" ? "#0F766E" : "#F97316"}
        />
        <Text style={styles.status}>Status: {status || "Ready"}</Text>
      </View>

      {output ? (
        <View style={styles.outputBox}>
          <Text style={styles.output}>{output}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 56,
    gap: 12,
    backgroundColor: "#FFF7ED",
  },
  hero: {
    backgroundColor: "#0F766E",
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  hint: {
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#F97316",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  status: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F766E",
  },
  outputBox: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  output: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#334155",
  },
});
