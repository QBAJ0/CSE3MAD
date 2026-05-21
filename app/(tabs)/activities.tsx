import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LAB_RECORDING_ACTIVITIES } from "@/src/data/labRecordingCatalog";

export default function ActivitiesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="clipboard-outline" size={30} color="#FED7AA" />
        </View>
        <Text style={styles.title}>Lab recording activities</Text>
        <Text style={styles.subtitle}>
          Quick local experiments for SQLite and optional cloud saves.
        </Text>
      </View>

      {LAB_RECORDING_ACTIVITIES.map((item, index) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.push(`/activity/${item.id}`)}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.cardIcon}>
              <Ionicons
                name={index % 2 === 0 ? "flask-outline" : "analytics-outline"}
                size={20}
                color="#2563EB"
              />
            </View>
            <Text style={styles.cardCategory}>{item.category}</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>
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
    flexGrow: 1,
    padding: 20,
    paddingTop: 56,
    gap: 14,
    paddingBottom: 32,
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
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 7,
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: "#FFFBF7",
    borderColor: "#F97316",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCategory: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#F97316",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F766E",
  },
  cardBody: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 21,
  },
});
