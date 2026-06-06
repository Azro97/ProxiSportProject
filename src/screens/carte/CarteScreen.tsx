// src/screens/carte/CarteScreen.tsx
// Full-screen map using MapLibre GL + OpenFreeMap tiles.
// No Google Maps API key required.
// Supports dark/light mode via styleURL swap.
// Shows terrain markers; tapping one opens TerrainModal.
// Floating sport filter chips are local state — independent of filtresStore.

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LocateFixed } from 'lucide-react-native';
import { useLocationStore } from '../../stores/locationStore';
import { getTerrainsByLocation } from '../../services/terrainsService';
import { getTerrainIdsForSport } from '../../services/matchsService';
import { Terrain } from '../../models/Terrain';
import { sportColors, type ColorPalette } from '../../theme';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';
import TerrainModal from './components/TerrainModal';
import SportFloatingFilter from './components/SportFloatingFilter';

// No access token needed — OpenFreeMap is fully public
MapLibreGL.setAccessToken(null);

const RADIUS_KM = 50;
const DEFAULT_ZOOM = 10;

// OpenFreeMap: free, no API key, proper dark + light styles
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/bright';
const STYLE_DARK  = 'https://tiles.openfreemap.org/styles/dark';

export default function CarteScreen() {
  const colors = useColors();
  const isDark = useThemeStore(s => s.isDark);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { lat, lng, status } = useLocationStore();
  const [terrains, setTerrains] = useState<Terrain[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<Terrain | null>(null);
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [sportTerrainIds, setSportTerrainIds] = useState<Set<string> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef = useRef<any>(null);

  const centerLat = lat ?? 48.8566;
  const centerLng = lng ?? 2.3522;

  useEffect(() => {
    getTerrainsByLocation(centerLat, centerLng, RADIUS_KM).then(setTerrains);
  }, [centerLat, centerLng]);

  // When sport filter changes, fetch the set of terrain IDs that actually have
  // matches for that sport — so we only show relevant pins on the map.
  useEffect(() => {
    if (!sportFilter) {
      setSportTerrainIds(null);
      return;
    }
    getTerrainIdsForSport(sportFilter).then(ids => {
      setSportTerrainIds(ids);
      // Close modal if the currently selected terrain has no match for the new sport
      setSelectedTerrain(prev => (prev && !ids.has(prev.id) ? null : prev));
    });
  }, [sportFilter]);

  const visibleTerrains = sportFilter && sportTerrainIds
    ? terrains.filter(t => sportTerrainIds.has(t.id))
    : terrains;

  const handleRecenter = () => {
    // MapLibre uses [longitude, latitude] GeoJSON order
    cameraRef.current?.setCamera({
      centerCoordinate: [centerLng, centerLat],
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 400,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <MapLibreGL.MapView
        style={StyleSheet.absoluteFillObject}
        mapStyle={isDark ? STYLE_DARK : STYLE_LIGHT}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={[centerLng, centerLat]}
        />

        {status === 'granted' && (
          <MapLibreGL.UserLocation visible androidRenderMode="normal" />
        )}

        {visibleTerrains.map(terrain => {
          const pinColor = sportFilter
            ? (sportColors[sportFilter] ?? colors.textMuted)
            : colors.textMuted;
          return (
            <MapLibreGL.PointAnnotation
              key={`${terrain.id}-${sportFilter ?? 'all'}`}
              id={terrain.id}
              coordinate={[terrain.lng, terrain.lat]}
              onSelected={() => setSelectedTerrain(terrain)}
            >
              <View style={[styles.pin, { backgroundColor: pinColor }]} />
            </MapLibreGL.PointAnnotation>
          );
        })}
      </MapLibreGL.MapView>

      {/* Floating header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe} pointerEvents="box-none">
        <View style={styles.headerRow} pointerEvents="box-none">
          <View style={styles.headerCard}>
            <Text style={styles.headerEyebrow}>ZONE</Text>
            <Text style={styles.headerCity}>
              {status === 'granted' ? 'Position GPS' : 'Paris (défaut)'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Floating sport filter */}
      <SportFloatingFilter
        selected={sportFilter}
        onSelect={sport => {
          setSelectedTerrain(null); // always close modal when changing sport filter
          setSportFilter(sport);
        }}
      />

      {/* Recenter FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <LocateFixed size={20} color={colors.textSecondary} strokeWidth={1.8} />
      </TouchableOpacity>

      {selectedTerrain && (
        <TerrainModal
          terrain={selectedTerrain}
          onClose={() => setSelectedTerrain(null)}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgApp },
    pin: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#fff',
    },
    headerSafe: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    headerRow: {
      paddingHorizontal: 16,
      paddingTop: 8,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    headerCard: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },
    headerEyebrow: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginBottom: 1,
    },
    headerCity: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 100,
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },
  });
}
