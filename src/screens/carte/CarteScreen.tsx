// src/screens/carte/CarteScreen.tsx
// Full-screen map using MapLibre GL + OpenFreeMap tiles.
// No Google Maps API key required.
// Supports dark/light mode via styleURL swap.
// Shows terrain markers; tapping one opens TerrainModal.
// Floating sport filter chips are local state — independent of filtresStore.

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LocateFixed, MapPin as MapPinIcon, WifiOff } from 'lucide-react-native';
import { useLocationStore } from '../../stores/locationStore';
import { getTerrainsByLocation } from '../../services/terrainsService';
import { getTerrainIdsForSport } from '../../services/matchsService';
import { Terrain } from '../../models/Terrain';
import { sportColors, type ColorPalette } from '../../theme';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';
import TerrainModal from './components/TerrainModal';
import SportFloatingFilter from './components/SportFloatingFilter';

// Only render the map on Android API 28+ — older ARMv7 devices (API 27 = Android 8.1)
// crash with SIGSEGV in MapLibre's tile-loading worker thread.
MapLibreGL.setAccessToken(null);
const API_LEVEL = Platform.OS === 'android' ? parseInt(Platform.Version as unknown as string, 10) : 999;
const MAP_SUPPORTED = API_LEVEL >= 28;

const PROD_BASE   = 'https://tiles.openfreemap.org';
const STYLE_LIGHT = `${PROD_BASE}/styles/bright`;
const STYLE_DARK  = `${PROD_BASE}/styles/dark`;

const SPORT_EMOJI: Record<string, string> = {
  foot: '⚽', basket: '🏀', hand: '🤾', volley: '🏐',
};

// Beautiful teardrop map pin
const PIN_SIZE = 52;
function MapPin({ color, sport }: { color: string; sport: string | null }) {
  const emoji = sport ? SPORT_EMOJI[sport] : null;
  return (
    <View style={PIN_S.wrapper}>
      <View style={[PIN_S.circle, { backgroundColor: color }]}>
        <View style={PIN_S.ring}>
          {emoji ? <Text style={PIN_S.emoji}>{emoji}</Text> : <View style={PIN_S.dot} />}
        </View>
      </View>
      <View style={[PIN_S.tail, { borderTopColor: color }]} />
      <View style={PIN_S.groundShadow} />
    </View>
  );
}

const PIN_S = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingHorizontal: 6 },
  circle: {
    width: PIN_SIZE, height: PIN_SIZE, borderRadius: PIN_SIZE / 2,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3.5, borderColor: '#ffffff',
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  ring: {
    width: PIN_SIZE - 14, height: PIN_SIZE - 14, borderRadius: (PIN_SIZE - 14) / 2,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 22, lineHeight: 26, textAlign: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.95)' },
  tail: {
    width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 18,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -3,
  },
  groundShadow: { width: 14, height: 5, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.18)', marginTop: 1 },
});

const RADIUS_KM = 50;
const DEFAULT_ZOOM = 10;

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

  useEffect(() => {
    if (!sportFilter) { setSportTerrainIds(null); return; }
    getTerrainIdsForSport(sportFilter).then(ids => {
      setSportTerrainIds(ids);
      setSelectedTerrain(prev => (prev && !ids.has(prev.id) ? null : prev));
    });
  }, [sportFilter]);

  const visibleTerrains = sportFilter && sportTerrainIds
    ? terrains.filter(t => sportTerrainIds.has(t.id))
    : terrains;

  const handleRecenter = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: [centerLng, centerLat],
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 400,
    });
  };

  // ── Fallback list for devices where MapLibre can't run ───────────────────────
  if (!MAP_SUPPORTED) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgApp }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.fallbackHeader}>
            <WifiOff size={16} color={colors.textMuted} strokeWidth={1.8} style={{ marginRight: 6 }} />
            <Text style={[styles.fallbackHeaderText, { color: colors.textMuted }]}>
              Carte non disponible sur cet appareil
            </Text>
          </View>

          {/* Sport filter */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <SportFloatingFilter
              selected={sportFilter}
              onSelect={s => { setSelectedTerrain(null); setSportFilter(s); }}
            />
          </View>

          {/* Terrain list */}
          <FlatList
            data={visibleTerrains}
            keyExtractor={t => t.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item: terrain }) => {
              const sport = (terrain as any).sport as string | undefined;
              const emoji = sport ? (SPORT_EMOJI[sport] ?? '🏟️') : '🏟️';
              return (
                <TouchableOpacity
                  style={[styles.terrainCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
                  onPress={() => setSelectedTerrain(terrain)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.terrainEmoji}>{emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.terrainName, { color: colors.textPrimary }]}>{terrain.nom}</Text>
                    <Text style={[styles.terrainAddress, { color: colors.textSecondary }]}>
                      {terrain.adresse} · {terrain.ville}
                    </Text>
                  </View>
                  <MapPinIcon size={16} color={colors.textMuted} strokeWidth={1.5} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucun terrain trouvé</Text>
            }
          />
        </SafeAreaView>

        {selectedTerrain && (
          <TerrainModal terrain={selectedTerrain} onClose={() => setSelectedTerrain(null)} />
        )}
      </View>
    );
  }

  // ── Full map view (Android API 28+ / iOS) ────────────────────────────────────
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
          const pinColor = sportFilter ? (sportColors[sportFilter] ?? colors.userPosition) : colors.userPosition;
          return (
            <MapLibreGL.MarkerView
              key={`${terrain.id}-${sportFilter ?? 'all'}`}
              coordinate={[terrain.lng, terrain.lat]}
              anchor={{ x: 0.5, y: 1.0 }}
            >
              <TouchableOpacity onPress={() => setSelectedTerrain(terrain)} activeOpacity={0.8}>
                <MapPin color={pinColor} sport={sportFilter} />
              </TouchableOpacity>
            </MapLibreGL.MarkerView>
          );
        })}
      </MapLibreGL.MapView>

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

      <SportFloatingFilter
        selected={sportFilter}
        onSelect={sport => { setSelectedTerrain(null); setSportFilter(sport); }}
      />

      <TouchableOpacity style={styles.fab} onPress={handleRecenter} activeOpacity={0.8}>
        <LocateFixed size={20} color={colors.textSecondary} strokeWidth={1.8} />
      </TouchableOpacity>

      {selectedTerrain && (
        <TerrainModal terrain={selectedTerrain} onClose={() => setSelectedTerrain(null)} />
      )}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgApp },
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
    // Fallback list styles
    fallbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    fallbackHeaderText: {
      fontSize: 13,
      fontStyle: 'italic',
    },
    terrainCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      elevation: 2,
    },
    terrainEmoji: {
      fontSize: 28,
      marginRight: 12,
    },
    terrainName: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
    },
    terrainAddress: {
      fontSize: 12,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 14,
    },
  });
}
