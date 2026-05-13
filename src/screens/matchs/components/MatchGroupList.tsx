// src/screens/matchs/components/MatchGroupList.tsx
// Renders matches grouped by division (via grouperParDivision), each group
// sorted by dateHeure ascending.

import React from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { Match } from '../../../models/Match';
import { Terrain } from '../../../models/Terrain';
import { grouperParDivision } from '../../../services/matchsService';
import MatchCard from './MatchCard';
import { theme } from '../../../theme';

type Props = {
  matchs: Match[];
  terrains: Record<string, Terrain>;
};

export default function MatchGroupList({ matchs, terrains }: Props) {
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
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const terrain = terrains[item.terrain_id];
        return (
          <MatchCard
            match={item}
            terrainNom={terrain?.nom}
            terrainVille={terrain?.ville}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: theme.spacing.md },
  sectionHeader: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
