import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/welcome");
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>S</Text>
      </View>

      <Text style={styles.title}>STEMM LAB</Text>
      <Text style={styles.tagline}>Exploring real-world challenges</Text>
      <Text style={styles.subTagline}>
        {" "}
        Learn by doing • Think like a problem solver
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoText: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 17,
    color: "#CBD5E1",
    textAlign: "center",
  },
  subTagline: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 6,
  },
});
