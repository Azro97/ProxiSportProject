// src/screens/matchs/components/MatchCard.tsx
// Single match card used in MatchGroupList.
// Shows equipeA_nom vs equipeB_nom, time, terrain info, division.
// Left accent bar color matches the sport.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Match } from '../../../models/Match';
import { theme } from '../../../theme';

type Props = {
  match: Match;
  terrainNom?: string;
  terrainVille?: string;
  onPress?: () => void;
};

export default function MatchCard({ match, terrainNom, terrainVille, onPress }: Props) {
  const sportColor = theme.sportColors[match.sport] ?? theme.colors.primary;
  const time = match.dateHeure.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const lieu = [terrainNom, terrainVille].filter(Boolean).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.accent, { backgroundColor: sportColor }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.division}>{match.division}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.teams}>
          {match.equipeA_nom} vs {match.equipeB_nom}
        </Text>
        {lieu.length > 0 && <Text style={styles.lieu}>{lieu}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  accent: { width: 4 },
  body: { flex: 1, padding: theme.spacing.md },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  division: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  time: { fontSize: 12, color: theme.colors.textSecondary },
  teams: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  lieu: { fontSize: 12, color: theme.colors.textMuted },
});
