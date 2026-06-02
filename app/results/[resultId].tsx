import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  fetchChallengeResultById,
  parseChallengePayload,
} from "../../src/services/challengeResultDb";
import { getChallengeById } from "../../src/data/challenges";
import { ActivityResult } from "../../src/types";
import type { ColorTokens } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/themeContext";

const EVIDENCE_RECORDERS = new Set([
  "gps", "video", "videoAnalyzer", "slowMotion", "photo",
]);

export default function PastResultScreen() {
  const { resultId } = useLocalSearchParams<{ resultId: string }>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [result, setResult] = useState<ActivityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!resultId) { setNotFound(true); setLoading(false); return; }
    fetchChallengeResultById(resultId)
      .then((row) => {
        if (!row) { setNotFound(true); return; }
        setResult(parseChallengePayload(row));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [resultId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (notFound || !result) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Result not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const challenge = getChallengeById(result.challengeId);
  const date = new Date(result.createdAt).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric",
  });
  const difficultyLabel = result.difficulty === "highSchool" ? "High School" : "Primary";

  const visibleMeasurements = challenge?.measurements.filter(
    (m) =>
      (!m.difficulty || m.difficulty === result.difficulty) &&
      !EVIDENCE_RECORDERS.has(m.recorder),
  ) ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
        <Text style={styles.backLabel}>Past Results</Text>
      </Pressable>

      <View style={styles.header}>
        {challenge && (
          <View style={[styles.iconCircle, { backgroundColor: challenge.color + "22" }]}>
            <Ionicons name={challenge.icon as any} size={36} color={challenge.color} />
          </View>
        )}
        <Text style={styles.title}>{challenge?.title ?? `Activity ${result.challengeId}`}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{result.teamName} {result.teamId}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{difficultyLabel}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{date}</Text>
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons
              key={n}
              name={n <= result.rating ? "star" : "star-outline"}
              size={22}
              color={colors.cta}
            />
          ))}
          <Text style={styles.ratingLabel}>{result.rating}/5</Text>
        </View>
      </View>

      {/* Per-prototype measurements */}
      {result.prototypes.map((p, idx) => (
        <View key={p.index} style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="construct-outline" size={15} color={colors.text} />
            <Text style={styles.cardTitle}>Design {idx + 1}</Text>
          </View>
          {visibleMeasurements.map((m) => {
            const val = p.measurements[m.key];
            if (val === undefined || val === null || String(val).trim() === "") return null;
            return (
              <View key={m.key} style={styles.measureRow}>
                <Text style={styles.measureLabel}>{m.label}</Text>
                <Text style={styles.measureValue}>
                  {String(val)}{m.unit ? ` ${m.unit}` : ""}
                </Text>
              </View>
            );
          })}
          {visibleMeasurements.every((m) => !p.measurements[m.key]) && (
            <Text style={styles.emptyText}>No measurements recorded.</Text>
          )}
        </View>
      ))}

      {/* Reflection */}
      {result.reflection ? (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="document-text-outline" size={15} color={colors.text} />
            <Text style={styles.cardTitle}>Reflection</Text>
          </View>
          <Text style={styles.reflectionText}>{result.reflection}</Text>
        </View>
      ) : null}

      {/* Points */}
      {result.points != null && (
        <View style={styles.pointsBanner}>
          <Ionicons name="trophy-outline" size={18} color={colors.cta} />
          <Text style={styles.pointsText}>{result.points} points earned</Text>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (c: ColorTokens) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.background, gap: 12 },
    errorText: { fontSize: 16, color: c.textSecondary },
    backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: c.primary, borderRadius: 8 },
    backBtnText: { color: "#fff", fontWeight: "700" },
    backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
    backLabel: { fontSize: 14, color: c.primary, fontWeight: "600" },
    header: { alignItems: "center", marginBottom: 20, gap: 6 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 4 },
    title: { fontSize: 22, fontWeight: "800", color: c.text, textAlign: "center" },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" },
    metaText: { fontSize: 12, color: c.textSecondary },
    metaDot: { fontSize: 12, color: c.textSecondary },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    ratingLabel: { fontSize: 13, color: c.textSecondary, marginLeft: 4 },
    card: { backgroundColor: c.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: c.border },
    cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    cardTitle: { fontSize: 14, fontWeight: "700", color: c.text },
    measureRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: c.border },
    measureLabel: { fontSize: 13, color: c.textSecondary, flex: 1 },
    measureValue: { fontSize: 13, fontWeight: "600", color: c.text },
    emptyText: { fontSize: 13, color: c.textMuted, fontStyle: "italic" },
    reflectionText: { fontSize: 14, color: c.text, lineHeight: 20 },
    pointsBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.cta + "18", borderRadius: 10, padding: 12, justifyContent: "center" },
    pointsText: { fontSize: 15, fontWeight: "700", color: c.cta },
  });
