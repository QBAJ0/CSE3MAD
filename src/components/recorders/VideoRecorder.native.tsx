import Ionicons from "@expo/vector-icons/Ionicons";
import { ResizeMode, Video } from "expo-av";
import { CameraType, CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

interface VideoRecorderProps {
  onCapture: (uri: string) => void;
  existingUri?: string;
  maxDuration?: number;
}

export function VideoRecorder({
  onCapture,
  existingUri,
  maxDuration = 60,
}: VideoRecorderProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(existingUri || null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [torchOn, setTorchOn] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  // Ref mirrors `recording` state so stopRecording never closes over a stale value
  const recordingRef = useRef(false);
  const { haptic } = useHaptic();

  // Request both camera and microphone permissions on mount.
  // Without microphone permission, video recording fails silently on some devices.
  useEffect(() => {
    requestPermission();
    requestMicPermission();
  }, []);

  const saveVideo = (uri: string) => {
    setVideoUri(uri);
    onCapture(uri);
  };

  const pickVideoFromGallery = async () => {
    haptic("medium");

    const galleryPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!galleryPermission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow gallery access so you can upload a video.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      saveVideo(result.assets[0].uri);
      haptic("success");
      Alert.alert("Video Uploaded", "Your video has been attached.");
    }
  };

  const handleOpenCamera = () => {
    haptic("medium");
    setTorchOn(false);
    setIsCameraReady(false);
    setCameraOpen(true);
  };

  const handleCloseCamera = () => {
    if (recordingRef.current && cameraRef.current) {
      cameraRef.current.stopRecording();
    }
    recordingRef.current = false;
    setCameraOpen(false);
    setRecording(false);
    setTorchOn(false);
    setIsCameraReady(false);
  };

  const toggleCameraFacing = () => {
    haptic("light");
    setIsCameraReady(false);
    setFacing((current) => {
      const next = current === "back" ? "front" : "back";
      if (next === "front") setTorchOn(false);
      return next;
    });
  };

  const toggleTorch = () => {
    if (facing !== "back") return;
    haptic("light");
    setTorchOn((on) => !on);
  };

  const startRecording = async () => {
    if (!cameraRef.current || recordingRef.current || !isCameraReady) return;

    haptic("medium");
    recordingRef.current = true;
    setRecording(true);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration });

      if (video?.uri) {
        saveVideo(video.uri);
        haptic("success");
        Alert.alert("Video Captured!", "Your video has been saved.");
        setCameraOpen(false);
      }
    } catch {
      if (recordingRef.current) {
        Alert.alert("Error", "Failed to record video. Please try again.");
        haptic("error");
      }
    } finally {
      recordingRef.current = false;
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && recordingRef.current) {
      haptic("light");
      cameraRef.current.stopRecording();
    }
  };

  const deleteVideo = () => {
    haptic("warning");

    Alert.alert("Delete Video", "Are you sure you want to delete this video?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setVideoUri(null);
          onCapture("");
          haptic("light");
        },
      },
    ]);
  };

  const retakeVideo = () => {
    setVideoUri(null);
    setTorchOn(false);
    setIsCameraReady(false);
    setCameraOpen(true);
    haptic("light");
  };

  if (!permission || !micPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted || !micPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera and microphone access are needed to record videos.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            if (!permission.granted) await requestPermission();
            if (!micPermission.granted) await requestMicPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 10 }]}
          onPress={pickVideoFromGallery}
        >
          <Text style={styles.secondaryButtonText}>Upload from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (videoUri && !cameraOpen) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Attached Video</Text>

        <Video
          source={{ uri: videoUri }}
          style={styles.videoPreview}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />

        <View style={styles.videoActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={retakeVideo}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={pickVideoFromGallery}
          >
            <Text style={styles.secondaryActionButtonText}>Replace</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={deleteVideo}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
      {!cameraOpen && !videoUri && (
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleOpenCamera}
          >
            <Text style={styles.captureButtonText}>Record Video</Text>
            <Text style={styles.captureHint}>
              Show your experiment in action!
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={pickVideoFromGallery}
          >
            <Text style={styles.secondaryButtonText}>
              Upload from Gallery
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={cameraOpen}
        animationType="slide"
        onRequestClose={handleCloseCamera}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            mode="video"
            autofocus="on"
            enableTorch={torchOn && facing === "back"}
            onCameraReady={() => setIsCameraReady(true)}
          />

          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                onPress={handleCloseCamera}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.cameraTitle}>Record Your Experiment</Text>

              <View style={styles.headerActions}>
                {facing === "back" && (
                  <TouchableOpacity
                    onPress={toggleTorch}
                    style={[
                      styles.iconButton,
                      torchOn && styles.torchButtonActive,
                    ]}
                  >
                    <Ionicons
                      name={torchOn ? "flash" : "flash-outline"}
                      size={22}
                      color="#FFF"
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={toggleCameraFacing}
                  style={styles.iconButton}
                >
                  <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.cameraFooter}>
              {!recording ? (
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    !isCameraReady && styles.recordButtonDisabled,
                  ]}
                  onPress={startRecording}
                  disabled={!isCameraReady}
                >
                  <View style={styles.recordButtonInner} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopRecording}
                >
                  <View style={styles.stopButtonInner} />
                </TouchableOpacity>
              )}

              <Text style={styles.recordHint}>
                {!isCameraReady
                  ? "Camera starting…"
                  : recording
                    ? "Tap to stop recording"
                    : "Tap to start recording"}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0",
    marginBottom: 8,
  },
  captureButton: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0F766E",
    borderStyle: "dashed",
  },
  captureButtonText: {
    color: "#0F766E",
    fontSize: 16,
    fontWeight: "700",
  },
  captureHint: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 4,
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: "#F1F5F9",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  videoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  videoActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: "#0F766E",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  retakeButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: "#475569",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryActionButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  loadingText: {
    color: "#64748B",
    textAlign: "center",
  },
  permissionText: {
    color: "#64748B",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: "#0F766E",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 24,
  },
  cameraTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  torchButtonActive: {
    backgroundColor: "rgba(250,204,21,0.85)",
  },
  cameraFooter: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 12,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(239,68,68,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#EF4444",
  },
  recordButtonDisabled: {
    opacity: 0.35,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF4444",
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  stopButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFF",
  },
  recordHint: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
