import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

export function AdMobBanner() {
  return (
    <View style={styles.container}>
      <Ionicons name="phone-portrait-outline" size={16} color="#64748B" />
      <Text style={styles.text}>AdMob banner loads on native builds</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  text: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
});
