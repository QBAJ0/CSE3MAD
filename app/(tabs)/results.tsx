import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
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
        <ThemedText type="title">Results</ThemedText>
        {error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          <ThemedText style={styles.empty}>
            No saved activity results yet. Record a result from the Activities
            tab.
          </ThemedText>
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
      <ThemedText type="title" style={styles.heading}>
        Results
      </ThemedText>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {rows.map((r) => (
        <View key={r.id} style={styles.card}>
          <ThemedText type="defaultSemiBold">{r.activityName}</ThemedText>
          <ThemedText>
            Team: {teamNames[r.teamId] ?? `id ${r.teamId}`}
          </ThemedText>
          <ThemedText>Score: {r.score}</ThemedText>
          <ThemedText>
            Sensor:{" "}
            {r.sensorValue !== null && r.sensorValue !== undefined
              ? String(r.sensorValue)
              : "—"}
          </ThemedText>
          <ThemedText>
            Notes: {r.notes && r.notes.length > 0 ? r.notes : "—"}
          </ThemedText>
          <ThemedText style={styles.muted}>
            Saved: {formatWhen(r.createdAt)}
          </ThemedText>
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
  },
  heading: {
    marginBottom: 4,
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
  muted: {
    fontSize: 12,
    opacity: 0.7,
  },
});
