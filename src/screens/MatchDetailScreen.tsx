// src/screens/MatchDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Match } from '../models/Match';
import { getMatchById } from '../services/matchsService';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetail'>;

export default function MatchDetailScreen({ route }: Props) {
  const { matchId } = route.params;
  const [match, setMatch] = useState<Match | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    getMatchById(matchId).then(setMatch);
  }, [matchId]);

  if (match === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Match introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDate = match.dateHeure.toLocaleString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const sportColor = theme.sportColors[match.sport] ?? theme.colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Sport + division badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: sportColor }]}>
            <Text style={styles.badgeText}>{match.sport.toUpperCase()}</Text>
          </View>
          <View style={[styles.badge, styles.badgeSecondary]}>
            <Text style={styles.badgeText}>{match.division}</Text>
          </View>
        </View>

        {/* Teams */}
        <View style={styles.scoreCard}>
          <View style={styles.teamBlock}>
            <Text style={styles.teamName}>{match.equipeA_nom}</Text>
            <Text style={styles.teamLabel}>Équipe A</Text>
          </View>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreVs}>vs</Text>
          </View>
          <View style={styles.teamBlock}>
            <Text style={styles.teamName}>{match.equipeB_nom}</Text>
            <Text style={styles.teamLabel}>Équipe B</Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.infoCard}>
          <InfoRow label="Date" value={formattedDate} />
          <InfoRow label="Région" value={match.region} />
          <InfoRow label="Département" value={match.departement} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: theme.colors.textMuted, fontSize: 16 },
  content: { padding: theme.spacing.lg },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.lg },
  badge: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeSecondary: { backgroundColor: '#555' },
  badgeText: { color: theme.colors.white, fontSize: 12, fontWeight: '600' },
  scoreCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  teamBlock: { flex: 1, alignItems: 'center' },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  teamLabel: { fontSize: 11, color: theme.colors.textMuted },
  scoreBlock: { alignItems: 'center', paddingHorizontal: 8 },
  scoreVs: { fontSize: 20, fontWeight: '700', color: '#ccc' },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  infoValue: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});
