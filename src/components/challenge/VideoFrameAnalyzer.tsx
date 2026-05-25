import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { ResizeMode, Video } from "expo-av";
import { useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

interface FrameMarkers {
  firstContact: number | null;
  atRest: number | null;
  bouncePeak: number | null;
}

interface VideoFrameAnalyzerProps {
  videoUri: string;
  slowMoFactor?: number;
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

  const getRealTime = (videoTime: number): number => videoTime / slowMoFactor;

  const calculateResults = () => {
    if (marks.firstContact === null || marks.atRest === null) {
      Alert.alert("Error", "Please mark both first contact and at rest");
      return;
    }

    const contactTimeVideo = marks.atRest - marks.firstContact;
    const contactTimeReal = getRealTime(contactTimeVideo);
    const bounced = marks.bouncePeak !== null;
    const timeToBouncePeak = bounced
      ? getRealTime(marks.bouncePeak! - marks.firstContact)
      : undefined;

    onComplete({
      contactTime: contactTimeReal,
      bounced,
      timeToBouncePeak,
    });
  };

  const handleMarkCurrentFrame = () => {
    haptic("medium");
    setMarks((prev) => ({
      ...prev,
      [activeMark]: currentTime,
    }));

    if (activeMark === "firstContact") {
      setActiveMark("atRest");
      Alert.alert("First Contact Marked", "Now mark when the toy stops moving");
    } else if (activeMark === "atRest") {
      setActiveMark("bouncePeak");
      Alert.alert(
        "At Rest Marked",
        "If it bounced, mark the highest bounce point. Otherwise tap Skip.",
      );
    }
  };

  const resetMarks = () => {
    haptic("warning");
    setMarks({ firstContact: null, atRest: null, bouncePeak: null });
    setActiveMark("firstContact");
  };

  const getMarkStatus = () => {
    if (marks.firstContact !== null && marks.atRest !== null && marks.bouncePeak !== null)
      return "complete";
    if (marks.firstContact !== null && marks.atRest !== null) return "partial";
    if (marks.firstContact !== null) return "started";
    return "waiting";
  };

  const markStatus = getMarkStatus();

  const renderMarkValue = (value: number | null, fallback: string) =>
    value === null ? fallback : `${getRealTime(value).toFixed(3)}s`;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name="film-outline" size={18} color="#F8FAFC" />
        <Text style={styles.title}>Frame-by-Frame Analysis</Text>
      </View>
      <Text style={styles.subtitle}>
        {markStatus === "waiting" &&
          "Step 1: Mark when toy first hits the ground"}
        {markStatus === "started" && "Step 2: Mark when toy stops moving"}
        {markStatus === "partial" &&
          "Step 3: If it bounced, mark the highest bounce point"}
        {markStatus === "complete" && "All marks complete. Tap Continue"}
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
            if (status.durationMillis) setDuration(status.durationMillis / 1000);
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
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#FFF" />
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
            minimumTrackTintColor="#2563EB"
            maximumTrackTintColor="#334155"
          />
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        </View>

        <TouchableOpacity
          style={styles.stepButton}
          onPress={() => {
            haptic("light");
            const frameTime = 1 / 30;
            const newTime = currentTime + frameTime;
            if (videoRef.current && newTime <= duration) {
              videoRef.current.setPositionAsync(newTime * 1000);
              setCurrentTime(newTime);
            }
          }}
        >
          <Ionicons name="play-forward" size={14} color="#FFF" />
          <Text style={styles.stepButtonText}>Frame</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.marksContainer}>
        <View
          style={[
            styles.markBadge,
            marks.firstContact !== null && styles.markBadgeComplete,
          ]}
        >
          <Ionicons name="locate-outline" size={14} color="#FFF" />
          <Text style={styles.markBadgeText}>
            First Contact {renderMarkValue(marks.firstContact, "Waiting")}
          </Text>
        </View>
        <View
          style={[styles.markBadge, marks.atRest !== null && styles.markBadgeComplete]}
        >
          <Ionicons name="hand-left-outline" size={14} color="#FFF" />
          <Text style={styles.markBadgeText}>
            At Rest {renderMarkValue(marks.atRest, "Waiting")}
          </Text>
        </View>
        <View
          style={[
            styles.markBadge,
            marks.bouncePeak !== null && styles.markBadgeComplete,
          ]}
        >
          <Ionicons name="trending-up-outline" size={14} color="#FFF" />
          <Text style={styles.markBadgeText}>
            Bounce Peak{" "}
            {marks.bouncePeak !== null
              ? renderMarkValue(marks.bouncePeak, "")
              : marks.atRest !== null
                ? "Optional"
                : "Waiting"}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {markStatus !== "complete" && (
          <TouchableOpacity
            style={styles.markButton}
            onPress={handleMarkCurrentFrame}
          >
            <Ionicons name="pin-outline" size={16} color="#FFF" />
            <Text style={styles.markButtonText}>
              Mark{" "}
              {activeMark === "firstContact"
                ? "First Contact"
                : activeMark === "atRest"
                  ? "At Rest"
                  : "Bounce Peak"}
            </Text>
          </TouchableOpacity>
        )}

        {activeMark === "bouncePeak" && marks.bouncePeak === null && (
          <TouchableOpacity style={styles.skipButton} onPress={calculateResults}>
            <Ionicons name="play-skip-forward-outline" size={16} color="#FFF" />
            <Text style={styles.skipButtonText}>No Bounce</Text>
          </TouchableOpacity>
        )}

        {markStatus !== "waiting" && (
          <TouchableOpacity style={styles.resetButton} onPress={resetMarks}>
            <Ionicons name="refresh" size={16} color="#FFF" />
            <Text style={styles.resetButtonText}>Reset Marks</Text>
          </TouchableOpacity>
        )}
      </View>

      {markStatus === "complete" && (
        <TouchableOpacity
          style={styles.completeButton}
          onPress={calculateResults}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
          <Text style={styles.completeButtonText}>Continue with Results</Text>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    textAlign: "center",
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
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderContainer: { flex: 1 },
  slider: { width: "100%", height: 40 },
  timeText: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  stepButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#2563EB",
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
    gap: 4,
  },
  markBadgeComplete: { backgroundColor: "#2563EB" },
  markBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "600" },
  actionButtons: { flexDirection: "row", gap: 12 },
  markButton: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  markButtonText: { color: "#FFF", fontWeight: "700" },
  skipButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F97316",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  skipButtonText: { color: "#FFF", fontWeight: "700" },
  resetButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#475569",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  resetButtonText: { color: "#FFF", fontWeight: "700" },
  completeButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  completeButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
