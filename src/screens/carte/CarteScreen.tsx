// src/screens/carte/CarteScreen.tsx
// Full-screen Google Maps centered on user GPS position (from locationStore).
// Shows terrain markers; tapping one opens TerrainModal.
// Floating sport filter chips are local state — independent of filtresStore.

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocationStore } from '../../stores/locationStore';
import { getTerrainsByLocation } from '../../services/terrainsService';
import { Terrain } from '../../models/Terrain';
import { theme } from '../../theme';
import TerrainModal from './components/TerrainModal';
import SportFloatingFilter from './components/SportFloatingFilter';

const RADIUS_KM = 50;
const DEFAULT_DELTA = 0.5;

export default function CarteScreen() {
  const { lat, lng, status } = useLocationStore();
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<Terrain | null>(null);
  const [sportFilter, setSportFilter] = useState<string | null>(null);

  // Use GPS coords if granted, otherwise fall back to the store's default (Paris)
  const centerLat = lat ?? 48.8566;
  const centerLng = lng ?? 2.3522;

  useEffect(() => {
    getTerrainsByLocation(centerLat, centerLng, RADIUS_KM).then(setTerrains);
  }, [centerLat, centerLng]);

  const visibleTerrains = sportFilter
    ? terrains.filter(t => t.sports.includes(sportFilter))
    : terrains;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        }}
        showsUserLocation={status === 'granted'}
      >
        {visibleTerrains.map(terrain => (
          <Marker
            key={terrain.id}
            coordinate={{ latitude: terrain.lat, longitude: terrain.lng }}
            title={terrain.nom}
            pinColor={theme.sportColors[terrain.sports[0]] ?? '#888'}
            onPress={() => setSelectedTerrain(terrain)}
          />
        ))}
      </MapView>

      <SportFloatingFilter selected={sportFilter} onSelect={setSportFilter} />

      {selectedTerrain && (
        <TerrainModal
          terrain={selectedTerrain}
          onClose={() => setSelectedTerrain(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
