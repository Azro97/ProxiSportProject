// src/screens/matchs/MatchsScreen.tsx
// Filters: Sport (single) → Région (multi) → Division (multi) → Date (default: today).
// Filter state lives in filtresStore (Zustand). See CLAUDE.md §5.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFiltresStore } from '../../stores/filtresStore';
import { Division } from '../../models/Filtre';
import { Match } from '../../models/Match';
import { Terrain } from '../../models/Terrain';
import { getMatchs } from '../../services/matchsService';
import { getTerrainById } from '../../services/terrainsService';
import { getRegions } from '../../services/matchsService';
import SportSelector from './components/SportSelector';
import GeoFilter from './components/GeoFilter';
import DateFilter from './components/DateFilter';
import MatchGroupList from './components/MatchGroupList';
import { theme } from '../../theme';

const DIVISIONS: Division[] = ['Nationale', 'Régionale', 'Départementale'];

export default function MatchsScreen() {
  const {
    sport, regions, divisions, date,
    setSport, toggleRegion, toggleDivision, setDate,
  } = useFiltresStore();

  const [matchs, setMatchs] = useState<Match[]>([]);
  const [terrains, setTerrains] = useState<Record<string, Terrain>>({});
  const [loading, setLoading] = useState(false);

  // Fetch fires when sport + at least one region + at least one division are set.
  // Date is always set (defaults to today).
  const allSet = Boolean(sport && regions.length > 0 && divisions.length > 0);

  useEffect(() => {
    if (!allSet) {
      setMatchs([]);
      return;
    }
    setLoading(true);
    getMatchs({ sport, regions, departement: null, divisions, date })
      .then(async results => {
        setMatchs(results);
        const uniqueIds = [...new Set(results.map(m => m.terrain_id))];
        const pairs = await Promise.all(
          uniqueIds.map(id => getTerrainById(id).then(t => [id, t] as const)),
        );
        const map: Record<string, Terrain> = {};
        pairs.forEach(([id, t]) => { if (t) map[id] = t; });
        setTerrains(map);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, regions, divisions, date]);

  const allRegions = getRegions();

  return (
    <SafeAreaView style={styles.container}>
      {/* Row 1 — Sport (single select) */}
      <SportSelector selected={sport} onSelect={setSport} />

      {/* Row 2 — Région (multi-select, unlocked after sport) */}
      <GeoFilter
        regions={allRegions}
        selected={regions}
        onToggle={toggleRegion}
        disabled={!sport}
      />

      {/* Row 3 — Division (multi-select, unlocked after at least one region) */}
      {regions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {DIVISIONS.map(div => {
            const isActive = divisions.includes(div);
            return (
              <TouchableOpacity
                key={div}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => toggleDivision(div)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{div}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Row 4 — Date (always visible, defaults to today) */}
      <DateFilter selected={date} onSelect={setDate} />

      {/* Content area */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} size="large" />
      ) : !allSet ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {!sport
              ? 'Sélectionnez un sport'
              : regions.length === 0
              ? 'Sélectionnez au moins une région'
              : 'Sélectionnez au moins une division'}
          </Text>
        </View>
      ) : matchs.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Aucun match trouvé</Text>
        </View>
      ) : (
        <MatchGroupList matchs={matchs} terrains={terrains} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  filterRow: {
    maxHeight: 50,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  filterContent: { paddingHorizontal: theme.spacing.md, paddingVertical: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    marginRight: theme.spacing.sm,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipLabel: { fontSize: 13, color: theme.colors.text },
  chipLabelActive: { color: theme.colors.white, fontWeight: '600' },
  loader: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 15, color: theme.colors.textMuted },
});
