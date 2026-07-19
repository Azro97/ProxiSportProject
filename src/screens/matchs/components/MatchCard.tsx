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
          <Text style={styles.teams} numberOfLines={1} ellipsizeMode="tail">
            {match.equipeA_nom}
          </Text>
          {hasScore
            ? <Text style={[styles.scoreNum, { color: accent }]}>{match.scoreA}</Text>
            : <Text style={styles.vs}>vs</Text>}
          {hasScore
            ? <Text style={[styles.scoreNum, { color: colors.textMuted }]}>{match.scoreB}</Text>
            : null}
          <Text style={[styles.teams, styles.teamB]} numberOfLines={1} ellipsizeMode="tail">
            {match.equipeB_nom}
          </Text>
        </View>
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
  body: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  time: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  finBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  finText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teams: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  teamB: {
    color: colors.textSecondary,
    textAlign: 'right',
  },
  scoreNum: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  vs: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 2,
  },
  lieu: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
  },
  });
}
