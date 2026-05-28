import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme/themeContext";
import type { ColorTokens } from "../../theme/colors";

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

const TAB_CONFIG: { id: ChallengeTab; label: string; icon: string }[] = [
  { id: "brief",   label: "Brief",   icon: "book-outline" },
  { id: "doit",    label: "Do It",   icon: "play-circle-outline" },
  { id: "reflect", label: "Reflect", icon: "chatbubbles-outline" },
];

export function ChallengeTabBar({
  active,
  onBrief,
  onDoit,
  onReflect,
  onReflectDisabledPress,
  doitEnabled = false,
  reflectEnabled = false,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isEnabled = (id: ChallengeTab) => {
    if (id === "brief") return true;
    if (id === "doit") return doitEnabled;
    return reflectEnabled;
  };

  const handlePress = (id: ChallengeTab) => {
    if (id === "brief") return onBrief();
    if (id === "doit") return doitEnabled ? onDoit?.() : undefined;
    return reflectEnabled ? onReflect?.() : onReflectDisabledPress?.();
  };

  return (
    <View style={styles.container}>
      {TAB_CONFIG.map(({ id, label, icon }) => {
        const isActive = active === id;
        const enabled = isEnabled(id);
        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.tab,
              isActive && styles.activeTab,
              !enabled && active !== id && styles.disabledTab,
            ]}
            onPress={() => handlePress(id)}
            activeOpacity={enabled ? 0.7 : 1}
          >
            <Ionicons
              name={icon as any}
              size={15}
              color={
                isActive
                  ? colors.primary
                  : !enabled
                  ? colors.textMuted
                  : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.label,
                isActive && styles.activeLabel,
                !enabled && active !== id && styles.disabledLabel,
              ]}
            >
              {label}
            </Text>
            {isActive && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: c.backgroundSecondary,
      borderRadius: 14,
      padding: 4,
      marginHorizontal: 20,
      marginTop: 4,
      marginBottom: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      gap: 3,
    },
    activeTab: {
      backgroundColor: c.surface,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    disabledTab: { opacity: 0.4 },
    label: { fontSize: 12, fontWeight: "600", color: c.textSecondary },
    activeLabel: { color: c.text, fontWeight: "700" },
    disabledLabel: { color: c.textMuted },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.primary,
      marginTop: 2,
    },
  });
}
