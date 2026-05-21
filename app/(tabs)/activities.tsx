import { LAB_RECORDING_ACTIVITIES } from "@/src/data/labRecordingCatalog";
import { router } from "expo-router";
import { asHref } from "@/src/utils/expoHref";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

export default function ActivitiesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Lab recording activities</Text>
      <Text style={styles.subtitle}>
        Short list for SQLite + optional cloud saves. Main XP challenges are
        under the Challenges tab.
      </Text>
      {LAB_RECORDING_ACTIVITIES.map((item) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push(asHref(`/activity/${item.id}`))}
        >
          <Text style={styles.cardCategory}>{item.category}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardBody} numberOfLines={3}>
            {item.shortDescription}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 56,
    gap: 14,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 21,
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f8fafc",
    gap: 6,
  },
  cardPressed: {
    opacity: 0.92,
    backgroundColor: "#eff6ff",
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardBody: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 21,
  },
});
