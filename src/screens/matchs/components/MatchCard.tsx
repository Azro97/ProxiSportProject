// src/screens/matchs/components/MatchCard.tsx
// Single match card used in MatchGroupList.
// Shows equipeA_nom vs equipeB_nom, time, terrain info.
// Dark card with sport-colored left accent bar.

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Match } from '../../../models/Match';
import { sportColors, type ColorPalette } from '../../../theme';
import { useColors } from '../../../hooks/useColors';

type Props = {
  match: Match;
  terrainNom?: string;
  terrainVille?: string;
  onPress?: () => void;
};

export default function MatchCard({ match, terrainNom, terrainVille, onPress }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const accent = sportColors[match.sport] ?? colors.textPrimary;
  const hasScore = match.scoreA !== undefined && match.scoreB !== undefined;
  const time = match.dateHeure.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const date = match.dateHeure.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  const lieu = [terrainNom, terrainVille].filter(Boolean).join(', ');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.time}>{hasScore ? date : time}</Text>
          {hasScore
            ? <View style={[styles.finBadge, { backgroundColor: colors.bgCardElev }]}>
                <Text style={[styles.finText, { color: colors.textMuted }]}>FIN</Text>
              </View>
            : <ChevronRight size={14} color={colors.textMuted} strokeWidth={2} />}
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.teams} numberOfLines={1}>{match.equipeA_nom}</Text>
          {hasScore && <Text style={[styles.scoreNum, { color: accent }]}>{match.scoreA}</Text>}
        </View>
        <View style={styles.scoreRow}>
          <Text style={[styles.teams, styles.teamB]} numberOfLines={1}>{match.equipeB_nom}</Text>
          {hasScore && <Text style={[styles.scoreNum, { color: colors.textMuted }]}>{match.scoreB}</Text>}
        </View>
        {!hasScore && <Text style={styles.vs}>vs</Text>}
        {lieu.length > 0 && (
          <Text style={styles.lieu}>{lieu}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
    overflow: 'hidden',
  },
  accent: { width: 3 },
  body: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  time: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  finBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  finText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teams: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  teamB: {
    color: colors.textSecondary,
  },
  scoreNum: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
    minWidth: 22,
    textAlign: 'right',
  },
  vs: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginVertical: 2,
  },
  lieu: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 6,
  },
  });
}
