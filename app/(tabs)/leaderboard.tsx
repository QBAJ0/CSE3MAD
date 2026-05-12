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
import { fetchLeaderboard } from "@/src/services/resultDb";
import type { LeaderboardRow } from "@/src/types/db";

export default function LeaderboardTabScreen() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setRows(await fetchLeaderboard());
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
        <ThemedText type="title">Leaderboard</ThemedText>
        {error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          <ThemedText style={styles.empty}>
            No leaderboard data yet. Save at least one activity result for a
            team.
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
        Leaderboard
      </ThemedText>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      {rows.map((r) => (
        <View key={r.teamId} style={styles.row}>
          <ThemedText type="defaultSemiBold" style={styles.rank}>
            #{r.rank}
          </ThemedText>
          <View style={styles.rowBody}>
            <ThemedText type="defaultSemiBold">{r.teamName}</ThemedText>
            <ThemedText>Total score: {r.totalScore}</ThemedText>
            <ThemedText style={styles.muted}>
              Activities completed: {r.completedActivityCount}
            </ThemedText>
          </View>
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
    gap: 10,
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
  row: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f8fafc",
  },
  rank: {
    minWidth: 36,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  muted: {
    fontSize: 13,
    opacity: 0.75,
  },
});
