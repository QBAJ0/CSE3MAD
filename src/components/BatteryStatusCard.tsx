import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

export function BatteryStatusCard() {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="battery-half-outline" size={16} color="#0F766E" />
        <Text style={styles.title}>Device Battery</Text>
      </View>
      <Text style={styles.value}>Native only</Text>
      <Text style={styles.detail}>
        Battery status is available when running the mobile app on iOS or Android.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFF7ED",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F766E",
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  detail: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
});
