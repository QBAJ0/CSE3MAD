import MapView, { Marker } from "react-native-maps";
import { StyleSheet } from "react-native";

export type ResultLocationMapProps = {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  /** When false, map is a static preview (e.g. results summary card). */
  interactive?: boolean;
  regionDelta?: number;
};

export function ResultLocationMap({
  lat,
  lng,
  title = "Experiment Location",
  description,
  interactive = true,
  regionDelta = 0.01,
}: ResultLocationMapProps) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: lat,
        longitude: lng,
        latitudeDelta: regionDelta,
        longitudeDelta: regionDelta,
      }}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      pitchEnabled={interactive}
      rotateEnabled={interactive}
    >
      <Marker
        coordinate={{ latitude: lat, longitude: lng }}
        title={title}
        description={description}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
});
