// components/recorders/PhotoRecorder.tsx
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

interface PhotoRecorderProps {
  onCapture: (uri: string) => void;
  existingUri?: string;
  label?: string;
}

export function PhotoRecorder({
  onCapture,
  existingUri,
  label = "Take Photo",
}: PhotoRecorderProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(existingUri || null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);
  const { haptic } = useHaptic();

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    haptic("medium");
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        onCapture(photo.uri);
        haptic("success");
        setCameraOpen(false);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickFromGallery = async () => {
    haptic("light");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      onCapture(result.assets[0].uri);
      haptic("success");
    }
  };

  const deletePhoto = () => {
    haptic("warning");
    Alert.alert("Delete Photo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setPhotoUri(null);
          onCapture("");
        },
      },
    ]);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>📷 Camera permission required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => setPhotoUri(null)}
          >
            <Text style={styles.retakeButtonText}>📷 Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={deletePhoto}>
            <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => setCameraOpen(true)}
        >
          <Text style={styles.cameraButtonText}>📷 {label}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={pickFromGallery}
        >
          <Text style={styles.galleryButtonText}>🖼️ Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={cameraOpen}
        animationType="slide"
        onRequestClose={() => setCameraOpen(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCameraOpen(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
            >
              <Text style={styles.flipButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  permissionText: { color: "#F8FAFC", textAlign: "center", marginBottom: 12 },
  permissionButton: {
    backgroundColor: "#22C55E",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  permissionButtonText: { color: "#0F172A", fontWeight: "700" },
  buttonRow: { flexDirection: "row", gap: 12 },
  cameraButton: {
    flex: 1,
    backgroundColor: "#22C55E",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cameraButtonText: { color: "#FFF", fontWeight: "700" },
  galleryButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  galleryButtonText: { color: "#FFF", fontWeight: "700" },
  preview: { width: "100%", height: 200, borderRadius: 12, marginBottom: 12 },
  retakeButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  retakeButtonText: { color: "#FFF", fontWeight: "600" },
  deleteButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: { color: "#FFF", fontWeight: "600" },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: { color: "#FFF", fontSize: 24 },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipButtonText: { color: "#FFF", fontSize: 24 },
});
