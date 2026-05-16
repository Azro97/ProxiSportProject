// src/screens/matchs/components/MatchGroupList.tsx
// Renders matches grouped by division (via grouperParDivision), each group
// sorted by dateHeure ascending.

import React from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Match } from '../../../models/Match';
import { Terrain } from '../../../models/Terrain';
import { RootStackParamList } from '../../../types';
import { grouperParDivision } from '../../../services/matchsService';
import MatchCard from './MatchCard';
import { theme } from '../../../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  matchs: Match[];
  terrains: Record<string, Terrain>;
};

export default function MatchGroupList({ matchs, terrains }: Props) {
  const navigation = useNavigation<Nav>();
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
            onPress={() => navigation.navigate('MatchDetail', { matchId: item.id })}
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
