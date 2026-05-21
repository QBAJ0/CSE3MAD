import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface GPSMapViewProps {
  lat: number;
  lng: number;
  height?: number;
}

export function GPSMapView({ lat, lng, height = 120 }: GPSMapViewProps) {
  return (
    <View style={[styles.placeholder, { height }]}>
      <Text style={styles.text}>Map preview not available on web</Text>
      <Text style={styles.coords}>
        {lat.toFixed(6)}, {lng.toFixed(6)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  text: {
    fontSize: 13,
    color: "#007C7A",
    fontWeight: "600",
  },
  coords: {
    fontSize: 12,
    color: "#2F80ED",
  },
});
