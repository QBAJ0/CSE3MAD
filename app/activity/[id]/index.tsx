import { getLabRecordingActivityById } from "@/src/data/labRecordingCatalog";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function paramId(raw: string | string[] | undefined): string | undefined {
  if (raw === undefined) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function ActivityDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const navigation = useNavigation();
  const id = paramId(idParam);
  const challenge = useMemo(
    () => (id ? getLabRecordingActivityById(id) : undefined),
    [id],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: challenge?.title ?? "Activity",
    });
  }, [challenge, navigation]);

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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.category}>{challenge.category}</Text>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.body}>{challenge.shortDescription}</Text>
      <View style={styles.block}>
        <Text style={styles.label}>Measurement</Text>
        <Text style={styles.body}>{challenge.measurementLabel}</Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.label}>Scoring tip</Text>
        <Text style={styles.body}>{challenge.scoreHint}</Text>
      </View>
      <Pressable
        style={styles.button}
        onPress={() => router.push(`/activity/${id}/record`)}
      >
        <Text style={styles.buttonLabel}>Begin recording</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 16,
    gap: 14,
  },
  centered: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  category: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: "#334155",
  },
  block: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
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
