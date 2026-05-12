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
    setStatus("Running…");
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
      <Text style={styles.title}>SQLite check</Text>
      <Text style={styles.hint}>
        Inserts one team and one member, then reads them back from the local
        database.
      </Text>
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={runTest}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonLabel}>Run insert + fetch</Text>
        )}
      </Pressable>
      <Text style={styles.status}>Status: {status || "—"}</Text>
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
    padding: 20,
    paddingTop: 56,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  hint: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  status: {
    fontSize: 15,
    fontWeight: "600",
  },
  outputBox: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
  },
  output: {
    fontFamily: "monospace",
    fontSize: 12,
  },
});
