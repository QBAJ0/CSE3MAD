// components/SoundMap.tsx
import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";

const { width, height } = Dimensions.get("window");

interface SoundReading {
  id: string;
  action: string;
  db: number;
  location: { latitude: number; longitude: number };
  timestamp: string;
  teamName: string;
}

interface SoundMapProps {
  readings: SoundReading[];
  onSelect?: (reading: SoundReading) => void;
}

export function SoundMap({ readings, onSelect }: SoundMapProps) {
  const getRiskColor = (db: number) => {
    if (db < 40) return "#10B981";
    if (db < 60) return "#84CC16";
    if (db < 75) return "#EAB308";
    if (db < 90) return "#F97316";
    return "#EF4444";
  };

  const getRadius = (db: number) => {
    return 20 + (db / 120) * 50;
  };

  const initialRegion =
    readings.length > 0
      ? {
          latitude: readings[0].location.latitude,
          longitude: readings[0].location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : {
          latitude: -33.8688,
          longitude: 151.2093,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
      >
        {readings.map((reading) => (
          <React.Fragment key={reading.id}>
            <Circle
              center={reading.location}
              radius={getRadius(reading.db)}
              strokeColor={getRiskColor(reading.db)}
              strokeWidth={2}
              fillColor={`${getRiskColor(reading.db)}40`}
            />
            <Marker
              coordinate={reading.location}
              title={reading.action}
              description={`${reading.db} dB`}
              onPress={() => onSelect?.(reading)}
            >
              <View
                style={[
                  styles.marker,
                  { backgroundColor: getRiskColor(reading.db) },
                ]}
              >
                <Text style={styles.markerText}>{reading.db}</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}
      </MapView>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Sound Level</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
          <Text>Quiet (&lt;40dB)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#EAB308" }]} />
          <Text>Moderate (60-75dB)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
          <Text>Loud (&gt;90dB)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, height: 300 },
  map: { width: "100%", height: "100%" },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  markerText: { color: "#FFF", fontWeight: "800" },
  legend: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 10,
  },
  legendTitle: { color: "#FFF", fontWeight: "700", marginBottom: 5 },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
});
