// src/components/challenge/ChallengeScreenShell.tsx
// Reusable layout shell for all challenge recording screens.

import { ReactNode, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";
import { ChallengeTabBar } from "./ChallengeTabBar";
import { ChallengeTimer } from "./ChallengeTimer";

// ── Types ────────────────────────────────────────────────────────────────────

export type PrototypeDot = {
  index: number;
  isActive: boolean;
  isComplete: boolean;
};

type ShellProps = {
  challengeId: number;
  activeTab: "brief" | "doit" | "reflect";
  doitEnabled: boolean;
  reflectEnabled: boolean;
  onBrief: () => void;
  onDoit: () => void;
  onReflect: () => void;
  onReflectDisabledPress: () => void;

  timerMinutes: number;
  onTimeout: () => void;
  timerAutoStart?: boolean;
  timeExpired?: boolean;

  currentDesignNum: number;
  maxDesigns: number;
  challengeColor: string;

  prototypeDots: PrototypeDot[];
  onSelectPrototype: (dotIndex: number) => void;
  allPrototypesComplete: boolean;

  missingFields?: string[];
  currentDesignIndex: number;

  children: ReactNode;

  canProceed: boolean;
  onNext: () => void;
  nextLabel: string;
  onSaveAndExit: () => void;
};

// ── Shell ────────────────────────────────────────────────────────────────────

export default function ChallengeScreenShell({
  activeTab,
  doitEnabled,
  reflectEnabled,
  onBrief,
  onDoit,
  onReflect,
  onReflectDisabledPress,
  timerMinutes,
  onTimeout,
  timerAutoStart = true,
  timeExpired = false,
  currentDesignNum,
  maxDesigns,
  challengeColor,
  prototypeDots,
  onSelectPrototype,
  allPrototypesComplete,
  missingFields = [],
  currentDesignIndex,
  children,
  canProceed,
  onNext,
  nextLabel,
  onSaveAndExit,
}: ShellProps) {
  const { colors } = useTheme();
  const shell = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={shell.screen}
      contentContainerStyle={shell.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Tab bar ── */}
      <ChallengeTabBar
        active={activeTab}
        onBrief={onBrief}
        onDoit={onDoit}
        onReflect={onReflect}
        onReflectDisabledPress={onReflectDisabledPress}
        doitEnabled={doitEnabled}
        reflectEnabled={reflectEnabled}
      />

      {/* ── Countdown timer ── */}
      <ChallengeTimer
        minutes={timerMinutes}
        onTimeout={onTimeout}
        autoStart={timerAutoStart && !timeExpired}
      />

      {/* ── Design header ── */}
      <View style={shell.header}>
        <View
          style={[
            shell.designBadge,
            { backgroundColor: challengeColor + "22" },
          ]}
        >
          <Text style={[shell.designBadgeText, { color: challengeColor }]}>
            Design {currentDesignNum} of {maxDesigns}
          </Text>
        </View>
        <Text style={shell.title}>Record results</Text>
        <Text style={shell.subtitle}>
          Fill the required fields. Photos, videos, and GPS add evidence.
        </Text>
      </View>

      {/* ── Multi-design progress hint ── */}
      {maxDesigns > 1 && (
        <View style={shell.progressHint}>
          <Text style={shell.progressHintText}>
            {allPrototypesComplete
              ? `All ${maxDesigns} designs complete — tap Reflect to continue.`
              : `Complete measurements for each design (${prototypeDots.length} of ${maxDesigns} started).`}
          </Text>
        </View>
      )}

      {/* ── Prototype selector dots ── */}
      {prototypeDots.length > 1 && (
        <View style={shell.protoRow}>
          {prototypeDots.map((dot, i) => (
            <TouchableOpacity
              key={dot.index}
              style={[
                shell.protoDot,
                dot.isActive && shell.protoDotActive,
                !dot.isComplete && !dot.isActive && shell.protoDotIncomplete,
              ]}
              onPress={() => onSelectPrototype(i)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  shell.protoDotText,
                  dot.isActive && shell.protoDotTextActive,
                ]}
              >
                {dot.index}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Validation hint ── */}
      {missingFields.length > 0 && (
        <View style={shell.validationCard}>
          <Text style={shell.validationTitle}>
            Still needed for Design #{currentDesignIndex}:
          </Text>
          <Text style={shell.validationBody}>{missingFields.join(", ")}</Text>
        </View>
      )}

      {/* ── Activity-specific content slot ── */}
      {children}

      {/* ── Primary CTA ── */}
      <Pressable
        style={({ pressed }) => [
          shell.cta,
          !canProceed && shell.ctaDisabled,
          pressed && canProceed && shell.ctaPressed,
        ]}
        onPress={onNext}
      >
        <Text style={shell.ctaText}>{nextLabel}</Text>
        {!canProceed && (
          <Text style={shell.ctaHint}>
            {maxDesigns > 1 &&
            prototypeDots.length === maxDesigns &&
            !allPrototypesComplete
              ? "Finish every design before Reflect"
              : "Complete required fields above"}
          </Text>
        )}
      </Pressable>

      {/* ── Time-expired banner ── */}
      {timeExpired && (
        <View style={shell.expiredBanner}>
          <Text style={shell.expiredText}>
            Time expired — an XP penalty applies.
          </Text>
        </View>
      )}

      {/* ── Save & Exit ── */}
      <TouchableOpacity
        style={shell.exitBtn}
        onPress={onSaveAndExit}
        activeOpacity={0.7}
      >
        <Text style={shell.exitText}>Save and exit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Reusable sub-components ──────────────────────────────────────────────────

export function SectionCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  return <View style={[s.sectionCard, style]}>{children}</View>;
}

export function FieldWrapper({
  label,
  unit,
  children,
}: {
  label: string;
  unit?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>
        {label}
        {unit ? ` (${unit})` : ""}
      </Text>
      {children}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 48,
      gap: 12,
    },

    header: { gap: 4, paddingTop: 4 },
    designBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      marginBottom: 4,
    },
    designBadgeText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
    title: { fontSize: 24, fontWeight: "800", color: c.text, lineHeight: 30 },
    subtitle: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

    progressHint: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    progressHintText: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },

    protoRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
    protoDot: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    protoDotActive: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
    protoDotIncomplete: { borderColor: "#F59E0B", borderWidth: 2 },
    protoDotText: { fontSize: 15, fontWeight: "700", color: c.textSecondary },
    protoDotTextActive: { color: "#FFFFFF" },

    validationCard: {
      backgroundColor: c.warningLight,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: c.warning,
      gap: 4,
    },
    validationTitle: { fontSize: 13, fontWeight: "700", color: "#92400E" },
    validationBody: { fontSize: 13, color: "#78350F", lineHeight: 18 },

    sectionCard: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
    },

    field: { gap: 8, marginBottom: 20 },
    fieldLabel: { fontSize: 14, fontWeight: "800", color: c.text },

    cta: {
      backgroundColor: c.cta,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: "center",
      gap: 4,
    },
    ctaDisabled: { backgroundColor: c.border },
    ctaPressed: { opacity: 0.88 },
    ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", letterSpacing: 0.2 },
    ctaHint: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600" },

    expiredBanner: {
      backgroundColor: c.dangerLight,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.danger,
    },
    expiredText: { color: c.danger, fontSize: 13, fontWeight: "700" },

    exitBtn: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 20 },
    exitText: { color: c.textMuted, fontSize: 13, fontWeight: "600" },
  });
}
