import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTeam } from "../../context/TeamContext";
import { useHaptic } from "../../hooks/useHaptic";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";
import { BreathingRecorder } from "./BreathingRecorder";

interface MemberResult {
  name: string;
  bpm: number;
}

interface TeamBreathingBoardProps {
  onComplete: (results: MemberResult[]) => void;
  existingValue?: string;
}

export function TeamBreathingBoard({
  onComplete,
  existingValue,
}: TeamBreathingBoardProps) {
  const { team } = useTeam();
  const { haptic } = useHaptic();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [memberBpms, setMemberBpms] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const members = team?.members ?? [];
  const totalMembers = members.length;
  const currentMember = members[currentMemberIndex];

  useEffect(() => {
    if (!existingValue) return;
    try {
      const parsed = JSON.parse(existingValue) as MemberResult[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const bpms: Record<string, number> = {};
        parsed.forEach((r) => {
          bpms[r.name] = r.bpm;
        });
        setMemberBpms(bpms);
        setDone(true);
      }
    } catch {}
  }, []);

  const handleCapture = (bpm: number) => {
    if (!currentMember || bpm <= 0) return;
    haptic("success");

    const updatedBpms = { ...memberBpms, [currentMember.name]: bpm };
    setMemberBpms(updatedBpms);

    if (currentMemberIndex + 1 < totalMembers) {
      setCurrentMemberIndex((prev) => prev + 1);
    } else {
      const final = members.map((m) => ({
        name: m.name,
        bpm: updatedBpms[m.name] ?? 0,
      }));
      setDone(true);
      onComplete(final);
    }
  };

  if (done) {
    const results = members.map((m) => ({
      name: m.name,
      bpm: memberBpms[m.name] ?? 0,
    }));
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Team Breathing Results</Text>
        {results.map((r, i) => (
          <View key={i} style={styles.resultRow}>
            <Text style={styles.memberName}>{r.name}</Text>
            <Text style={styles.bpmValue}>{r.bpm} bpm</Text>
          </View>
        ))}
      </View>
    );
  }

  if (totalMembers === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.hint}>No team members found. Set up your team first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Breathing Test</Text>
        <Text style={styles.progress}>
          {currentMemberIndex + 1} of {totalMembers}
        </Text>
      </View>
      <Text style={styles.memberPrompt}>
        Now measuring: {currentMember?.name}
      </Text>
      <BreathingRecorder
        key={currentMember?.name}
        onCapture={handleCapture}
      />
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      color: c.text,
      fontSize: 16,
      fontWeight: "700",
    },
    progress: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: "500",
    },
    memberPrompt: {
      color: c.primary,
      fontWeight: "700",
      fontSize: 14,
      textAlign: "center",
    },
    resultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderFaint,
    },
    memberName: {
      color: c.text,
      fontSize: 14,
      fontWeight: "600",
    },
    bpmValue: {
      color: c.primary,
      fontSize: 15,
      fontWeight: "700",
    },
    hint: {
      color: c.textSecondary,
      textAlign: "center",
      fontSize: 13,
    },
  });
}
