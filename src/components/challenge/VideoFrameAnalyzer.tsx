import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { ResizeMode, Video } from "expo-av";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface FrameMarkers {
  dropStart: number | null;     // when toy is released
  firstContact: number | null;  // first ground touch
  atRest: number | null;        // toy stops moving
  bouncePeak: number | null;    // optional: top of bounce
}

type ActiveMark = keyof FrameMarkers;

export interface VideoAnalysisResult {
  fallTimeSeconds?: number;     // derived from dropStart→firstContact
  contactTime: number;          // derived from firstContact→atRest
  bounced: boolean;
  timeToBouncePeak?: number;    // derived from firstContact→bouncePeak
}

interface VideoFrameAnalyzerProps {
  videoUri: string;
  slowMoFactor?: number;
  onComplete: (result: VideoAnalysisResult) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STEP_HINT: Record<ActiveMark, string> = {
  dropStart:    "Step 1 — Scrub to the exact moment the toy is released",
  firstContact: "Step 2 — Scrub to when the toy first touches the ground",
  atRest:       "Step 3 — Scrub to when the toy completely stops moving",
  bouncePeak:   "Step 4 — Scrub to the highest bounce point, or tap Skip",
};

const MARK_BADGE: { key: ActiveMark; icon: string; label: string }[] = [
  { key: "dropStart",    icon: "arrow-down-outline",    label: "Drop"   },
  { key: "firstContact", icon: "locate-outline",        label: "Impact" },
  { key: "atRest",       icon: "hand-left-outline",     label: "Rest"   },
  { key: "bouncePeak",   icon: "trending-up-outline",   label: "Bounce" },
];

const NEXT_MARK: Partial<Record<ActiveMark, ActiveMark>> = {
  dropStart:    "firstContact",
  firstContact: "atRest",
  atRest:       "bouncePeak",
};

const MARK_ALERT: Partial<Record<ActiveMark, [string, string]>> = {
  dropStart:    ["Drop Start Marked", "Now scrub to when the toy first hits the ground"],
  firstContact: ["First Contact Marked", "Now scrub to when the toy stops moving completely"],
  atRest:       ["At Rest Marked", "If it bounced, scrub to the highest bounce point — otherwise tap Skip Bounce"],
};

// ── Component ────────────────────────────────────────────────────────────────

export function VideoFrameAnalyzer({
  videoUri,
  slowMoFactor = 4,
  onComplete,
}: VideoFrameAnalyzerProps) {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const { haptic } = useHaptic();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [isPlaying, setIsPlaying]     = useState(false);
  const [activeMark, setActiveMark]   = useState<ActiveMark>("dropStart");
  const [marks, setMarks] = useState<FrameMarkers>({
    dropStart:    null,
    firstContact: null,
    atRest:       null,
    bouncePeak:   null,
  });

  const videoRef = useRef<Video>(null);

  // Real-world time accounting for slow-motion factor
  const toReal = (videoSecs: number) => videoSecs / slowMoFactor;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toFixed(2).padStart(5, "0")}`;
  };

  const seek = (secs: number) => {
    const clamped = Math.max(0, Math.min(duration, secs));
    videoRef.current?.setPositionAsync(clamped * 1000);
    setCurrentTime(clamped);
  };

  const stepFrame = (dir: 1 | -1) => {
    haptic("light");
    seek(currentTime + (1 / 30) * dir);
  };

  const handleMark = () => {
    haptic("medium");
    setMarks((prev) => ({ ...prev, [activeMark]: currentTime }));

    const alert = MARK_ALERT[activeMark];
    if (alert) Alert.alert(alert[0], alert[1]);

    const next = NEXT_MARK[activeMark];
    if (next) setActiveMark(next);
  };

  const resetMarks = () => {
    haptic("warning");
    setMarks({ dropStart: null, firstContact: null, atRest: null, bouncePeak: null });
    setActiveMark("dropStart");
  };

  const handleComplete = () => {
    if (!marks.firstContact || !marks.atRest) {
      Alert.alert("Not done", "Mark First Contact and At Rest before saving");
      return;
    }

    const contactTime = toReal(Math.abs(marks.atRest - marks.firstContact));
    const bounced     = marks.bouncePeak !== null;

    onComplete({
      fallTimeSeconds: marks.dropStart !== null
        ? toReal(Math.abs(marks.firstContact - marks.dropStart))
        : undefined,
      contactTime,
      bounced,
      timeToBouncePeak: bounced
        ? toReal(Math.abs(marks.bouncePeak! - marks.firstContact))
        : undefined,
    });
  };

  const requiredDone = marks.firstContact !== null && marks.atRest !== null;
  const renderTime   = (v: number | null) =>
    v === null ? "—" : `${toReal(v).toFixed(3)}s`;

  const hasVideo = !!videoUri;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.headerRow}>
        <Ionicons name="film-outline" size={16} color={colors.info} />
        <Text style={s.headerTitle}>Frame-by-Frame Analysis</Text>
        <View style={s.slowMoPill}>
          <Text style={s.slowMoText}>×{slowMoFactor} slow-mo</Text>
        </View>
      </View>

      <Text style={s.stepHint}>{STEP_HINT[activeMark]}</Text>

      {/* Video player */}
      {hasVideo ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={s.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setCurrentTime(status.positionMillis / 1000);
              if (status.durationMillis)
                setDuration(status.durationMillis / 1000);
            }
          }}
        />
      ) : (
        <View style={[s.video, s.videoEmpty]}>
          <Ionicons name="videocam-outline" size={32} color={colors.textMuted} />
          <Text style={s.videoEmptyText}>
            Record the slow-motion video above first
          </Text>
        </View>
      )}

      {/* Playback controls */}
      <View style={s.controls}>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => stepFrame(-1)}
          disabled={!hasVideo}
        >
          <Ionicons name="play-back" size={13} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.iconBtn, s.playBtn]}
          onPress={() => { haptic("light"); setIsPlaying((p) => !p); }}
          disabled={!hasVideo}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={17} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => stepFrame(1)}
          disabled={!hasVideo}
        >
          <Ionicons name="play-forward" size={13} color="#FFF" />
        </TouchableOpacity>

        <View style={s.sliderWrap}>
          <Slider
            style={s.slider}
            value={currentTime}
            minimumValue={0}
            maximumValue={duration || 1}
            onSlidingComplete={seek}
            minimumTrackTintColor={colors.info}
            maximumTrackTintColor={colors.border}
          />
          <Text style={s.timeText}>{formatTime(currentTime)}</Text>
        </View>
      </View>

      {/* Mark badges */}
      <View style={s.badgesRow}>
        {MARK_BADGE.map(({ key, icon, label }) => {
          const isSet    = marks[key] !== null;
          const isActive = activeMark === key && !isSet;
          return (
            <View
              key={key}
              style={[
                s.badge,
                isSet    && s.badgeDone,
                isActive && s.badgeActive,
              ]}
            >
              <Ionicons name={icon as any} size={11} color="#FFF" />
              <Text style={s.badgeLabel}>{label}</Text>
              <Text style={s.badgeTime}>{renderTime(marks[key])}</Text>
            </View>
          );
        })}
      </View>

      {/* Action buttons */}
      <View style={s.actionRow}>
        {!requiredDone && (
          <TouchableOpacity
            style={[s.btn, s.markBtn]}
            onPress={handleMark}
            disabled={!hasVideo}
          >
            <Ionicons name="pin-outline" size={15} color="#FFF" />
            <Text style={s.btnText}>
              {activeMark === "dropStart"    ? "Mark Drop Start"    :
               activeMark === "firstContact" ? "Mark First Contact" :
               activeMark === "atRest"       ? "Mark At Rest"       :
                                               "Mark Bounce Peak"}
            </Text>
          </TouchableOpacity>
        )}

        {activeMark === "bouncePeak" && marks.bouncePeak === null && (
          <TouchableOpacity style={[s.btn, s.skipBtn]} onPress={handleComplete}>
            <Text style={s.btnText}>Skip Bounce</Text>
          </TouchableOpacity>
        )}

        {marks.dropStart !== null && (
          <TouchableOpacity style={[s.btn, s.resetBtn]} onPress={resetMarks}>
            <Ionicons name="refresh" size={15} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Save button — appears when required marks are done */}
      {requiredDone && (
        <TouchableOpacity style={s.completeBtn} onPress={handleComplete}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
          <Text style={s.completeBtnText}>Save Analysis Results</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      gap: 12,
    },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "800",
      color: c.text,
    },
    slowMoPill: {
      backgroundColor: c.infoLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    slowMoText: {
      fontSize: 11,
      fontWeight: "700",
      color: c.info,
    },

    stepHint: {
      fontSize: 12,
      color: c.textSecondary,
      lineHeight: 17,
    },

    video: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      backgroundColor: "#000",
    },
    videoEmpty: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderStyle: "dashed",
    },
    videoEmptyText: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: "center",
      paddingHorizontal: 20,
    },

    // Playback controls sit on a dark strip regardless of theme
    controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#1E293B",
      borderRadius: 12,
      padding: 10,
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#334155",
      alignItems: "center",
      justifyContent: "center",
    },
    playBtn: { backgroundColor: "#2563EB" },
    sliderWrap: { flex: 1 },
    slider: { width: "100%", height: 34 },
    timeText: {
      fontSize: 11,
      color: "#94A3B8",
      textAlign: "center",
    },

    badgesRow: { flexDirection: "row", gap: 6 },
    badge: {
      flex: 1,
      alignItems: "center",
      gap: 3,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 10,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    badgeDone:   { backgroundColor: c.info,    borderColor: c.info    },
    badgeActive: { borderColor: c.warning, borderWidth: 2 },
    badgeLabel: { fontSize: 10, fontWeight: "700", color: c.textSecondary },
    badgeTime:  { fontSize: 9,  color: c.textMuted },

    actionRow: { flexDirection: "row", gap: 8 },
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    btnText:  { color: "#FFF", fontWeight: "700", fontSize: 13 },
    markBtn:  { flex: 3, backgroundColor: c.info    },
    skipBtn:  { flex: 2, backgroundColor: c.warning },
    resetBtn: { width: 44, backgroundColor: c.border },

    completeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.success,
      paddingVertical: 14,
      borderRadius: 12,
    },
    completeBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  });
}
