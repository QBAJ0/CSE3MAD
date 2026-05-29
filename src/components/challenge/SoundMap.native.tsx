import React, { Component, ErrorInfo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import { SOUND_DB_TIERS } from "../../config/constants";
import { SoundMapPoint } from "../../types";

interface SoundMapProps {
  points: SoundMapPoint[];
}

export type { SoundMapPoint };

class MapErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn("SoundMap MapView error caught:", error?.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function dbColor(db: number): string {
  return SOUND_DB_TIERS.find((t) => db < t.max)?.color ?? "#EF4444";
}

function dbRadius(db: number): number {
  return 10 + (db / 120) * 60;
}

export function SoundMap({ points }: SoundMapProps) {
  if (points.length === 0) return null;

  const fallback = (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>
        {points.length} sound reading{points.length !== 1 ? "s" : ""} recorded.
      </Text>
      <Text style={styles.fallbackSub}>Map unavailable on this device.</Text>
    </View>
  );

  return (
    <MapErrorBoundary fallback={fallback}>
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
    </MapErrorBoundary>
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
  fallback: {
    height: 200,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  fallbackText: { color: "#94A3B8", fontSize: 15, fontWeight: "600" },
  fallbackSub: { color: "#64748B", fontSize: 12 },
});
