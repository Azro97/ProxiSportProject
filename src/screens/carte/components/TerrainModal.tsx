// src/screens/carte/components/TerrainModal.tsx
// Bottom-sheet modal shown when the user taps a terrain marker.
// Displays terrain info + matches at that terrain via getMatchsByTerrain.

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Terrain } from '../../../models/Terrain';
import { Match } from '../../../models/Match';
import { RootStackParamList } from '../../../types';
import { getMatchsByTerrain } from '../../../services/matchsService';
import { theme } from '../../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  terrain: Terrain;
  onClose: () => void;
};

export default function TerrainModal({ terrain, onClose }: Props) {
  const navigation = useNavigation<Nav>();
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
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.nom}>{terrain.nom}</Text>
              <Text style={styles.adresse}>{terrain.adresse}, {terrain.ville}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sport badges */}
          <View style={styles.sportsRow}>
            {terrain.sports.map(s => (
              <View
                key={s}
                style={[styles.sportBadge, { backgroundColor: theme.sportColors[s] ?? '#888' }]}
              >
                <Text style={styles.sportLabel}>{s.toUpperCase()}</Text>
              </View>
            ))}
          </View>

          {/* Match list */}
          {loading ? (
            <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
          ) : matchs.length === 0 ? (
            <Text style={styles.empty}>Aucun match à venir sur ce terrain</Text>
          ) : (
            <FlatList
              data={matchs}
              keyExtractor={m => m.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.matchRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    navigation.navigate('MatchDetail', { matchId: item.id });
                  }}
                >
                  <View style={[styles.sportDot, { backgroundColor: theme.sportColors[item.sport] ?? '#888' }]} />
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchTeams}>
                      {item.equipeA_nom} vs {item.equipeB_nom}
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
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: theme.spacing.xl,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  headerText: { flex: 1, paddingRight: theme.spacing.sm },
  nom: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  adresse: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  closeBtn: { padding: 4 },
  closeIcon: { fontSize: 18, color: theme.colors.textSecondary },
  sportsRow: { flexDirection: 'row', marginBottom: theme.spacing.lg },
  sportBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: theme.spacing.sm,
  },
  sportLabel: { color: theme.colors.white, fontSize: 11, fontWeight: '700' },
  loader: { marginVertical: theme.spacing.xl },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginVertical: theme.spacing.xl },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sportDot: { width: 10, height: 10, borderRadius: 5, marginRight: theme.spacing.md },
  matchInfo: { flex: 1 },
  matchTeams: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  matchMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: theme.colors.textMuted, alignSelf: 'center', marginLeft: theme.spacing.sm },
});
