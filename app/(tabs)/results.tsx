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
        <ActivityIndicator size="large" color="#22C55E" />
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
        <Text style={styles.title}>Results</Text>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <Text style={styles.empty}>
            No saved activity results yet. Open Profile, then Data & tools → Lab
            activities to record.
          </Text>
        )}
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
      <Text style={styles.title}>Results</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {rows.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.cardTitle}>{r.activityName}</Text>
          <Text style={styles.line}>
            Team: {teamNames[r.teamId] ?? `id ${r.teamId}`}
          </Text>
          <Text style={styles.line}>Score: {r.score}</Text>
          <Text style={styles.line}>
            Sensor:{" "}
            {r.sensorValue !== null && r.sensorValue !== undefined
              ? String(r.sensorValue)
              : "—"}
          </Text>
          <Text style={styles.line}>
            Notes: {r.notes && r.notes.length > 0 ? r.notes : "—"}
          </Text>
          <Text style={styles.muted}>Saved: {formatWhen(r.createdAt)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  scroll: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 12,
  },
  center: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 56,
    justifyContent: "center",
    gap: 12,
  },
  empty: {
    lineHeight: 22,
    color: "#475569",
  },
  error: {
    lineHeight: 22,
    color: "#b91c1c",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    gap: 4,
    backgroundColor: "#f8fafc",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  line: {
    fontSize: 15,
    color: "#334155",
  },
  muted: {
    fontSize: 12,
    color: "#64748B",
  },
});
