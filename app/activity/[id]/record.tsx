import Ionicons from "@expo/vector-icons/Ionicons";
import { getLabRecordingActivityById } from "@/src/data/labRecordingCatalog";
import { useTeam } from "@/src/context/TeamContext";
import { insertActivityResult } from "@/src/services/resultDb";
import { saveResultToFirestore } from "@/src/services/resultCloud";
import { ensureSqliteTeamIdForContextTeam } from "@/src/services/sqliteTeamBridge";
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
  const { team, loading: teamLoading } = useTeam();
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const navigation = useNavigation();
  const id = paramId(idParam);
  const challenge = useMemo(
    () => (id ? getLabRecordingActivityById(id) : undefined),
    [id],
  );

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
    if (!team) {
      Alert.alert(
        "No team",
        "Finish team setup from onboarding first, then try again.",
      );
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
      const teamId = await ensureSqliteTeamIdForContextTeam(team);
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

  if (teamLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.muted}>Loading team...</Text>
      </View>
    );
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

  if (!team) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>No team saved yet</Text>
        <Text style={styles.muted}>
          Complete onboarding and create your team before recording lab results.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="create-outline" size={30} color="#FED7AA" />
        </View>
        <Text style={styles.heroTitle}>Record result</Text>
        <Text style={styles.hint}>{challenge.measurementLabel}</Text>
      </View>

      <View style={styles.teamCard}>
        <View style={styles.teamLabelRow}>
          <Ionicons name="people-outline" size={16} color="#0F766E" />
          <Text style={styles.teamLabel}>Team</Text>
        </View>
        <Text style={styles.teamName}>{team.teamName}</Text>
        <Text style={styles.teamMeta}>ID: {team.discriminator}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Score</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="Whole number"
          placeholderTextColor="#94A3B8"
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
          placeholderTextColor="#94A3B8"
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
          placeholderTextColor="#94A3B8"
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
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="save-outline" size={17} color="#FFFFFF" />
            <Text style={styles.buttonLabel}>Save result</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 24,
    gap: 14,
    paddingBottom: 32,
    backgroundColor: "#FFF7ED",
  },
  centered: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
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
  heroTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  hint: {
    fontSize: 15,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 21,
  },
  teamCard: {
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 6,
  },
  teamLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F766E",
    textTransform: "uppercase",
  },
  teamName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  teamMeta: {
    fontSize: 13,
    color: "#475569",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
  },
  input: {
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
  },
  notes: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#F97316",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  error: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
  },
  muted: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});
