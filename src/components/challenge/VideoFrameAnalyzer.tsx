import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { ResizeMode, Video } from "expo-av";
import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface FrameMarkers {
  dropStart:    number | null;
  firstContact: number | null;
  atRest:       number | null;
  bouncePeak:   number | null;
}

type ActiveMark   = keyof FrameMarkers;
type BounceChoice = "yes" | "no";
type Confidence   = "not-sure" | "fairly-sure" | "very-confident";

export interface VideoAnalysisResult {
  fallTimeSeconds?:  number;
  contactTime:       number;
  bounced:           boolean;
  timeToBouncePeak?: number;
}

interface VideoFrameAnalyzerProps {
  videoUri:      string;
  slowMoFactor?: number;
  onComplete:    (result: VideoAnalysisResult) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STEP_ORDER: ActiveMark[] = ["dropStart", "firstContact", "atRest", "bouncePeak"];

const STEP_INFO: Record<ActiveMark, { label: string; hint: string; color: string }> = {
  dropStart: {
    label: "Drop Start",
    hint:  "Find the frame where the toy starts falling. Use the frame step buttons if needed.",
    color: "#6366F1",
  },
  firstContact: {
    label: "First Contact",
    hint:  "Now find the first frame where the toy touches the ground.",
    color: "#F59E0B",
  },
  atRest: {
    label: "At Rest",
    hint:  "Find the frame where the toy has completely stopped moving.",
    color: "#10B981",
  },
  bouncePeak: {
    label: "Bounce Peak",
    hint:  "Find the highest point the toy reached after bouncing.",
    color: "#F97316",
  },
};

const SLOW_MO_OPTIONS = [2, 4, 8] as const;
const RATE_OPTIONS    = [0.25, 0.5, 1] as const;

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "not-sure",       label: "Not sure"       },
  { value: "fairly-sure",    label: "Fairly sure"    },
  { value: "very-confident", label: "Very confident" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function VideoFrameAnalyzer({
  videoUri,
  slowMoFactor = 4,
  onComplete,
}: VideoFrameAnalyzerProps) {
  const { colors } = useTheme();
  const s          = useMemo(() => createStyles(colors), [colors]);
  const { haptic } = useHaptic();

  // Playback
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isSeeking,    setIsSeeking]    = useState(false);
  const [playbackRate, setPlaybackRate] = useState<typeof RATE_OPTIONS[number]>(0.25);
  const slowMo = (SLOW_MO_OPTIONS as readonly number[]).includes(slowMoFactor)
    ? (slowMoFactor as typeof SLOW_MO_OPTIONS[number])
    : 4;

  // Marking
  const [activeMark,   setActiveMark]   = useState<ActiveMark>("dropStart");
  const [marks,        setMarks]        = useState<FrameMarkers>({
    dropStart: null, firstContact: null, atRest: null, bouncePeak: null,
  });
  const [bounceChoice, setBounceChoice] = useState<BounceChoice | null>(null);
  const [confidence,   setConfidence]   = useState<Confidence | null>(null);

  const videoRef = useRef<Video>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toReal   = (v: number) => v / slowMo;
  const fmtVideo = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toFixed(2).padStart(5, "0")}`;
  };
  const fmtReal  = (v: number | null) =>
    v === null ? "—" : `${toReal(v).toFixed(3)} s`;

  const seek = (secs: number) => {
    const clamped = Math.max(0, Math.min(duration, secs));
    videoRef.current?.setPositionAsync(clamped * 1000);
    setCurrentTime(clamped);
  };

  const stepFrame = (dir: 1 | -1) => {
    haptic("light");
    seek(currentTime + (1 / 30) * dir);
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleMark = () => {
    haptic("medium");
    setMarks((prev) => ({ ...prev, [activeMark]: currentTime }));
    if (activeMark === "atRest") return; // show bounce question next
    const next: Partial<Record<ActiveMark, ActiveMark>> = {
      dropStart: "firstContact",
      firstContact: "atRest",
    };
    const n = next[activeMark];
    if (n) setActiveMark(n);
  };

  const handleBounceYes = () => {
    haptic("medium");
    setBounceChoice("yes");
    setActiveMark("bouncePeak");
  };

  const handleBounceNo = () => {
    haptic("medium");
    setBounceChoice("no");
  };

  const handleSave = () => {
    if (!marks.firstContact || !marks.atRest) return;
    onComplete({
      fallTimeSeconds: marks.dropStart !== null
        ? toReal(Math.abs(marks.firstContact - marks.dropStart))
        : undefined,
      contactTime: toReal(Math.abs(marks.atRest - marks.firstContact)),
      bounced:     marks.bouncePeak !== null,
      timeToBouncePeak: marks.bouncePeak !== null
        ? toReal(Math.abs(marks.bouncePeak - marks.firstContact))
        : undefined,
    });
  };

  const resetAll = () => {
    haptic("warning");
    setMarks({ dropStart: null, firstContact: null, atRest: null, bouncePeak: null });
    setActiveMark("dropStart");
    setBounceChoice(null);
    setConfidence(null);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const hasVideo       = !!videoUri;
  const stepIndex      = STEP_ORDER.indexOf(activeMark);
  const currentInfo    = STEP_INFO[activeMark];
  const showBounceQ    = marks.atRest !== null && bounceChoice === null;
  const requiredDone   = marks.firstContact !== null && marks.atRest !== null;
  const readyToSave    = requiredDone && bounceChoice !== null
                         && (bounceChoice === "no" || marks.bouncePeak !== null);
  const showMarkBtn    = !showBounceQ && !readyToSave
                         && (activeMark !== "bouncePeak" || bounceChoice === "yes");
  const anyMarked      = Object.values(marks).some((v) => v !== null);

  const previewFall    = marks.dropStart !== null && marks.firstContact !== null
    ? toReal(Math.abs(marks.firstContact - marks.dropStart)) : null;
  const previewContact = marks.firstContact !== null && marks.atRest !== null
    ? toReal(Math.abs(marks.atRest - marks.firstContact)) : null;
  const previewBounce  = marks.bouncePeak !== null && marks.firstContact !== null
    ? toReal(Math.abs(marks.bouncePeak - marks.firstContact)) : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={s.card}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Slow-Motion Analysis</Text>
          <Text style={s.headerSub}>Parachute Drop — frame by frame</Text>
        </View>
        <View style={s.pill}>
          <Text style={s.pillText}>×{slowMo} slow-mo</Text>
        </View>
      </View>

      {/* Step progress */}
      <View style={s.stepRow}>
        {STEP_ORDER.map((key, i) => {
          const done   = marks[key] !== null;
          const active = activeMark === key && !done && !showBounceQ;
          const info   = STEP_INFO[key];
          return (
            <View key={key} style={s.stepOuter}>
              <View style={s.stepConnectorWrap}>
                {i > 0 && (
                  <View style={[s.stepLine, marks[STEP_ORDER[i - 1]] !== null && s.stepLineDone]} />
                )}
              </View>
              <View style={s.stepContent}>
                <View style={[
                  s.stepDot,
                  done   && { backgroundColor: "#10B981", borderColor: "#10B981" },
                  active && { borderColor: info.color, borderWidth: 2.5 },
                ]}>
                  {done
                    ? <Ionicons name="checkmark" size={11} color="#FFF" />
                    : <Text style={[s.stepNum, active && { color: info.color }]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[
                  s.stepLabel,
                  done   && s.stepLabelDone,
                  active && { color: info.color },
                ]}>
                  {info.label}
                </Text>
                {marks[key] !== null && (
                  <Text style={s.stepTime}>{fmtReal(marks[key])}</Text>
                )}
              </View>
              <View style={s.stepConnectorWrap}>
                {i < STEP_ORDER.length - 1 && (
                  <View style={[s.stepLine, marks[key] !== null && s.stepLineDone]} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Step hint */}
      {!readyToSave && !showBounceQ && (
        <View style={[s.hintBox, { borderLeftColor: currentInfo.color }]}>
          <Text style={s.hintText}>
            <Text style={{ fontWeight: "700", color: currentInfo.color }}>
              Step {stepIndex + 1} — {currentInfo.label}:{" "}
            </Text>
            {currentInfo.hint}
          </Text>
        </View>
      )}

      {/* Video */}
      {hasVideo ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={s.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          rate={playbackRate}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              if (!isSeeking) setCurrentTime(status.positionMillis / 1000);
              if (status.durationMillis) setDuration(status.durationMillis / 1000);
            }
          }}
        />
      ) : (
        <View style={[s.video, s.videoEmpty]}>
          <Ionicons name="videocam-outline" size={32} color={colors.textMuted} />
          <Text style={s.videoEmptyText}>
            Record or upload a slow-motion video above to start.
          </Text>
        </View>
      )}

      {/* Transport */}
      <View style={[s.transport, !hasVideo && s.transportDisabled]}>
        <TouchableOpacity
          style={[s.iconBtn, !hasVideo && s.iconBtnOff]}
          onPress={() => stepFrame(-1)}
          disabled={!hasVideo}
        >
          <Ionicons name="play-back" size={14} color={hasVideo ? "#FFF" : "#475569"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.iconBtn, s.playBtn, !hasVideo && s.iconBtnOff]}
          onPress={() => { haptic("light"); setIsPlaying((p) => !p); }}
          disabled={!hasVideo}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={18} color={hasVideo ? "#FFF" : "#475569"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.iconBtn, !hasVideo && s.iconBtnOff]}
          onPress={() => stepFrame(1)}
          disabled={!hasVideo}
        >
          <Ionicons name="play-forward" size={14} color={hasVideo ? "#FFF" : "#475569"} />
        </TouchableOpacity>

        <View style={s.transportDivider} />

        {RATE_OPTIONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[s.rateChip, playbackRate === r && s.rateChipOn, !hasVideo && s.rateChipOff]}
            onPress={() => { haptic("light"); setPlaybackRate(r); }}
            disabled={!hasVideo}
          >
            <Text style={[s.rateChipText, playbackRate === r && s.rateChipTextOn]}>
              {r === 1 ? "1×" : `${r}×`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timeline marker row — coloured dots above the scrub position */}
      <View style={s.timelineWrap}>
        {duration > 0 && STEP_ORDER.map((key) => {
          const t = marks[key];
          if (t === null) return null;
          const pct = Math.min(Math.max(t / duration, 0), 1) * 100;
          return (
            <View
              key={key}
              style={[
                s.timelineDot,
                {
                  left:            `${pct}%` as `${number}%`,
                  backgroundColor: STEP_INFO[key].color,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Scrub */}
      <View style={s.scrubRow}>
        <Text style={s.scrubTime}>{fmtVideo(currentTime)}</Text>
        <Slider
          style={s.slider}
          value={currentTime}
          minimumValue={0}
          maximumValue={duration || 1}
          onSlidingStart={() => { setIsSeeking(true); setIsPlaying(false); }}
          onValueChange={(val) => setCurrentTime(val)}
          onSlidingComplete={(val) => { seek(val); setIsSeeking(false); }}
          minimumTrackTintColor="#6366F1"
          maximumTrackTintColor="#334155"
          thumbTintColor={hasVideo ? "#6366F1" : "#475569"}
          disabled={!hasVideo}
        />
        <Text style={s.scrubTime}>{fmtVideo(duration)}</Text>
      </View>

      {/* Jump to marker chips */}
      {anyMarked && (
        <View style={s.jumpRow}>
          <Text style={s.jumpLabel}>Jump to:</Text>
          {(["dropStart", "firstContact", "atRest"] as const).map((key) => {
            const t = marks[key];
            if (t === null) return null;
            return (
              <TouchableOpacity
                key={key}
                style={[s.jumpChip, { borderColor: STEP_INFO[key].color }]}
                onPress={() => { haptic("light"); seek(t); setIsPlaying(false); }}
              >
                <Text style={[s.jumpChipText, { color: STEP_INFO[key].color }]}>
                  {STEP_INFO[key].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Mark button */}
      {showMarkBtn && (
        <TouchableOpacity
          style={[s.markBtn, { backgroundColor: hasVideo ? currentInfo.color : "#334155" }]}
          onPress={handleMark}
          disabled={!hasVideo}
        >
          <Text style={[s.markBtnText, !hasVideo && { color: "#64748B" }]}>
            {hasVideo ? `Mark ${currentInfo.label}` : "Upload a video to begin"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Bounce question */}
      {showBounceQ && (
        <View style={s.bounceCard}>
          <Text style={s.bounceTitle}>Did the parachute bounce after landing?</Text>
          <Text style={s.bounceSub}>
            Did the toy lift off the ground at all after hitting it?
          </Text>
          <View style={s.bounceButtons}>
            <TouchableOpacity style={s.bounceYes} onPress={handleBounceYes}>
              <Text style={s.bounceYesText}>Yes — mark the peak</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.bounceNo} onPress={handleBounceNo}>
              <Text style={s.bounceNoText}>No bounce</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Results preview + confidence + save */}
      {readyToSave && (
        <View style={s.resultsCard}>
          <Text style={s.resultsTitle}>Results</Text>

          <View style={s.resultsGrid}>
            {previewFall !== null && (
              <View style={s.resultItem}>
                <Text style={s.resultValue}>{previewFall.toFixed(3)} s</Text>
                <Text style={s.resultLabel}>Fall Time</Text>
              </View>
            )}
            {previewContact !== null && (
              <View style={s.resultItem}>
                <Text style={s.resultValue}>{previewContact.toFixed(3)} s</Text>
                <Text style={s.resultLabel}>Contact Time</Text>
              </View>
            )}
            <View style={s.resultItem}>
              <Text style={[s.resultValue, { color: marks.bouncePeak !== null ? "#F97316" : "#10B981" }]}>
                {marks.bouncePeak !== null ? "Yes" : "No"}
              </Text>
              <Text style={s.resultLabel}>Bounced</Text>
            </View>
            {previewBounce !== null && (
              <View style={s.resultItem}>
                <Text style={s.resultValue}>{previewBounce.toFixed(3)} s</Text>
                <Text style={s.resultLabel}>To Bounce Peak</Text>
              </View>
            )}
          </View>

          <Text style={s.confidenceLabel}>How confident are you in your markings?</Text>
          <View style={s.confidenceRow}>
            {CONFIDENCE_OPTIONS.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[s.confidenceChip, confidence === value && s.confidenceChipOn]}
                onPress={() => { haptic("light"); setConfidence(value); }}
              >
                <Text style={[s.confidenceText, confidence === value && s.confidenceTextOn]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
            <Text style={s.saveBtnText}>Save Results</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reset */}
      {anyMarked && (
        <TouchableOpacity style={s.resetRow} onPress={resetAll}>
          <Text style={s.resetText}>Start over</Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function createStyles(c: ColorTokens) {
  return StyleSheet.create({

    card: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      gap: 14,
    },

    // Header
    header:      { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    headerTitle: { fontSize: 15, fontWeight: "700", color: c.text },
    headerSub:   { fontSize: 11, color: c.textMuted, marginTop: 2 },
    pill: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
    },
    pillText: { fontSize: 11, fontWeight: "600", color: "#6366F1" },

    // Step progress
    stepRow:           { flexDirection: "row", alignItems: "flex-start" },
    stepOuter:         { flex: 1, flexDirection: "row", alignItems: "flex-start", justifyContent: "center" },
    stepConnectorWrap: { flex: 1, paddingTop: 13 },
    stepLine:          { height: 2, backgroundColor: c.border },
    stepLineDone:      { backgroundColor: "#10B981" },
    stepContent:       { alignItems: "center" },
    stepDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNum:       { fontSize: 11, fontWeight: "700", color: c.textMuted },
    stepLabel:     { fontSize: 10, fontWeight: "600", color: c.textMuted, marginTop: 3, textAlign: "center" },
    stepLabelDone: { color: "#10B981" },
    stepTime:      { fontSize: 9, color: c.textSecondary, marginTop: 1, textAlign: "center" },

    // Hint box
    hintBox: {
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 12,
      borderLeftWidth: 3,
    },
    hintText: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

    // Video
    video: { width: "100%", height: 220, borderRadius: 12, backgroundColor: "#0F172A" },
    videoEmpty: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: "dashed",
      backgroundColor: c.surface,
    },
    videoEmptyText: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: "center",
      paddingHorizontal: 20,
      lineHeight: 20,
    },

    // Transport bar
    transport: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#1E293B",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    transportDisabled: { opacity: 0.4 },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#334155",
      alignItems: "center",
      justifyContent: "center",
    },
    iconBtnOff:       { backgroundColor: "#1E293B" },
    playBtn:          { backgroundColor: "#6366F1" },
    transportDivider: { width: 1, height: 20, backgroundColor: "#334155", marginHorizontal: 2 },
    rateChip: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: "#334155",
    },
    rateChipOn:      { backgroundColor: "#6366F1" },
    rateChipOff:     { opacity: 0.4 },
    rateChipText:    { fontSize: 11, fontWeight: "600", color: "#64748B" },
    rateChipTextOn:  { color: "#FFF" },

    // Timeline markers above scrub bar
    timelineWrap: {
      position: "relative",
      height: 10,
      marginHorizontal: 50, // aligns roughly with slider track (time labels ~44px wide + gap)
    },
    timelineDot: {
      position: "absolute",
      width: 8,
      height: 8,
      borderRadius: 4,
      top: 1,
      marginLeft: -4,
    },

    // Scrub row
    scrubRow:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: -8 },
    scrubTime: { fontSize: 11, color: c.textSecondary, minWidth: 44 },
    slider:    { flex: 1, height: 34 },

    // Jump chips
    jumpRow:      { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
    jumpLabel:    { fontSize: 11, color: c.textMuted },
    jumpChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      backgroundColor: c.surface,
    },
    jumpChipText: { fontSize: 11, fontWeight: "600" },

    // Mark button
    markBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      paddingVertical: 14,
      borderRadius: 12,
    },
    markBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

    // Bounce question
    bounceCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FED7AA",
      padding: 14,
      gap: 8,
    },
    bounceTitle:   { fontSize: 14, fontWeight: "700", color: c.text },
    bounceSub:     { fontSize: 12, color: c.textSecondary, lineHeight: 18 },
    bounceButtons: { flexDirection: "row", gap: 8, marginTop: 2 },
    bounceYes: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 11,
      borderRadius: 10,
      backgroundColor: "#F97316",
    },
    bounceYesText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
    bounceNo: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 11,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#10B981",
      backgroundColor: c.surface,
    },
    bounceNoText: { color: "#10B981", fontWeight: "700", fontSize: 13 },

    // Results card
    resultsCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      gap: 12,
    },
    resultsTitle: { fontSize: 14, fontWeight: "700", color: c.text },
    resultsGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    resultItem: {
      flex: 1,
      minWidth: "40%",
      backgroundColor: c.backgroundSecondary,
      borderRadius: 8,
      padding: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    resultValue: { fontSize: 17, fontWeight: "700", color: c.text },
    resultLabel: { fontSize: 11, color: c.textSecondary, marginTop: 2 },

    // Confidence
    confidenceLabel:  { fontSize: 12, color: c.textSecondary },
    confidenceRow:    { flexDirection: "row", gap: 6 },
    confidenceChip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.backgroundSecondary,
    },
    confidenceChipOn:  { borderColor: "#6366F1" },
    confidenceText:    { fontSize: 11, fontWeight: "600", color: c.textMuted },
    confidenceTextOn:  { color: "#6366F1" },

    // Save
    saveBtn: {
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: "#10B981",
    },
    saveBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },

    // Reset
    resetRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
    resetText: { fontSize: 12, color: c.textMuted },

  });
}
