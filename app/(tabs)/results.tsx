import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchAllActivityResults } from "@/src/services/resultDb";
import { fetchAllTeams } from "@/src/services/teamDb";
import type { ResultRow } from "@/src/types/db";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default function ResultsTabScreen() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [teamNames, setTeamNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [results, teams] = await Promise.all([
      fetchAllActivityResults(),
      fetchAllTeams(),
    ]);
    const map: Record<number, string> = {};
    for (const t of teams) {
      map[t.id] = t.teamName;
    }
    setTeamNames(map);
    setRows(results);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      void (async () => {
        try {
          await load();
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : String(e));
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.center}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={36} color="#F97316" />
          <Text style={styles.title}>Results</Text>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.empty}>
              No saved lab results yet. Open Profile, then Data & tools, then Lab
              activities to record.
            </Text>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="document-text-outline" size={30} color="#FED7AA" />
        </View>
        <Text style={styles.heroTitle}>Results</Text>
        <Text style={styles.heroSubtitle}>Saved lab records from your teams.</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {rows.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardIcon}>
              <Ionicons name="bar-chart-outline" size={19} color="#2563EB" />
            </View>
            <View style={styles.cardTitleWrap}>
              <Text style={styles.cardTitle}>{r.activityName}</Text>
              <Text style={styles.muted}>Saved: {formatWhen(r.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Team</Text>
            <Text style={styles.factValue}>
              {teamNames[r.teamId] ?? `id ${r.teamId}`}
            </Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Score</Text>
            <Text style={styles.factValue}>{r.score}</Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Sensor</Text>
            <Text style={styles.factValue}>
              {r.sensorValue !== null && r.sensorValue !== undefined
                ? String(r.sensorValue)
                : "--"}
            </Text>
          </View>
          <Text style={styles.notes}>
            Notes: {r.notes && r.notes.length > 0 ? r.notes : "--"}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: "#FFF7ED",
  },
  center: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 56,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFF7ED",
  },
  hero: {
    backgroundColor: "#0F766E",
    borderRadius: 24,
    padding: 20,
    gap: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F766E",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: "#FED7AA",
    alignItems: "center",
    gap: 8,
  },
  empty: {
    lineHeight: 22,
    color: "#475569",
    textAlign: "center",
  },
  error: {
    lineHeight: 22,
    color: "#DC2626",
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 18,
    padding: 16,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F766E",
  },
  factRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  factLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
  },
  factValue: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
    textAlign: "right",
  },
  notes: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  muted: {
    fontSize: 12,
    color: "#64748B",
  },
});
