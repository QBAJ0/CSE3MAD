import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { getTrialForPrototype } from "../../data/humanPerformanceTrials";

type Props = {
  prototypeIndex: number;
};

/** Diagram + movement label for the current test (no movement picker). */
export function HumanPerformanceMovementDiagram({ prototypeIndex }: Props) {
  const trial = getTrialForPrototype(prototypeIndex);
  if (!trial) return null;

  return (
    <View style={styles.card}>
      <Image
        source={trial.image}
        style={styles.image}
        contentFit="contain"
      />
      <Text style={styles.label}>{trial.movementType}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FED7AA",
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 200,
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F766E",
    textAlign: "center",
  },
});
