// src/screens/MatchDetailScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getMatchById } from '../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetail'>;

export default function MatchDetailScreen({ route }: Props) {
  const { matchId } = route.params;
  const match = getMatchById(matchId);

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Match introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateObj = new Date(match.dateHeure as string);
  const formattedDate = dateObj.toLocaleString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const hasScore =
    match.scoreDomicile !== undefined && match.scoreExterieur !== undefined;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Badge sport + division */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{match.sport}</Text>
          </View>
          <View style={[styles.badge, styles.badgeSecondary]}>
            <Text style={styles.badgeText}>{match.division}</Text>
          </View>
        </View>

        {/* Score / Teams */}
        <View style={styles.scoreCard}>
          <View style={styles.teamBlock}>
            <Text style={styles.teamName}>{match.domicile}</Text>
            <Text style={styles.teamLabel}>Domicile</Text>
          </View>
          <View style={styles.scoreBlock}>
            {hasScore ? (
              <Text style={styles.scoreBig}>
                {match.scoreDomicile} — {match.scoreExterieur}
              </Text>
            ) : (
              <Text style={styles.scoreVs}>vs</Text>
            )}
            <View style={[styles.statutBadge, match.statut === 'En cours' && styles.statutLive]}>
              <Text style={styles.statutText}>{match.statut}</Text>
            </View>
          </View>
          <View style={styles.teamBlock}>
            <Text style={styles.teamName}>{match.exterieur}</Text>
            <Text style={styles.teamLabel}>Extérieur</Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={styles.infoCard}>
          <InfoRow label="Date" value={formattedDate} />
          <InfoRow label="Lieu" value={match.lieu} />
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

const ACCENT = '#E63946';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#999', fontSize: 16 },
  content: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeSecondary: { backgroundColor: '#555' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  teamBlock: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 4 },
  teamLabel: { fontSize: 11, color: '#999' },
  scoreBlock: { alignItems: 'center', paddingHorizontal: 8 },
  scoreBig: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  scoreVs: { fontSize: 20, fontWeight: '700', color: '#ccc', marginBottom: 6 },
  statutBadge: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statutLive: { backgroundColor: '#ff3b30' },
  statutText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
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
  infoLabel: { fontSize: 13, color: '#888', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#1a1a1a', fontWeight: '500', flex: 1, textAlign: 'right' },
});
