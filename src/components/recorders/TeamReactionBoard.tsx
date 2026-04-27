// components/recorders/TeamReactionBoard.tsx
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
  const [results, setResults] = useState<MemberResult[]>(
    team?.members.map((m) => ({ name: m.name })) || [],
  );
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
    setTracingScores((prev) => ({
      ...prev,
      [currentMember?.name ?? ""]: result.score,
    }));

    if (currentMemberIndex + 1 < totalMembers) {
      setCurrentMemberIndex((prev) => prev + 1);
    } else {
      setPhase("complete");
      const finalResults =
        team?.members.map((m) => ({
          name: m.name,
          dominantTime: dominantTimes[m.name],
          nonDominantTime: nonDominantTimes[m.name],
          tracingScore: tracingScores[m.name],
        })) || [];
      onComplete(finalResults);
    }
  };

  if (phase === "setup") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎮 Reaction Board</Text>
        <Text style={styles.subtitle}>Test your team's reaction time!</Text>

        <View style={styles.memberList}>
          {team?.members.map((member, idx) => (
            <View key={idx} style={styles.memberItem}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberStatus}>⏳ Ready</Text>
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
          <Text style={styles.startButtonText}>🚀 Start Test</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (phase === "dominant") {
    return (
      <View style={styles.container}>
        <View style={styles.phaseHeader}>
          <Text style={styles.phaseTitle}>👆 Phase 1: Dominant Hand</Text>
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
          <Text style={styles.phaseTitle}>🖐️ Phase 2: Non-Dominant Hand</Text>
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
          <Text style={styles.phaseTitle}>✏️ Phase 3: Tracing Challenge</Text>
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

  // Phase: complete - show results
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
      <Text style={styles.title}>🏆 Team Results</Text>

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
                {result.dominantMs || "—"} ms
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Non-Dominant:</Text>
              <Text style={styles.resultValue}>
                {result.nonDominantMs || "—"} ms
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
        <Text style={styles.completeButtonText}>✅ Save Results</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 20,
  },
  memberList: { marginBottom: 20 },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#0F172A",
    borderRadius: 10,
    marginBottom: 8,
  },
  memberName: { color: "#F8FAFC", fontWeight: "600" },
  memberStatus: { color: "#64748B" },
  phaseInfo: {
    color: "#22C55E",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  startButton: {
    backgroundColor: "#22C55E",
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
  phaseTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" },
  phaseProgress: { color: "#94A3B8" },
  memberPrompt: {
    color: "#22C55E",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  fastestCard: {
    backgroundColor: "#22C55E",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  fastestLabel: { color: "#0F172A", fontSize: 12, fontWeight: "600" },
  fastestName: { color: "#0F172A", fontSize: 24, fontWeight: "800" },
  fastestTime: { color: "#0F172A", fontSize: 18, fontWeight: "700" },
  resultsList: { maxHeight: 300, marginBottom: 16 },
  resultCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  resultName: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  resultLabel: { color: "#94A3B8", fontSize: 13 },
  resultValue: { color: "#22C55E", fontWeight: "700", fontSize: 13 },
  resultDiff: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 6,
    padding: 4,
    borderRadius: 6,
  },
  slower: { backgroundColor: "#FEE2E2", color: "#DC2626" },
  faster: { backgroundColor: "#DCFCE7", color: "#16A34A" },
  completeButton: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  completeButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
