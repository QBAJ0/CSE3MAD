import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getTrialLabelForPrototype } from "../../data/humanPerformanceTrials";
import { Prototype } from "../../types";
import {
  formatReflectNumber,
  parseHumanPerformancePrototype,
} from "../../utils/humanPerformance";

type Props = {
  prototypes: Prototype[];
  teamPrediction: string;
  onUpdatePrototype: (
    index: number,
    patch: Partial<Omit<Prototype, "index">>,
  ) => void;
};

export function HumanPerformanceReflect({
  prototypes,
  teamPrediction,
  onUpdatePrototype,
}: Props) {
  const [wereYouRight, setWereYouRight] = useState<Record<number, string>>(
    () =>
      Object.fromEntries(
        prototypes.map((p) => [
          p.index,
          String(p.measurements.wereYouRight ?? ""),
        ]),
      ),
  );
  const setRight = (index: number, value: "yes" | "no") => {
    setWereYouRight((prev) => ({ ...prev, [index]: value }));
    onUpdatePrototype(index, {
      measurements: { wereYouRight: value },
    });
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="help-circle-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Team prediction</Text>
        </View>
        <Text style={styles.predictionText}>
          {teamPrediction.trim() || "Not recorded"}
        </Text>
      </View>

      {prototypes.map((p, idx) => {
        const hp = parseHumanPerformancePrototype(p);
        const smoothnessDisplay = Number.isFinite(hp.smoothnessScore)
          ? `${formatReflectNumber(hp.smoothnessScore, 2)}%`
          : "—";

        return (
          <View key={p.index} style={styles.card}>
            <Text style={styles.designTitle}>
              {hp.movementType || getTrialLabelForPrototype(p.index)}
            </Text>

            {hp.predictedMovementText ? (
              <Text style={styles.metaLine}>
                Predicted: {hp.predictedMovementText}
                {hp.predictedMovementUnits != null &&
                String(hp.predictedMovementUnits).trim() !== ""
                  ? ` (${hp.predictedMovementUnits} units)`
                  : ""}
              </Text>
            ) : null}

            <View style={styles.outcomeBlock}>
              <Text style={styles.outcomeLine}>
                Movement: {formatReflectNumber(hp.movementUnits, 2)} units
              </Text>
              <Text style={styles.outcomeLine}>
                Time: {formatReflectNumber(hp.durationSeconds, 2)} seconds
              </Text>
              <Text style={styles.outcomeHighlight}>
                Outcome: {hp.outcomeText || "—"}
              </Text>
              <Text style={styles.outcomeLine}>
                Smoothness: {smoothnessDisplay}
              </Text>
              <Text style={styles.outcomeLine}>
                Phone vibration: {hp.vibrationLabel || "—"}
                {Number.isFinite(hp.peakG)
                  ? ` (${formatReflectNumber(hp.peakG, 2)} g peak)`
                  : ""}
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Were you right?</Text>
            <View style={styles.choiceRow}>
              {(["yes", "no"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.choiceBtn,
                    wereYouRight[p.index] === opt && styles.choiceBtnActive,
                  ]}
                  onPress={() => setRight(p.index, opt)}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      wereYouRight[p.index] === opt &&
                        styles.choiceBtnTextActive,
                    ]}
                  >
                    {opt === "yes" ? "Yes" : "No"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="bar-chart-outline" size={16} color="#0F172A" />
          <Text style={styles.cardTitle}>Results table</Text>
        </View>

        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          <Text style={[styles.tableCell, styles.tableHeader, styles.designCol]}>
            Movement
          </Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Units</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Time (s)</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Smooth %</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Vibration</Text>
        </View>

        {prototypes.map((p, idx) => {
          const hp = parseHumanPerformancePrototype(p);
          return (
            <View
              key={p.index}
              style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
            >
              <Text
                style={[styles.tableCell, styles.designCol, styles.bold]}
                numberOfLines={2}
              >
                {hp.movementType || getTrialLabelForPrototype(p.index)}
              </Text>
              <Text style={styles.tableCell}>
                {formatReflectNumber(hp.movementUnits, 2)}
              </Text>
              <Text style={styles.tableCell}>
                {formatReflectNumber(hp.durationSeconds, 2)}
              </Text>
              <Text style={styles.tableCell}>
                {Number.isFinite(hp.smoothnessScore)
                  ? formatReflectNumber(hp.smoothnessScore, 2)
                  : "—"}
              </Text>
              <Text style={styles.tableCell}>{hp.vibrationLabel || "—"}</Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  predictionText: { fontSize: 15, color: "#334155", marginTop: 10, lineHeight: 22 },
  designTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F766E",
    marginBottom: 8,
  },
  metaLine: { fontSize: 13, color: "#64748B", marginBottom: 8 },
  outcomeBlock: {
    backgroundColor: "#F0FDFA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  outcomeLine: { fontSize: 14, color: "#334155" },
  outcomeHighlight: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F766E",
    marginVertical: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },
  choiceRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  choiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  choiceBtnActive: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  choiceBtnText: { fontWeight: "600", color: "#475569" },
  choiceBtnTextActive: { color: "#FFFFFF" },
  tableRow: { flexDirection: "row", paddingVertical: 8 },
  tableHeaderRow: { borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tableRowAlt: { backgroundColor: "#F8FAFC" },
  tableCell: { flex: 1, fontSize: 12, color: "#334155", textAlign: "center" },
  tableHeader: { fontWeight: "700", color: "#0F172A" },
  designCol: { flex: 0.7 },
  bold: { fontWeight: "700" },
});
