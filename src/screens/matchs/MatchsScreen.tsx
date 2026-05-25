// src/screens/matchs/MatchsScreen.tsx
// Filters: Sport (single) → Affiner (Région + Division via modals) → Date.
// Filter state lives in filtresStore (Zustand). See CLAUDE.md §5.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Sun, Moon } from 'lucide-react-native';
import { useFiltresStore } from '../../stores/filtresStore';
import { Match } from '../../models/Match';
import { Terrain } from '../../models/Terrain';
import { getMatchs } from '../../services/matchsService';
import { getTerrainById } from '../../services/terrainsService';
import SportSelector from './components/SportSelector';
import AffinerFilter from './components/AffinerFilter';
import DateFilter from './components/DateFilter';
import MatchGroupList from './components/MatchGroupList';
import { colors, sportColors, type ColorPalette } from '../../theme';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';
import { TouchableOpacity } from 'react-native';

export default function MatchsScreen() {
  const colors = useColors();
  const isDark = useThemeStore(s => s.isDark);
  const toggleTheme = useThemeStore(s => s.toggleTheme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    sport, regions, divisions, date,
    setSport, setDate,
  } = useFiltresStore();

  const [matchs, setMatchs] = useState<Match[]>([]);
  const [terrains, setTerrains] = useState<Record<string, Terrain>>({});
  const [loading, setLoading] = useState(false);

  // Only sport is required — empty regions/divisions mean "Tous" (no filter applied).
  const allSet = Boolean(sport);
  const accent = sport ? sportColors[sport] : colors.textPrimary;

  useEffect(() => {
    if (!sport) {
      setMatchs([]);
      setTerrains({});
      return;
    }

    // 250ms debounce — prevents firing a request on every intermediate tap
    // when the user quickly picks sport → region → division.
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await getMatchs({ sport, regions, departement: null, divisions, date });
        setMatchs(results);
        const uniqueIds = [...new Set(results.map(m => m.terrain_id))];
        const pairs = await Promise.all(
          uniqueIds.map(id => getTerrainById(id).then(t => [id, t] as const)),
        );
        const map: Record<string, Terrain> = {};
        pairs.forEach(([id, t]) => { if (t) map[id] = t; });
        setTerrains(map);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, regions, divisions, date]);

  const totalCount = matchs.length;

  // useMemo prevents new element references on every render.
  // Without this, SectionList treats the header as a new component each time
  // and remounts it → visible scroll jump whenever any state changes.
  const ListHeader = useMemo(() => (
    <View>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              {sport ? `${totalCount} MATCH${totalCount !== 1 ? 'S' : ''}` : 'PROXISPORT'}
            </Text>
            <Text style={styles.title}>
              Matchs{' '}
              <Text style={{ color: accent }}>près de vous</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme} activeOpacity={0.7}>
            {isDark
              ? <Sun size={20} color={colors.textSecondary} strokeWidth={2} />
              : <Moon size={20} color={colors.textSecondary} strokeWidth={2} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Step 1 — Sport */}
      <SportSelector selected={sport} onSelect={setSport} />

      {/* Step 2 — Région + Division (combined Affiner row) */}
      <AffinerFilter disabled={!sport} />

      {/* Step 3 — Date */}
      <DateFilter selected={date} onSelect={setDate} disabled={!sport} />

      <View style={styles.divider} />

      {loading && <ActivityIndicator style={styles.loader} color={accent} size="large" />}
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [sport, regions, divisions, date, totalCount, accent, loading, styles, isDark, toggleTheme, colors]);

  const ListEmpty = useMemo(() => !loading ? (
    !sport ? (
      <EmptyState
        colors={colors}
        icon={<Search size={22} color={colors.textMuted} strokeWidth={1.8} />}
        title="Choisissez un sport"
        body="Sélectionnez un sport pour voir les matchs proches de vous."
      />
    ) : (
      <EmptyState
        colors={colors}
        title="Aucun match trouvé"
        body="Essayez une autre date, région ou division."
      />
    )
  ) : null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [loading, sport, colors]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgApp} />
      <MatchGroupList
        matchs={matchs}
        terrains={terrains}
        listHeader={ListHeader}
        listEmpty={ListEmpty}
      />
    </View>
  );
}

function EmptyState({
  colors, icon, title, body,
}: { colors: ColorPalette; icon?: React.ReactNode; title: string; body: string }) {
  const styles = makeEmptyStyles(colors);
  return (
    <View style={styles.root}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function makeEmptyStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: {
      marginHorizontal: 16,
      marginTop: 24,
      paddingVertical: 36,
      paddingHorizontal: 24,
      borderRadius: 18,
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.borderFaint,
      alignItems: 'center',
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.bgCard,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6, textAlign: 'center' },
    body:  { fontSize: 13, lineHeight: 18, color: colors.textTertiary, textAlign: 'center' },
  });
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgApp },
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: { flex: 1 },
    themeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.bgInput,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.8,
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.4,
      lineHeight: 36,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderFaint,
      marginTop: 8,
      marginBottom: 4,
    },
    loader: { marginTop: 40 },
  });
}
