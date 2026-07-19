// src/screens/matchs/components/MatchGroupList.tsx
// Renders matches grouped by division (via grouperParDivision), each group
// sorted by dateHeure ascending.

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Match } from '../../../models/Match';
import { Terrain } from '../../../models/Terrain';
import { RootStackParamList } from '../../../types';
import { grouperParDivision } from '../../../services/matchsService';
import MatchCard from './MatchCard';
import { sportColors, type ColorPalette } from '../../../theme';
import { useColors } from '../../../hooks/useColors';
import { useFiltresStore } from '../../../stores/filtresStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  matchs: Match[];
  terrains: Record<string, Terrain>;
  listHeader?: React.ReactElement | null;
  listEmpty?: React.ReactElement | null;
};

export default function MatchGroupList({ matchs, terrains, listHeader, listEmpty }: Props) {
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sport = useFiltresStore(s => s.sport);
  const accent = sport ? sportColors[sport] : colors.textPrimary;
  const grouped = grouperParDivision(matchs);

  const sections = Object.entries(grouped).map(([division, data]) => ({
    title: division,
    data: [...data].sort((a, b) => a.dateHeure.getTime() - b.dateHeure.getTime()),
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={listHeader ?? undefined}
      ListEmptyComponent={listEmpty ?? undefined}
      renderSectionHeader={({ section: { title, data } }) => (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: accent }]}>{title.toUpperCase()}</Text>
          <Text style={styles.sectionCount}>
            {data.length} MATCH{data.length > 1 ? 'S' : ''}
          </Text>
        </View>
      )}
      renderItem={({ item }) => {
        const terrain = terrains[item.terrain_id];
        return (
          <MatchCard
            match={item}
            terrainNom={terrain?.nom}
            terrainVille={terrain?.ville}
            onPress={() => navigation.navigate('MatchDetail', { matchId: item.id })}
          />
        );
      }}
      renderSectionFooter={() => <View style={styles.sectionFooter} />}
    />
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  content: { paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  sectionFooter: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  });
}
