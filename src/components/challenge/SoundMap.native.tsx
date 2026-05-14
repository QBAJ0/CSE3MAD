import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { SOUND_DB_TIERS } from "../../config/constants";
import { SoundMapPoint } from "../../types";

interface SoundMapProps {
  points: SoundMapPoint[];
}

export type { SoundMapPoint };

function dbColor(db: number): string {
  return SOUND_DB_TIERS.find((t) => db < t.max)?.color ?? "#EF4444";
}

function dbRadius(db: number): number {
  return 10 + (db / 120) * 60;
}

export function SoundMap({ points }: SoundMapProps) {
  if (points.length === 0) return null;

  return (
    <View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {points.map((pt) => (
          <React.Fragment key={pt.id}>
            <Circle
              center={{ latitude: pt.latitude, longitude: pt.longitude }}
              radius={dbRadius(pt.db)}
              strokeColor={dbColor(pt.db)}
              strokeWidth={2}
              fillColor={`${dbColor(pt.db)}40`}
            />
            <Marker
              coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
              title={pt.label}
              description={`${pt.db.toFixed(0)} dB`}
            >
              <View style={[styles.pin, { backgroundColor: dbColor(pt.db) }]}>
                <Text style={styles.pinText}>{Math.round(pt.db)}</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}
      </MapView>

      <View style={styles.legend}>
        {SOUND_DB_TIERS.map((t) => (
          <View key={t.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: t.color }]} />
            <Text style={styles.legendText}>{t.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: "100%", height: 200 },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  pinText: { color: "#FFF", fontWeight: "800", fontSize: 11 },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#F8FAFC",
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: "#475569", fontWeight: "500" },
});
