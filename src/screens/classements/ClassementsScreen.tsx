// src/screens/classements/ClassementsScreen.tsx

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type ColorPalette, sportColors, sportColorsSoft } from '../../theme';
import { useColors } from '../../hooks/useColors';
import { getAllEquipes } from '../../services/equipesService';
import { Equipe } from '../../models/Equipe';
import { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SPORT_FILTERS: { key: string | null; label: string }[] = [
  { key: null,     label: 'Tous' },
  { key: 'foot',   label: 'Football' },
  { key: 'basket', label: 'Basket' },
  { key: 'hand',   label: 'Handball' },
  { key: 'volley', label: 'Volley' },
];

const SPORT_ABBR: Record<string, string> = {
  foot: '⚽', basket: '🏀', hand: '🤾', volley: '🏐',
};

export default function ClassementsScreen() {
  const colors = useColors();
  const navigation = useNavigation<Nav>();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [allTeams, setAllTeams] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    getAllEquipes()
      .then(teams => setAllTeams(teams.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))))
      .catch(() => setAllTeams([]))
      .finally(() => setLoading(false));
  }, []);

  const displayed = useMemo(() => {
    let list = sportFilter ? allTeams.filter(e => e.sport === sportFilter) : allTeams;
    const q = query.trim().toLowerCase();
    if (!q) return list;

    const score = (e: Equipe): number => {
      const nom = e.nom.toLowerCase();
      if (nom.startsWith(q)) return 0;
      if (nom.includes(q))   return 1;
      return 2;
    };
    return list
      .filter(e =>
        e.nom.toLowerCase().includes(q) ||
        e.region.toLowerCase().includes(q) ||
        e.departement.toLowerCase().includes(q),
      )
      .sort((a, b) => score(a) - score(b));
  }, [query, sportFilter, allTeams]);

  const onSelectEquipe = useCallback((equipe: Equipe) => {
    Keyboard.dismiss();
    navigation.navigate('TeamDetail', { equipeId: equipe.id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Equipe }) => {
    const sc  = sportColors[item.sport]     ?? '#6b7280';
    const scs = sportColorsSoft[item.sport] ?? 'rgba(107,114,128,0.12)';
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onSelectEquipe(item)}
        activeOpacity={0.65}>
        <View style={[styles.avatar, { backgroundColor: scs }]}>
          <Text style={[styles.avatarText, { color: sc }]}>
            {SPORT_ABBR[item.sport] ?? '??'}
          </Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.nom}
          </Text>
          <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={1}>
            {item.departement}{'  ·  '}{item.region}
          </Text>
        </View>
        <ChevronRight size={15} color={colors.textDisabled} strokeWidth={2} />
      </TouchableOpacity>
    );
  }, [styles, colors, onSelectEquipe]);

  return (
    <SafeAreaView style={styles.root}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Équipes</Text>
          {!loading && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {displayed.length} / {allTeams.length} équipes
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} hitSlop={12} style={styles.themeBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ── Search bar ───────────────────────────────────────────── */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBar, {
          backgroundColor: colors.bgInput,
          borderColor: focused ? colors.userPosition : colors.borderSubtle,
        }]}>
          <Search size={16} color={focused ? colors.userPosition : colors.textMuted} strokeWidth={2} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Nom, région, département…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => { setQuery(''); inputRef.current?.focus(); }}
              hitSlop={10}>
              <Text style={[styles.clearBtn, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Sport filter chips ───────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterStrip}>
        {SPORT_FILTERS.map(sf => {
          const active      = sportFilter === sf.key;
          const accent      = sf.key ? (sportColors[sf.key]     ?? colors.userPosition) : colors.userPosition;
          const accentSoft  = sf.key ? (sportColorsSoft[sf.key] ?? 'rgba(59,130,246,0.12)') : 'rgba(59,130,246,0.12)';
          return (
            <TouchableOpacity
              key={String(sf.key)}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: accentSoft, borderColor: accent }
                  : { backgroundColor: colors.bgInput, borderColor: 'transparent' },
              ]}
              onPress={() => setSportFilter(
                sf.key === null ? null : (sportFilter === sf.key ? null : sf.key),
              )}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, { color: active ? accent : colors.textSecondary }]}>
                {sf.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: colors.borderFaint }]} />

      {/* ── List ─────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.textMuted} />
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucune équipe trouvée</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.borderFaint }]} />
          )}
        />
      )}

    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgApp },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    title:    { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
    subtitle: { fontSize: 12, marginTop: 3 },
    themeBtn: { padding: 6, marginTop: 4 },

    // Search
    searchWrapper: { paddingHorizontal: 16, marginBottom: 10 },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
    clearBtn:    { fontSize: 15, lineHeight: 20 },

    // Filter chips
    filterScroll: { flexShrink: 0, flexGrow: 0 },
    filterStrip:  { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1.5,
      marginRight: 8,
    },
    chipText: { fontSize: 13, fontWeight: '600' },

    // Divider
    divider: { height: 1 },

    // List
    listContent: { paddingBottom: 32 },
    separator:   { height: 1, marginLeft: 68 },
    center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText:   { fontSize: 15 },

    // Row
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 13,
      gap: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: { fontSize: 18 },
    rowBody:    { flex: 1 },
    rowName:    { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 },
    rowMeta:    { fontSize: 12, marginTop: 2 },
  });
}
