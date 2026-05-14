import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface GPSMapViewProps {
  lat: number;
  lng: number;
}

export function GPSMapView({ lat, lng }: GPSMapViewProps) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{ latitude: lat, longitude: lng }}
        title="Experiment Location"
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
