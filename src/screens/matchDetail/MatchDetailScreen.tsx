// src/screens/matchDetail/MatchDetailScreen.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Calendar, MapPin, Trophy, Building2 } from 'lucide-react-native';
import { RootStackParamList } from '../../types';
import { Match } from '../../models/Match';
import { Terrain } from '../../models/Terrain';
import { getMatchById } from '../../services/matchsService';
import { getTerrainById } from '../../services/terrainsService';
import { sportColors, sportColorsSoft, radii, type ColorPalette } from '../../theme';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetail'>;

const SPORT_LABELS: Record<string, string> = {
  foot: 'Football',
  basket: 'Basketball',
  hand: 'Handball',
  volley: 'Volleyball',
};

export default function MatchDetailScreen({ route, navigation }: Props) {
  const { matchId } = route.params;
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useThemeStore(s => s.isDark);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [terrain, setTerrain] = useState<Terrain | null>(null);

  useEffect(() => {
    getMatchById(matchId).then(m => {
      setMatch(m);
      if (m) getTerrainById(m.terrain_id).then(setTerrain);
    });
  }, [matchId]);

  if (match === undefined) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator color={colors.textMuted} size="large" />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Text style={styles.errorText}>Match introuvable</Text>
      </View>
    );
  }

  const accent = sportColors[match.sport] ?? colors.textPrimary;
  const accentSoft = sportColorsSoft[match.sport] ?? colors.bgInput;
  const sportLabel = SPORT_LABELS[match.sport] ?? match.sport;

  const dayStr = match.dateHeure.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = match.dateHeure.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          {/* Sport colored top strip */}
          <View style={[styles.heroStrip, { backgroundColor: accent }]} />

          {/* Back + sport label row */}
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <View style={[styles.sportChip, { backgroundColor: accentSoft, borderColor: accent }]}>
              <View style={[styles.sportDot, { backgroundColor: accent }]} />
              <Text style={[styles.sportChipText, { color: accent }]}>{sportLabel.toUpperCase()}</Text>
            </View>
            {/* spacer to center chip */}
            <View style={{ width: 36 }} />
          </View>

          {/* Division pill */}
          <View style={styles.divisionRow}>
            <View style={styles.divisionPill}>
              <Text style={styles.divisionText}>{match.division}</Text>
            </View>
          </View>

          {/* Teams vs block */}
          <View style={styles.teamsBlock}>
            <View style={styles.teamSide}>
              <Text style={styles.teamName} numberOfLines={2}>{match.equipeA_nom}</Text>
              <Text style={styles.teamRole}>Domicile</Text>
            </View>

            <View style={styles.vsContainer}>
              <View style={[styles.vsDivider, { backgroundColor: colors.borderSubtle }]} />
              <View style={[styles.vsCircle, { backgroundColor: accentSoft, borderColor: accent }]}>
                <Text style={[styles.vsText, { color: accent }]}>VS</Text>
              </View>
              <View style={[styles.vsDivider, { backgroundColor: colors.borderSubtle }]} />
            </View>

            <View style={[styles.teamSide, styles.teamRight]}>
              <Text style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={2}>
                {match.equipeB_nom}
              </Text>
              <Text style={[styles.teamRole, { textAlign: 'right' }]}>Extérieur</Text>
            </View>
          </View>
        </View>

        {/* ── Info cards ─────────────────────────────────────────── */}
        <View style={styles.section}>

          {/* Date & time */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIconBox, { backgroundColor: accentSoft }]}>
              <Calendar size={16} color={accent} strokeWidth={2} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Date & heure</Text>
              <Text style={styles.infoValue}>{dayStr}</Text>
              <Text style={[styles.infoTime, { color: accent }]}>{timeStr}</Text>
            </View>
          </View>

          {/* Terrain */}
          {terrain && (
            <View style={styles.infoCard}>
              <View style={[styles.infoIconBox, { backgroundColor: accentSoft }]}>
                <Building2 size={16} color={accent} strokeWidth={2} />
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLabel}>Terrain</Text>
                <Text style={styles.infoValue}>{terrain.nom}</Text>
                <Text style={styles.infoSub}>{terrain.adresse}, {terrain.ville}</Text>
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIconBox, { backgroundColor: accentSoft }]}>
              <MapPin size={16} color={accent} strokeWidth={2} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Localisation</Text>
              <Text style={styles.infoValue}>{match.departement}</Text>
              <Text style={styles.infoSub}>{match.region}</Text>
            </View>
          </View>

          {/* Division */}
          <View style={styles.infoCard}>
            <View style={[styles.infoIconBox, { backgroundColor: accentSoft }]}>
              <Trophy size={16} color={accent} strokeWidth={2} />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoLabel}>Compétition</Text>
              <Text style={styles.infoValue}>{match.division}</Text>
              <Text style={styles.infoSub}>{sportLabel}</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bgApp },
  center:      { justifyContent: 'center', alignItems: 'center' },
  errorText:   { color: colors.textMuted, fontSize: 16 },
  scroll:      { flexGrow: 1 },

  // ── Hero
  hero: {
    backgroundColor: colors.bgCard,
    borderBottomLeftRadius: radii.sheet,
    borderBottomRightRadius: radii.sheet,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 28,
    marginBottom: 16,
  },
  heroStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  sportDot:      { width: 6, height: 6, borderRadius: 3 },
  sportChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  divisionRow: { alignItems: 'center', marginBottom: 24 },
  divisionPill: {
    backgroundColor: colors.bgInput,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  divisionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  teamsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamSide: { flex: 1 },
  teamRight: { alignItems: 'flex-end' },
  teamName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  teamRole: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  vsDivider: { width: 1, height: 20 },
  vsCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // ── Info cards
  section:  { paddingHorizontal: 16, gap: 10 },
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.tag,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTexts:  { flex: 1 },
  infoLabel:  { fontSize: 11, color: colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' },
  infoValue:  { fontSize: 14, color: colors.textPrimary, fontWeight: '700' },
  infoSub:    { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  infoTime:   { fontSize: 20, fontWeight: '800', marginTop: 2 },
  });
}
