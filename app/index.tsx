import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTeam } from "../src/context/TeamContext";

export default function IndexScreen() {
  const { team, loading } = useTeam();

  useEffect(() => {
    if (loading) return;
    router.replace(team ? "/(tabs)/home" : "/(onboarding)/welcome");
  }, [loading, team]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#2F80ED" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5E8",
  },
});
