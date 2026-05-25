import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type ChallengeTab = "brief" | "doit" | "reflect";

interface Props {
  active: ChallengeTab;
  onBrief: () => void;
  onDoit?: () => void;
  onReflect?: () => void;
  onReflectDisabledPress?: () => void;
  doitEnabled?: boolean;
  reflectEnabled?: boolean;
}

export function ChallengeTabBar({
  active,
  onBrief,
  onDoit,
  onReflect,
  onReflectDisabledPress,
  doitEnabled = false,
  reflectEnabled = false,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, active === "brief" && styles.activeTab]}
        onPress={onBrief}
      >
        <Text style={[styles.label, active === "brief" && styles.activeLabel]}>
          Brief
        </Text>
        {active === "brief" && <View style={styles.dot} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          active === "doit" && styles.activeTab,
          !doitEnabled && active !== "doit" && styles.disabledTab,
        ]}
        onPress={doitEnabled ? onDoit : undefined}
        activeOpacity={doitEnabled ? 0.7 : 1}
      >
        <Text
          style={[
            styles.label,
            active === "doit" && styles.activeLabel,
            !doitEnabled && active !== "doit" && styles.disabledLabel,
          ]}
        >
          Do It
        </Text>
        {active === "doit" && <View style={styles.dot} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          active === "reflect" && styles.activeTab,
          !reflectEnabled && active !== "reflect" && styles.disabledTab,
        ]}
        onPress={() => {
          if (reflectEnabled) onReflect?.();
          else onReflectDisabledPress?.();
        }}
        activeOpacity={reflectEnabled ? 0.7 : 1}
      >
        <Text
          style={[
            styles.label,
            active === "reflect" && styles.activeLabel,
            !reflectEnabled && active !== "reflect" && styles.disabledLabel,
          ]}
        >
          Reflect
        </Text>
        {active === "reflect" && <View style={styles.dot} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledTab: { opacity: 0.4 },
  label: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  activeLabel: { color: "#0F172A", fontWeight: "700" },
  disabledLabel: { color: "#94A3B8" },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2563EB",
    marginTop: 4,
  },
});
