// components/ChallengeCard.tsx
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

export const ChallengeCard = ({ challenge, onPress }: any) => {
  const { haptic } = useHaptic();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    haptic("medium");
    setIsPressed(true);
    setTimeout(() => {
      setIsPressed(false);
      onPress();
    }, 150);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[styles.container, isPressed && styles.pressed]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${challenge.color}20` },
        ]}
      >
        <Text style={styles.icon}>{challenge.icon}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{challenge.title}</Text>
        <Text style={styles.category}>{challenge.category}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {challenge.shortDescription}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.meta}>⏱️ {challenge.estimatedMinutes} min</Text>
          <Text style={styles.meta}>🏆 +100 XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  icon: { fontSize: 32 },
  infoContainer: { flex: 1 },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  category: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22C55E",
    marginBottom: 4,
  },
  description: { fontSize: 13, color: "#64748B", marginBottom: 6 },
  metaContainer: { flexDirection: "row", gap: 12 },
  meta: { fontSize: 11, color: "#94A3B8" },
});
