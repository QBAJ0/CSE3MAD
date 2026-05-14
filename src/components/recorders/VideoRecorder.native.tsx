import { ResizeMode, Video } from "expo-av";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(existingUri || null);
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);
  const { haptic } = useHaptic();

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
    setCameraOpen(true);
  };

  const handleCloseCamera = () => {
    setCameraOpen(false);
    setRecording(false);
  };

  const toggleCameraFacing = () => {
    haptic("light");
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    haptic("medium");
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
      Alert.alert("Error", "Failed to record video. Please try again.");
      haptic("error");
    } finally {
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && recording) {
      haptic("light");
      await cameraRef.current.stopRecording();
      setRecording(false);
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
    setCameraOpen(true);
    haptic("light");
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to record videos.
        </Text>

        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
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
            <Text style={styles.retakeButtonText}>🔄 Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={pickVideoFromGallery}
          >
            <Text style={styles.secondaryActionButtonText}>📁 Replace</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={deleteVideo}>
            <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
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

              <TouchableOpacity
                onPress={toggleCameraFacing}
                style={styles.flipButton}
              >
                <Text style={styles.flipButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cameraFooter}>
              {!recording ? (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={startRecording}
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
                {recording ? "Tap to stop recording" : "Tap to start recording"}
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
    backgroundColor: "#12343B",
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
    borderColor: "#2F80ED",
    borderStyle: "dashed",
  },
  captureButtonText: {
    color: "#2F80ED",
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
    backgroundColor: "#E0F2FE",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#0369A1",
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
    backgroundColor: "#3B82F6",
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
    backgroundColor: "#0EA5E9",
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
    backgroundColor: "#EF4444",
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
    backgroundColor: "#2F80ED",
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
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipButtonText: {
    color: "#FFF",
    fontSize: 24,
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
