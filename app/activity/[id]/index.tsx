import Ionicons from "@expo/vector-icons/Ionicons";
import { getLabRecordingActivityById } from "@/src/data/labRecordingCatalog";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { asHref } from "@/src/utils/expoHref";
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
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="flask-outline" size={30} color="#FED7AA" />
        </View>
        <Text style={styles.category}>{challenge.category}</Text>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.heroBody}>{challenge.shortDescription}</Text>
      </View>

      <View style={styles.block}>
        <View style={styles.blockTitleRow}>
          <Ionicons name="speedometer-outline" size={17} color="#2563EB" />
          <Text style={styles.label}>Measurement</Text>
        </View>
        <Text style={styles.body}>{challenge.measurementLabel}</Text>
      </View>

      <View style={styles.block}>
        <View style={styles.blockTitleRow}>
          <Ionicons name="bulb-outline" size={17} color="#F97316" />
          <Text style={styles.label}>Scoring tip</Text>
        </View>
        <Text style={styles.body}>{challenge.scoreHint}</Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => router.push(asHref(`/activity/${id}/record`))}
      >
        <Ionicons name="create-outline" size={17} color="#FFFFFF" />
        <Text style={styles.buttonLabel}>Begin recording</Text>
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
  category: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FED7AA",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 21,
    color: "rgba(255,255,255,0.82)",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#334155",
  },
  block: {
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  blockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F766E",
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
  },
});
