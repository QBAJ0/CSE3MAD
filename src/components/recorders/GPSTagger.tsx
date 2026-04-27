import * as Location from "expo-location";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";

interface Props {
  onLocationCapture: (lat: number, lng: number) => void;
}

export function GPSTagger({ onLocationCapture }: Props) {
  const [capturing, setCapturing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const { haptic } = useHaptic();

  const captureLocation = async () => {
    haptic("medium");
    setCapturing(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for GPS tagging.",
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
      Alert.alert(
        "📍 Location Tagged",
        `Lat: ${newLocation.lat.toFixed(4)}, Lng: ${newLocation.lng.toFixed(4)}`,
      );
    } catch (error) {
      Alert.alert("Error", "Could not get location.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={captureLocation}
      disabled={capturing}
    >
      <Text style={styles.buttonText}>
        {capturing
          ? "📍 Getting location..."
          : location
            ? "📍 Location captured"
            : "📍 Tag GPS Location"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  buttonText: { color: "#F8FAFC", fontSize: 15, fontWeight: "600" },
});
