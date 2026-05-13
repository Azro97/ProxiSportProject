// src/screens/matchs/MatchsScreen.tsx
// Cascade filters: Sport → Région → Division → Date → fetch.
// Filter state lives in filtresStore (Zustand). See CLAUDE.md §5 and §12.

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
    sport, region, departement, division, date,
    setSport, setRegion, setDivision, setDate,
  } = useFiltresStore();

  const [matchs, setMatchs] = useState<Match[]>([]);
  const [terrains, setTerrains] = useState<Record<string, Terrain>>({});
  const [loading, setLoading] = useState(false);

  // Fetch fires only when ALL 4 filters are set — see CLAUDE.md §12
  const allSet = Boolean(sport && region && division && date);

  useEffect(() => {
    if (!allSet) {
      setMatchs([]);
      return;
    }
    setLoading(true);
    getMatchs({ sport, region, departement, division, date, jourSemaine: null })
      .then(async results => {
        setMatchs(results);
        // Batch-fetch terrain info for display in MatchCard (terrain_nom + ville)
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
  }, [sport, region, departement, division, date]);

  const regions = getRegions();

  return (
    <SafeAreaView style={styles.container}>
      {/* Row 1 — Sport */}
      <SportSelector selected={sport} onSelect={setSport} />

      {/* Row 2 — Région (unlocked after sport) */}
      <GeoFilter
        regions={regions}
        selected={region}
        onSelect={setRegion}
        disabled={!sport}
      />

      {/* Row 3 — Division (unlocked after région) */}
      {region && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {DIVISIONS.map(div => {
            const isActive = division === div;
            return (
              <TouchableOpacity
                key={div}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setDivision(div)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{div}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Row 4 — Date (unlocked after division) */}
      <DateFilter selected={date} onSelect={setDate} disabled={!division} />

      {/* Content area */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} size="large" />
      ) : !allSet ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {!sport
              ? 'Sélectionnez un sport'
              : !region
              ? 'Sélectionnez une région'
              : !division
              ? 'Sélectionnez une division'
              : 'Sélectionnez une date'}
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
