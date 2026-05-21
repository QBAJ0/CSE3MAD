import Ionicons from "@expo/vector-icons/Ionicons";
import * as Battery from "expo-battery";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type BatterySnapshot = {
  level: number | null;
  state: Battery.BatteryState | null;
  lowPowerMode: boolean;
};

const stateLabel: Record<Battery.BatteryState, string> = {
  [Battery.BatteryState.UNKNOWN]: "Unknown",
  [Battery.BatteryState.UNPLUGGED]: "Unplugged",
  [Battery.BatteryState.CHARGING]: "Charging",
  [Battery.BatteryState.FULL]: "Full",
};

function formatLevel(level: number | null) {
  if (level === null) return "--";
  return `${Math.round(level * 100)}%`;
}

function iconForBattery(level: number | null, state: Battery.BatteryState | null) {
  if (state === Battery.BatteryState.CHARGING) return "battery-charging-outline";
  if (level === null) return "battery-half-outline";
  if (level >= 0.9) return "battery-full-outline";
  if (level >= 0.45) return "battery-half-outline";
  return "battery-dead-outline";
}

export function BatteryStatusCard() {
  const [snapshot, setSnapshot] = useState<BatterySnapshot>({
    level: null,
    state: null,
    lowPowerMode: false,
  });

  const loadBattery = useCallback(async () => {
    const [level, state, lowPowerMode] = await Promise.all([
      Battery.getBatteryLevelAsync(),
      Battery.getBatteryStateAsync(),
      Battery.isLowPowerModeEnabledAsync(),
    ]);

    setSnapshot({ level, state, lowPowerMode });
  }, []);

  useEffect(() => {
    loadBattery().catch(console.error);

    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setSnapshot((current) => ({ ...current, level: batteryLevel }));
    });
    const stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
      setSnapshot((current) => ({ ...current, state: batteryState }));
    });
    const lowPowerSub = Battery.addLowPowerModeListener(({ lowPowerMode }) => {
      setSnapshot((current) => ({ ...current, lowPowerMode }));
    });

    return () => {
      levelSub.remove();
      stateSub.remove();
      lowPowerSub.remove();
    };
  }, [loadBattery]);

  const detail = useMemo(() => {
    const state = snapshot.state === null ? "Checking" : stateLabel[snapshot.state];
    return snapshot.lowPowerMode
      ? `${state} · Low Power Mode on`
      : `${state} · Normal power mode`;
  }, [snapshot.lowPowerMode, snapshot.state]);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons
          name={iconForBattery(snapshot.level, snapshot.state)}
          size={16}
          color="#0F766E"
        />
        <Text style={styles.title}>Device Battery</Text>
      </View>
      <Text style={styles.value}>{formatLevel(snapshot.level)}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#FFF7ED",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F766E",
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  detail: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },
});
