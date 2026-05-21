import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import { GPSMapView } from "../challenge/GPSMapView";

interface Props {
  onLocationCapture: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number };
}

export function GPSTagger({ onLocationCapture, initialLocation }: Props) {
  const [capturing, setCapturing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ?? null,
  );
  const { haptic } = useHaptic();

  useEffect(() => {
    setLocation(initialLocation ?? null);
  }, [initialLocation]);

  const captureLocation = async () => {
    haptic("medium");
    setCapturing(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for GPS tagging. Please enable it in your device settings.",
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      setLocation(newLocation);
      onLocationCapture(newLocation.lat, newLocation.lng);
      haptic("success");
    } catch {
      Alert.alert(
        "GPS Error",
        "Could not get your location. Make sure GPS is enabled and try again.",
        [{ text: "OK" }],
      );
    } finally {
      setCapturing(false);
    }
  };

  const isCaptured = !!location;

  return (
    <View style={styles.container}>
      {location && (
        <View style={styles.preview}>
          <GPSMapView lat={location.lat} lng={location.lng} height={160} />
          <View style={styles.coordsRow}>
            <Text style={styles.coordsLabel}>Challenge location</Text>
            <Text style={styles.coordsText}>
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isCaptured && styles.buttonCaptured]}
        onPress={captureLocation}
        disabled={capturing}
      >
        <Text style={[styles.buttonText, isCaptured && styles.buttonTextCaptured]}>
          {capturing
            ? "Getting location..."
            : isCaptured
              ? "Update GPS Tag"
              : "Tag GPS Location"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  preview: {
    borderWidth: 1,
    borderColor: "#BFD8FF",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  coordsRow: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordsLabel: {
    color: "#007C7A",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  coordsText: {
    color: "#12343B",
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  button: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  buttonCaptured: {
    backgroundColor: "#EEF5FF",
    borderColor: "#2F80ED",
  },
  buttonText: { color: "#12343B", fontSize: 15, fontWeight: "600" },
  buttonTextCaptured: { color: "#007C7A" },
});
