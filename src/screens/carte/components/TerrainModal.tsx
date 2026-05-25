// src/screens/carte/components/TerrainModal.tsx
// Bottom-sheet modal shown when the user taps a terrain marker.
// Displays terrain info + matches at that terrain via getMatchsByTerrain.

import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, ChevronRight, MapPin } from 'lucide-react-native';
import { Terrain } from '../../../models/Terrain';
import { Match } from '../../../models/Match';
import { RootStackParamList } from '../../../types';
import { getMatchsByTerrain } from '../../../services/matchsService';
import { sportColors, type ColorPalette } from '../../../theme';
import { useColors } from '../../../hooks/useColors';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  terrain: Terrain;
  onClose: () => void;
};

export default function TerrainModal({ terrain, onClose }: Props) {
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMatchsByTerrain(terrain.id)
      .then(setMatchs)
      .finally(() => setLoading(false));
  }, [terrain.id]);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.pinIcon}>
                <MapPin size={14} color={colors.textMuted} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nom}>{terrain.nom}</Text>
                <Text style={styles.adresse}>{terrain.adresse}, {terrain.ville}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Sport badges — derived from actual matches at this terrain */}
          <View style={styles.sportsRow}>
            {[...new Set(matchs.map(m => m.sport))].map(s => (
              <View
                key={s}
                style={[styles.sportBadge, { borderColor: sportColors[s] ?? colors.borderSubtle }]}
              >
                <View style={[styles.sportDot, { backgroundColor: sportColors[s] ?? colors.textMuted }]} />
                <Text style={[styles.sportLabel, { color: sportColors[s] ?? colors.textMuted }]}>
                  {s.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Match list */}
          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.textMuted} />
          ) : matchs.length === 0 ? (
            <Text style={styles.empty}>Aucun match à venir sur ce terrain</Text>
          ) : (
            <FlatList
              data={matchs}
              keyExtractor={m => m.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.matchRow,
                    index < matchs.length - 1 && styles.matchRowBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    navigation.navigate('MatchDetail', { matchId: item.id });
                  }}
                >
                  <View style={[styles.sportStripe, { backgroundColor: sportColors[item.sport] ?? colors.textMuted }]} />
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchTeams}>
                      {item.equipeA_nom} <Text style={styles.matchVs}>vs</Text> {item.equipeB_nom}
                    </Text>
                    <Text style={styles.matchMeta}>
                      {item.dateHeure.toLocaleString('fr-FR', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {'  ·  '}
                      {item.division}
                    </Text>
                  </View>
                  <ChevronRight size={14} color={colors.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.bgScrim,
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderBottomWidth: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSubtle,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nom: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  adresse: { fontSize: 12, color: colors.textTertiary },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.bgInput,
  },
  sportDot: { width: 6, height: 6, borderRadius: 3 },
  sportLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  divider: { height: 1, backgroundColor: colors.borderFaint, marginHorizontal: 20, marginBottom: 4 },
  loader: { paddingVertical: 32 },
  empty: {
    textAlign: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    color: colors.textMuted,
    fontSize: 13,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  matchRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderFaint },
  sportStripe: { width: 3, height: 36, borderRadius: 2 },
  matchInfo: { flex: 1 },
  matchTeams: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  matchVs: { fontWeight: '400', color: colors.textMuted },
  matchMeta: { fontSize: 11, color: colors.textTertiary },
  });
}
