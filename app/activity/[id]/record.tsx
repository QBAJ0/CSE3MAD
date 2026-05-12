import { getSqliteActivityById } from "@/src/data/sqliteActivities";
import { insertActivityResult } from "@/src/services/resultDb";
import { saveResultToFirestore } from "@/src/services/resultCloud";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function paramId(raw: string | string[] | undefined): string | undefined {
  if (raw === undefined) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function RecordResultScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const navigation = useNavigation();
  const id = paramId(idParam);
  const challenge = useMemo(() => (id ? getSqliteActivityById(id) : undefined), [id]);

  const [teamIdText, setTeamIdText] = useState("");
  const [scoreText, setScoreText] = useState("");
  const [sensorText, setSensorText] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: challenge ? `Record: ${challenge.title}` : "Record result",
    });
  }, [challenge, navigation]);

  async function onSave() {
    if (!challenge || !id) {
      Alert.alert("Cannot save", "Unknown activity.");
      return;
    }
    const teamId = Number.parseInt(teamIdText.trim(), 10);
    if (!Number.isFinite(teamId) || teamId <= 0) {
      Alert.alert("Check team id", "Enter a positive whole number for team id.");
      return;
    }
    const score = Number.parseInt(scoreText.trim(), 10);
    if (!Number.isFinite(score)) {
      Alert.alert("Check score", "Enter a whole number for score.");
      return;
    }

    let sensorValue: number | null | undefined;
    const sensorTrim = sensorText.trim();
    if (sensorTrim.length > 0) {
      const parsed = Number.parseFloat(sensorTrim);
      if (!Number.isFinite(parsed)) {
        Alert.alert("Check sensor value", "Enter a valid number or leave it blank.");
        return;
      }
      sensorValue = parsed;
    }

    const notesTrim = notes.trim();
    const createdAt = new Date().toISOString();

    setBusy(true);
    try {
      const newId = await insertActivityResult({
        teamId,
        activityId: challenge.id,
        activityName: challenge.title,
        score,
        sensorValue,
        notes: notesTrim.length > 0 ? notesTrim : null,
        createdAt,
      });
      void saveResultToFirestore({
        id: newId,
        teamId,
        activityId: challenge.id,
        activityName: challenge.title,
        score,
        sensorValue:
          sensorValue === undefined || sensorValue === null ? null : sensorValue,
        notes: notesTrim.length > 0 ? notesTrim : null,
        createdAt,
      });
      Alert.alert("Saved", "Result stored locally.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert("Save failed", message);
    } finally {
      setBusy(false);
    }
  }

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Missing activity id.</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Unknown activity.</Text>
        <Text style={styles.muted}>No challenge matches id: {id}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.hint}>{challenge.measurementLabel}</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Team id</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="e.g. 1"
          value={teamIdText}
          onChangeText={setTeamIdText}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Score</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="Whole number"
          value={scoreText}
          onChangeText={setScoreText}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Sensor value (optional)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="Leave blank if not used"
          value={sensorText}
          onChangeText={setSensorText}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          multiline
          placeholder="Observations, conditions, etc."
          value={notes}
          onChangeText={setNotes}
        />
      </View>
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={onSave}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonLabel}>Save result</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 16,
    gap: 14,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  hint: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 21,
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  notes: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  error: {
    fontSize: 16,
    fontWeight: "600",
    color: "#b91c1c",
  },
  muted: {
    fontSize: 14,
    color: "#64748b",
  },
});
