// components/VideoFrameAnalyzer.tsx
import Slider from "@react-native-community/slider";
import { ResizeMode, Video } from "expo-av";
import { useRef, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

interface FrameMarkers {
  firstContact: number | null;
  atRest: number | null;
  bouncePeak: number | null;
}

interface VideoFrameAnalyzerProps {
  videoUri: string;
  slowMoFactor?: number; // e.g., 4 for 120fps played at 30fps
  onComplete: (marks: {
    contactTime: number;
    bounced: boolean;
    timeToBouncePeak?: number;
  }) => void;
}

export function VideoFrameAnalyzer({
  videoUri,
  slowMoFactor = 4,
  onComplete,
}: VideoFrameAnalyzerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [marks, setMarks] = useState<FrameMarkers>({
    firstContact: null,
    atRest: null,
    bouncePeak: null,
  });
  const [activeMark, setActiveMark] = useState<
    "firstContact" | "atRest" | "bouncePeak"
  >("firstContact");
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);
  const { haptic } = useHaptic();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(2).padStart(5, "0")}`;
  };

  const getRealTime = (videoTime: number): number => {
    return videoTime / slowMoFactor;
  };

  const handleMarkCurrentFrame = () => {
    haptic("medium");
    setMarks((prev) => ({
      ...prev,
      [activeMark]: currentTime,
    }));

    // Move to next mark
    if (activeMark === "firstContact") {
      setActiveMark("atRest");
      Alert.alert(
        "✅ First Contact Marked",
        "Now mark when the toy stops moving",
      );
    } else if (activeMark === "atRest") {
      setActiveMark("bouncePeak");
      Alert.alert(
        "✅ At Rest Marked",
        "If it bounced, mark the highest bounce point. Otherwise tap Skip.",
      );
    }
  };

  const skipBounceMark = () => {
    haptic("light");
    calculateResults();
  };

  const calculateResults = () => {
    if (!marks.firstContact || !marks.atRest) {
      Alert.alert("Error", "Please mark both first contact and at rest");
      return;
    }

    const contactTimeVideo = marks.atRest - marks.firstContact;
    const contactTimeReal = getRealTime(contactTimeVideo);

    let bounced = false;
    let timeToBouncePeakReal: number | undefined;

    if (marks.bouncePeak) {
      bounced = true;
      const timeToPeakVideo = marks.bouncePeak - marks.firstContact;
      timeToBouncePeakReal = getRealTime(timeToPeakVideo);
    }

    onComplete({
      contactTime: contactTimeReal,
      bounced,
      timeToBouncePeak: timeToBouncePeakReal,
    });
  };

  const resetMarks = () => {
    haptic("warning");
    setMarks({ firstContact: null, atRest: null, bouncePeak: null });
    setActiveMark("firstContact");
  };

  const getProgress = () => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  const getMarkStatus = () => {
    if (marks.firstContact && marks.atRest && marks.bouncePeak)
      return "complete";
    if (marks.firstContact && marks.atRest) return "partial";
    if (marks.firstContact) return "started";
    return "waiting";
  };

  const markStatus = getMarkStatus();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Frame-by-Frame Analysis</Text>
      <Text style={styles.subtitle}>
        {markStatus === "waiting" &&
          "Step 1: Mark when toy first hits the ground"}
        {markStatus === "started" && "Step 2: Mark when toy stops moving"}
        {markStatus === "partial" &&
          "Step 3: If it bounced, mark the highest bounce point"}
        {markStatus === "complete" && "✅ All marks complete! Tap Continue"}
      </Text>

      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isPlaying}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) {
            setCurrentTime(status.positionMillis / 1000);
            if (status.durationMillis)
              setDuration(status.durationMillis / 1000);
          }
        }}
        useNativeControls
      />

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            haptic("light");
            setIsPlaying(!isPlaying);
          }}
        >
          <Text style={styles.playButtonText}>{isPlaying ? "⏸️" : "▶️"}</Text>
        </TouchableOpacity>

        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            value={currentTime}
            minimumValue={0}
            maximumValue={duration}
            onSlidingComplete={(value: number) => {
              if (videoRef.current) {
                videoRef.current.setPositionAsync(value * 1000);
                setCurrentTime(value);
              }
            }}
            minimumTrackTintColor="#22C55E"
            maximumTrackTintColor="#334155"
          />
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        </View>

        <TouchableOpacity
          style={styles.stepButton}
          onPress={() => {
            haptic("light");
            const frameTime = 1 / 30; // ~33ms per frame at 30fps
            const newTime = currentTime + frameTime;
            if (videoRef.current && newTime <= duration) {
              videoRef.current.setPositionAsync(newTime * 1000);
              setCurrentTime(newTime);
            }
          }}
        >
          <Text style={styles.stepButtonText}>⏩ Frame</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.marksContainer}>
        <View
          style={[
            styles.markBadge,
            marks.firstContact !== null && styles.markBadgeComplete,
          ]}
        >
          <Text style={styles.markBadgeText}>
            🎯 First Contact{" "}
            {marks.firstContact
              ? `✅ ${getRealTime(marks.firstContact).toFixed(3)}s`
              : "⏳"}
          </Text>
        </View>
        <View
          style={[styles.markBadge, marks.atRest !== null && styles.markBadgeComplete]}
        >
          <Text style={styles.markBadgeText}>
            🛑 At Rest{" "}
            {marks.atRest
              ? `✅ ${getRealTime(marks.atRest).toFixed(3)}s`
              : "⏳"}
          </Text>
        </View>
        <View
          style={[
            styles.markBadge,
            marks.bouncePeak !== null && styles.markBadgeComplete,
          ]}
        >
          <Text style={styles.markBadgeText}>
            📈 Bounce Peak{" "}
            {marks.bouncePeak
              ? `✅ ${getRealTime(marks.bouncePeak).toFixed(3)}s`
              : marks.atRest
                ? "⚡ Optional"
                : "⏳"}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {markStatus !== "complete" && (
          <TouchableOpacity
            style={styles.markButton}
            onPress={handleMarkCurrentFrame}
          >
            <Text style={styles.markButtonText}>
              📍 Mark{" "}
              {activeMark === "firstContact"
                ? "First Contact"
                : activeMark === "atRest"
                  ? "At Rest"
                  : "Bounce Peak"}
            </Text>
          </TouchableOpacity>
        )}

        {activeMark === "bouncePeak" && !marks.bouncePeak && (
          <TouchableOpacity style={styles.skipButton} onPress={skipBounceMark}>
            <Text style={styles.skipButtonText}>⏭️ No Bounce (Skip)</Text>
          </TouchableOpacity>
        )}

        {markStatus !== "waiting" && (
          <TouchableOpacity style={styles.resetButton} onPress={resetMarks}>
            <Text style={styles.resetButtonText}>↺ Reset Marks</Text>
          </TouchableOpacity>
        )}
      </View>

      {markStatus === "complete" && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={calculateResults}
        >
          <Text style={styles.completeButtonText}>
            ✅ Continue with Results
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 16,
  },
  video: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#000",
    marginBottom: 16,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonText: { fontSize: 20 },
  sliderContainer: { flex: 1 },
  slider: { width: "100%", height: 40 },
  timeText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  stepButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  stepButtonText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  marksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  markBadge: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#334155",
    alignItems: "center",
  },
  markBadgeComplete: { backgroundColor: "#22C55E" },
  markBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  actionButtons: { flexDirection: "row", gap: 12 },
  markButton: {
    flex: 2,
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  markButtonText: { color: "#FFF", fontWeight: "700" },
  skipButton: {
    flex: 1,
    backgroundColor: "#F97316",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  skipButtonText: { color: "#FFF", fontWeight: "700" },
  resetButton: {
    flex: 1,
    backgroundColor: "#475569",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  resetButtonText: { color: "#FFF", fontWeight: "700" },
  completeButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  completeButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
