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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Sun, Moon } from 'lucide-react-native';
import { useFiltresStore } from '../../stores/filtresStore';
import { Match } from '../../models/Match';
import { Terrain } from '../../models/Terrain';
import { getMatchs, getMatchsJoues } from '../../services/matchsService';
import { getTerrainById } from '../../services/terrainsService';
import SportSelector from './components/SportSelector';
import AffinerFilter from './components/AffinerFilter';
import DateFilter from './components/DateFilter';
import MatchGroupList from './components/MatchGroupList';
import { sportColors, type ColorPalette } from '../../theme';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';

type Mode = 'upcoming' | 'results';

export default function MatchsScreen() {
  const colors = useColors();
  const isDark = useThemeStore(s => s.isDark);
  const toggleTheme = useThemeStore(s => s.toggleTheme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    sport, regions, divisions, date,
    setSport, setDate,
  } = useFiltresStore();

  const [mode, setMode] = useState<Mode>('upcoming');
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [terrains, setTerrains] = useState<Record<string, Terrain>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Match[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const accent = sport ? sportColors[sport] : colors.textPrimary;

  // Load upcoming matches (mode === 'upcoming')
  useEffect(() => {
    if (mode !== 'upcoming') return;
    if (!sport) { setMatchs([]); setTerrains({}); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getMatchs({ sport, regions, departement: null, divisions, date });
        setMatchs(data);
        const uniqueIds = [...new Set(data.map(m => m.terrain_id))];
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
  }, [mode, sport, regions, divisions, date]);

  // Load past results (mode === 'results')
  useEffect(() => {
    if (mode !== 'results') return;
    setResultsLoading(true);
    getMatchsJoues(sport ?? undefined)
      .then(setResults)
      .finally(() => setResultsLoading(false));
  }, [mode, sport]);

  const isLoading = mode === 'upcoming' ? loading : resultsLoading;
  const displayMatchs = mode === 'upcoming' ? matchs : results;
  const count = displayMatchs.length;

  const ListHeader = useMemo(() => (
    <View>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              {sport
                ? `${count} ${mode === 'results' ? 'RÉSULTAT' : 'MATCH'}${count !== 1 ? 'S' : ''}`
                : 'PROXISPORT'}
            </Text>
            <Text style={styles.title}>
              {mode === 'results' ? 'Résultats' : 'Matchs'}{' '}
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

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        {(['upcoming', 'results'] as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && { backgroundColor: accent }]}
            onPress={() => setMode(m)}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeBtnText, mode === m && styles.modeBtnActive]}>
              {m === 'upcoming' ? 'À venir' : 'Résultats'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sport selector — shared */}
      <SportSelector selected={sport} onSelect={setSport} />

      {/* Upcoming-only filters */}
      {mode === 'upcoming' && (
        <>
          <AffinerFilter disabled={!sport} />
          <DateFilter selected={date} onSelect={setDate} disabled={!sport} />
        </>
      )}

      <View style={styles.divider} />

      {isLoading && <ActivityIndicator style={styles.loader} color={accent} size="large" />}
    </View>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [mode, sport, regions, divisions, date, count, accent, isLoading, styles, isDark, toggleTheme, colors]);

  const ListEmpty = useMemo(() => !isLoading ? (
    !sport ? (
      <EmptyState
        colors={colors}
        icon={<Search size={22} color={colors.textMuted} strokeWidth={1.8} />}
        title="Choisissez un sport"
        body="Sélectionnez un sport pour voir les matchs proches de vous."
      />
    ) : count === 0 ? (
      <EmptyState
        colors={colors}
        title={mode === 'results' ? 'Aucun résultat' : 'Aucun match trouvé'}
        body={mode === 'results'
          ? 'Aucun match terminé trouvé pour ce sport.'
          : 'Essayez une autre date, région ou division.'}
      />
    ) : null
  ) : null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [isLoading, mode, sport, count, colors]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgApp} />
      <MatchGroupList
        matchs={displayMatchs}
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
    modeRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: colors.bgInput,
      borderRadius: 10,
      padding: 3,
      gap: 3,
    },
    modeBtn: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 8,
      alignItems: 'center',
    },
    modeBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    modeBtnActive: {
      color: '#ffffff',
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
