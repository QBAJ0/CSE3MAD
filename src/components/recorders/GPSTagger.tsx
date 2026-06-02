import * as Location from "expo-location";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useHaptic } from "../../hooks/useHaptic";
import type { ColorTokens } from "../../theme/colors";
import { useTheme } from "../../theme/themeContext";

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    <TouchableOpacity
      style={[styles.button, isCaptured && styles.buttonCaptured]}
      onPress={captureLocation}
      disabled={capturing}
    >
      <Text style={[styles.buttonText, isCaptured && styles.buttonTextCaptured]}>
        {capturing
          ? "📍 Getting location..."
          : isCaptured
            ? `✓ Tagged: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
            : "📍 Tag GPS Location"}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(c: ColorTokens) {
  return StyleSheet.create({
    button: {
      backgroundColor: c.surface,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    buttonCaptured: {
      backgroundColor: c.infoLight,
      borderColor: c.info,
    },
    buttonText: { color: c.text, fontSize: 15, fontWeight: "600" },
    buttonTextCaptured: { color: c.primary },
  });
}
