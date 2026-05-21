import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTeam } from "../../context/TeamContext";
import { useHaptic } from "../../hooks/useHaptic";
import { TapReactionGame } from "./TapReactionGame";
import { TracingRecorder } from "./TracingRecorder";

type Phase = "setup" | "dominant" | "nonDominant" | "tracing" | "complete";

interface MemberResult {
  name: string;
  dominantTime?: number;
  nonDominantTime?: number;
  tracingScore?: number;
}

interface TeamReactionBoardProps {
  onComplete: (results: MemberResult[]) => void;
}

export function TeamReactionBoard({ onComplete }: TeamReactionBoardProps) {
  const { team } = useTeam();
  const { haptic } = useHaptic();
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [dominantTimes, setDominantTimes] = useState<Record<string, number>>(
    {},
  );
  const [nonDominantTimes, setNonDominantTimes] = useState<
    Record<string, number>
  >({});
  const [tracingScores, setTracingScores] = useState<Record<string, number>>(
    {},
  );

  const currentMember = team?.members[currentMemberIndex];
  const totalMembers = team?.members.length || 0;

  const handleDominantComplete = (result: {
    times: number[];
    tooEarly: number;
  }) => {
    haptic("success");
    const avgTime =
      result.times.reduce((a, b) => a + b, 0) / result.times.length;
    setDominantTimes((prev) => ({ ...prev, [currentMember?.name ?? ""]: avgTime }));

    if (currentMemberIndex + 1 < totalMembers) {
      setCurrentMemberIndex((prev) => prev + 1);
    } else {
      setCurrentMemberIndex(0);
      setPhase("nonDominant");
    }
  };

  const handleNonDominantComplete = (result: {
    times: number[];
    tooEarly: number;
  }) => {
    haptic("success");
    const avgTime =
      result.times.reduce((a, b) => a + b, 0) / result.times.length;
    setNonDominantTimes((prev) => ({ ...prev, [currentMember?.name ?? ""]: avgTime }));

    if (currentMemberIndex + 1 < totalMembers) {
      setCurrentMemberIndex((prev) => prev + 1);
    } else {
      setCurrentMemberIndex(0);
      setPhase("tracing");
    }
  };

  const handleTracingComplete = (result: {
    accuracy: number;
    delay: number;
    score: number;
  }) => {
    haptic("success");
    const updatedTracingScores = {
      ...tracingScores,
      [currentMember?.name ?? ""]: result.score,
    };
    setTracingScores(updatedTracingScores);

    if (currentMemberIndex + 1 < totalMembers) {
      setCurrentMemberIndex((prev) => prev + 1);
    } else {
      setPhase("complete");
      const finalResults =
        team?.members.map((m) => ({
          name: m.name,
          dominantTime: dominantTimes[m.name],
          nonDominantTime: nonDominantTimes[m.name],
          tracingScore: updatedTracingScores[m.name],
        })) || [];
      onComplete(finalResults);
    }
  };

  if (phase === "setup") {
    return (
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Ionicons name="pulse-outline" size={22} color="#2563EB" />
          <Text style={styles.title}>Reaction Board</Text>
        </View>
        <Text style={styles.subtitle}>{"Test your team's reaction time!"}</Text>

        <View style={styles.memberList}>
          {team?.members.map((member, idx) => (
            <View key={idx} style={styles.memberItem}>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.statusRow}>
                <Ionicons name="ellipse-outline" size={12} color="#64748B" />
                <Text style={styles.memberStatus}>Ready</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.phaseInfo}>
          Phase 1: Dominant Hand (5 trials each)
        </Text>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            haptic("medium");
            setPhase("dominant");
            setCurrentMemberIndex(0);
          }}
        >
          <Text style={styles.startButtonText}>Start Test</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === "dominant") {
    return (
      <View style={styles.container}>
        <View style={styles.phaseHeader}>
          <View style={styles.phaseTitleRow}>
            <Ionicons name="hand-left-outline" size={18} color="#0F172A" />
            <Text style={styles.phaseTitle}>Phase 1: Dominant Hand</Text>
          </View>
          <Text style={styles.phaseProgress}>
            {currentMemberIndex + 1} of {totalMembers}
          </Text>
        </View>
        <Text style={styles.memberPrompt}>
          Now testing: {currentMember?.name}
        </Text>
        <TapReactionGame
          key={`dominant-${currentMemberIndex}`}
          memberName={currentMember?.name || ""}
          handLabel="Dominant Hand"
          onComplete={handleDominantComplete}
          existingTimes={[]}
        />
      </View>
    );
  }

  if (phase === "nonDominant") {
    return (
      <View style={styles.container}>
        <View style={styles.phaseHeader}>
          <View style={styles.phaseTitleRow}>
            <Ionicons name="hand-right-outline" size={18} color="#0F172A" />
            <Text style={styles.phaseTitle}>Phase 2: Non-Dominant Hand</Text>
          </View>
          <Text style={styles.phaseProgress}>
            {currentMemberIndex + 1} of {totalMembers}
          </Text>
        </View>
        <Text style={styles.memberPrompt}>
          Now testing: {currentMember?.name}
        </Text>
        <TapReactionGame
          key={`nonDominant-${currentMemberIndex}`}
          memberName={currentMember?.name || ""}
          handLabel="Non-Dominant Hand"
          onComplete={handleNonDominantComplete}
          existingTimes={[]}
        />
      </View>
    );
  }

  if (phase === "tracing") {
    return (
      <View style={styles.container}>
        <View style={styles.phaseHeader}>
          <View style={styles.phaseTitleRow}>
            <Ionicons name="pencil-outline" size={18} color="#0F172A" />
            <Text style={styles.phaseTitle}>Phase 3: Tracing Challenge</Text>
          </View>
          <Text style={styles.phaseProgress}>
            {currentMemberIndex + 1} of {totalMembers}
          </Text>
        </View>
        <Text style={styles.memberPrompt}>
          Now testing: {currentMember?.name}
        </Text>
        <TracingRecorder
          key={`tracing-${currentMemberIndex}`}
          onComplete={handleTracingComplete}
        />
      </View>
    );
  }

  const finalResults =
    team?.members.map((m) => ({
      name: m.name,
      dominantMs: dominantTimes[m.name],
      nonDominantMs: nonDominantTimes[m.name],
      difference:
        dominantTimes[m.name] && nonDominantTimes[m.name]
          ? nonDominantTimes[m.name] - dominantTimes[m.name]
          : 0,
      tracingScore: tracingScores[m.name],
    })) || [];

  const fastestMember = finalResults.reduce(
    (fastest, current) =>
      current.dominantMs &&
      (!fastest.dominantMs || current.dominantMs < fastest.dominantMs)
        ? current
        : fastest,
    finalResults[0],
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name="trophy-outline" size={22} color="#2563EB" />
        <Text style={styles.title}>Team Results</Text>
      </View>

      <View style={styles.fastestCard}>
        <Text style={styles.fastestLabel}>Fastest Reaction</Text>
        <Text style={styles.fastestName}>{fastestMember?.name}</Text>
        <Text style={styles.fastestTime}>{fastestMember?.dominantMs} ms</Text>
      </View>

      <ScrollView style={styles.resultsList}>
        {finalResults.map((result, idx) => (
          <View key={idx} style={styles.resultCard}>
            <Text style={styles.resultName}>{result.name}</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Dominant Hand:</Text>
              <Text style={styles.resultValue}>
                {result.dominantMs || "-"} ms
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Non-Dominant:</Text>
              <Text style={styles.resultValue}>
                {result.nonDominantMs || "-"} ms
              </Text>
            </View>
            {result.difference !== 0 && (
              <Text
                style={[
                  styles.resultDiff,
                  result.difference > 0 ? styles.slower : styles.faster,
                ]}
              >
                {result.difference > 0
                  ? `+${result.difference} ms slower`
                  : `${Math.abs(result.difference)} ms faster`}
              </Text>
            )}
            {result.tracingScore && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Tracing Score:</Text>
                <Text style={styles.resultValue}>
                  {result.tracingScore}/100
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => {
          const final = finalResults.map((r) => ({
            name: r.name,
            dominantTime: r.dominantMs,
            nonDominantTime: r.nonDominantMs,
            tracingScore: r.tracingScore,
          }));
          onComplete(final);
        }}
      >
        <Text style={styles.completeButtonText}>Save Results</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  memberList: { marginBottom: 20 },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    marginBottom: 8,
  },
  memberName: { color: "#0F172A", fontWeight: "600" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  memberStatus: { color: "#64748B" },
  phaseInfo: {
    color: "#2563EB",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  startButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  phaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  phaseTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  phaseTitle: { color: "#0F172A", fontSize: 16, fontWeight: "700" },
  phaseProgress: { color: "#64748B" },
  memberPrompt: {
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  fastestCard: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  fastestLabel: { color: "#EFF6FF", fontSize: 12, fontWeight: "600" },
  fastestName: { color: "#EFF6FF", fontSize: 24, fontWeight: "800" },
  fastestTime: { color: "#EFF6FF", fontSize: 18, fontWeight: "700" },
  resultsList: { maxHeight: 300, marginBottom: 16 },
  resultCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  resultName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  resultLabel: { color: "#64748B", fontSize: 13 },
  resultValue: { color: "#2563EB", fontWeight: "700", fontSize: 13 },
  resultDiff: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 6,
    padding: 4,
    borderRadius: 6,
  },
  slower: { backgroundColor: "#FEE2E2", color: "#DC2626" },
  faster: { backgroundColor: "#EFF6FF", color: "#2563EB" },
  completeButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  completeButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
