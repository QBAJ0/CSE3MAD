import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Challenge = {
  id: number;
  title: string;
  category: string;
  icon: string;
  description: string;
  color: string;
};

export default function ExploreScreen() {
  const challenges: Challenge[] = [
    {
      id: 1,
      title: "Parachute Drop",
      category: "Engineering",
      icon: "🪂",
      description:
        "Design and test a parachute for the slowest and safest landing.",
      color: "#FF6B6B",
    },
    {
      id: 2,
      title: "Sound Pollution Hunter",
      category: "Environmental Science",
      icon: "🔊",
      description: "Measure classroom sounds and compare loud and quiet zones.",
      color: "#4ECDC4",
    },
    {
      id: 3,
      title: "Hand Fan Challenge",
      category: "Physics",
      icon: "🪭",
      description: "Test how air movement affects flexible materials.",
      color: "#45B7D1",
    },
    {
      id: 4,
      title: "Earthquake Structure",
      category: "Engineering",
      icon: "🏗️",
      description: "Build a structure that can resist vibration and movement.",
      color: "#96CEB4",
    },
    {
      id: 5,
      title: "Stretch & Grace",
      category: "Biomechanics",
      icon: "🧘",
      description:
        "Measure speed, smoothness, and control during guided movement.",
      color: "#FFEAA7",
    },
    {
      id: 6,
      title: "Reaction Board",
      category: "Neuroscience",
      icon: "⚡",
      description: "Test reaction time and compare coordination performance.",
      color: "#DDA0DD",
    },
    {
      id: 7,
      title: "Breathing Trainer",
      category: "Medical Science",
      icon: "🌬️",
      description: "Analyse breathing patterns before and after exercise.",
      color: "#98D8C8",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Explore Challenges</Text>
      <Text style={styles.subtitle}>
        Discover STEMM Lab activities and choose a challenge to begin
      </Text>

      {challenges.map((challenge) => (
        <TouchableOpacity
          key={challenge.id}
          style={styles.card}
          onPress={() => {
            console.log(`Selected: ${challenge.title}`);
            // TODO: Navigate to challenge details screen in Sprint 2
          }}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${challenge.color}20` },
            ]}
          >
            <Text style={styles.icon}>{challenge.icon}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.category}>{challenge.category}</Text>
            <Text style={styles.description}>{challenge.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#7F8C8D",
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A73E8",
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
