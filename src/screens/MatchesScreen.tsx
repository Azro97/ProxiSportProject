// src/screens/MatchesScreen.tsx
// Cascade filters: Sport → Région → Division, then date row

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Sport, Division, Match } from '../types';
import { getRegions, getMatches } from '../services/firebase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

const SPORTS: Sport[] = ['Football', 'Basketball', 'Handball', 'Rugby', 'Volleyball'];
const DIVISIONS: Division[] = ['Nationale', 'Régionale', 'Départementale'];

function getWeekDays(): { label: string; iso: string }[] {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const result: { label: string; iso: string }[] = [
    { label: "Aujourd'hui", iso: 'today' },
  ];
  const today = new Date();
  for (let i = 1; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      label: days[d.getDay()],
      iso: d.toISOString().slice(0, 10),
    });
  }
  return result;
}

export default function MatchesScreen({ navigation }: Props) {
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const regions = getRegions();
  const weekDays = useMemo(() => getWeekDays(), []);

  // Cascade: selecting a sport resets downstream filters
  function handleSportSelect(sport: Sport) {
    if (selectedSport === sport) {
      setSelectedSport(null);
      setSelectedRegion(null);
      setSelectedDivision(null);
    } else {
      setSelectedSport(sport);
      setSelectedRegion(null);
      setSelectedDivision(null);
    }
  }

  function handleRegionSelect(region: string) {
    if (selectedRegion === region) {
      setSelectedRegion(null);
      setSelectedDivision(null);
    } else {
      setSelectedRegion(region);
      setSelectedDivision(null);
    }
  }

  function handleDivisionSelect(division: Division) {
    setSelectedDivision(prev => (prev === division ? null : division));
  }

  function handleDaySelect(iso: string) {
    setSelectedDay(prev => (prev === iso ? null : iso));
  }

  const matches: Match[] = useMemo(() => {
    if (!selectedSport) return [];
    return getMatches({
      sport: selectedSport,
      region: selectedRegion ?? undefined,
      division: selectedDivision ?? undefined,
      date: selectedDay ?? undefined,
    });
  }, [selectedSport, selectedRegion, selectedDivision, selectedDay]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Sport filter ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {SPORTS.map(sport => (
          <TouchableOpacity
            key={sport}
            style={[styles.chip, selectedSport === sport && styles.chipActive]}
            onPress={() => handleSportSelect(sport)}>
            <Text style={[styles.chipText, selectedSport === sport && styles.chipTextActive]}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Région filter (unlocked after sport) ── */}
      {selectedSport && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {regions.map(region => (
            <TouchableOpacity
              key={region}
              style={[styles.chip, selectedRegion === region && styles.chipActive]}
              onPress={() => handleRegionSelect(region)}>
              <Text style={[styles.chipText, selectedRegion === region && styles.chipTextActive]}>
                {region}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Division filter (unlocked after région) ── */}
      {selectedRegion && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {DIVISIONS.map(div => (
            <TouchableOpacity
              key={div}
              style={[styles.chip, selectedDivision === div && styles.chipActive]}
              onPress={() => handleDivisionSelect(div)}>
              <Text style={[styles.chipText, selectedDivision === div && styles.chipTextActive]}>
                {div}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Date filter row (always visible once sport chosen) ── */}
      {selectedSport && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterRow, styles.dateRow]}>
          {weekDays.map(day => (
            <TouchableOpacity
              key={day.iso}
              style={[styles.dayChip, selectedDay === day.iso && styles.chipActive]}
              onPress={() => handleDaySelect(day.iso)}>
              <Text style={[styles.chipText, selectedDay === day.iso && styles.chipTextActive]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Match list ── */}
      {!selectedSport ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Sélectionnez un sport pour voir les matchs</Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Aucun match trouvé</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.matchCard}
              onPress={() => navigation.navigate('MatchDetail', { matchId: item.id })}>
              <View style={styles.matchHeader}>
                <Text style={styles.division}>{item.division}</Text>
                <Text style={styles.statut}>{item.statut}</Text>
              </View>
              <View style={styles.matchTeams}>
                <Text style={styles.team}>{item.domicile}</Text>
                <Text style={styles.score}>
                  {item.scoreDomicile !== undefined
                    ? `${item.scoreDomicile} - ${item.scoreExterieur}`
                    : 'vs'}
                </Text>
                <Text style={styles.team}>{item.exterieur}</Text>
              </View>
              <Text style={styles.lieu}>{item.lieu}</Text>
              <Text style={styles.date}>
                {new Date(item.dateHeure as string).toLocaleString('fr-FR', {
                  weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const ACCENT = '#E63946';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  filterRow: { maxHeight: 48, paddingHorizontal: 12, paddingVertical: 6 },
  dateRow: { borderTopWidth: 1, borderTopColor: '#eee', marginTop: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    alignSelf: 'center',
  },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    alignSelf: 'center',
  },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#999', fontSize: 15 },
  list: { padding: 12 },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  division: { fontSize: 12, color: ACCENT, fontWeight: '600', textTransform: 'uppercase' },
  statut: { fontSize: 12, color: '#666' },
  matchTeams: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  team: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a', textAlign: 'center' },
  score: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginHorizontal: 8 },
  lieu: { fontSize: 12, color: '#888', marginBottom: 2 },
  date: { fontSize: 12, color: '#888' },
});
