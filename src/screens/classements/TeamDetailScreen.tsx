// src/screens/classements/TeamDetailScreen.tsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, MapPin, Trophy } from 'lucide-react-native';
import { RootStackParamList } from '../../types';
import { Equipe } from '../../models/Equipe';
import { Match } from '../../models/Match';
import { getEquipeById } from '../../services/equipesService';
import { getMatchsByEquipe } from '../../services/matchsService';
import { sportColors, sportColorsSoft, type ColorPalette } from '../../theme';
import { useColors } from '../../hooks/useColors';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamDetail'>;

const SPORT_LABELS: Record<string, string> = {
  foot: 'Football',
  basket: 'Basketball',
  hand: 'Handball',
  volley: 'Volleyball',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function TeamDetailScreen({ route, navigation }: Props) {
  const { equipeId } = route.params;
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [equipe, setEquipe] = useState<Equipe | null | undefined>(undefined);
  const [matches, setMatches] = useState<Match[] | undefined>(undefined);

  useEffect(() => {
    getEquipeById(equipeId).then(e => {
      setEquipe(e);
      if (e) {
        getMatchsByEquipe(equipeId).then(setMatches);
      }
    });
  }, [equipeId]);

  const now = new Date();
  const sections = useMemo(() => {
    if (!matches) return [];
    const upcoming = matches.filter(m => m.dateHeure >= now).sort((a, b) => a.dateHeure.getTime() - b.dateHeure.getTime());
    const past = matches.filter(m => m.dateHeure < now).sort((a, b) => b.dateHeure.getTime() - a.dateHeure.getTime());
    const result = [];
    if (upcoming.length > 0) result.push({ title: 'À venir', data: upcoming });
    if (past.length > 0)     result.push({ title: 'Passés', data: past });
    return result;
  }, [matches]);

  const sportColor = equipe ? (sportColors[equipe.sport] ?? '#6b7280') : '#6b7280';
  const sportColorSoft = equipe ? (sportColorsSoft[equipe.sport] ?? 'rgba(107,114,128,0.12)') : 'rgba(107,114,128,0.12)';

  if (equipe === undefined) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  if (!equipe) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Équipe introuvable.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{equipe.nom}</Text>
      </View>

      {/* Team info card */}
      <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
        <View style={[styles.sportBadge, { backgroundColor: sportColorSoft }]}>
          <Text style={[styles.sportLabel, { color: sportColor }]}>
            {SPORT_LABELS[equipe.sport] ?? equipe.sport}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MapPin size={14} color={colors.textMuted} strokeWidth={1.8} />
          <Text style={styles.infoText}>{equipe.region} · {equipe.departement}</Text>
        </View>
      </View>

      {/* Matches */}
      {matches === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.center}>
          <Trophy size={36} color={colors.textDisabled} strokeWidth={1.5} />
          <Text style={styles.emptyText}>Aucun match trouvé</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            const isPast = item.dateHeure < now;
            const opponent =
              item.equipeA_id === equipeId ? item.equipeB_nom : item.equipeA_nom;
            const isHome = item.equipeA_id === equipeId;
            return (
              <View style={[styles.matchCard, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
                <View style={styles.matchTop}>
                  <Text style={[styles.matchOpponent, { color: colors.textPrimary }]}>
                    {isHome ? 'vs' : '@'} {opponent}
                  </Text>
                  <View style={[styles.divisionBadge, { backgroundColor: colors.bgCardElev }]}>
                    <Text style={[styles.divisionText, { color: colors.textTertiary }]}>{item.division}</Text>
                  </View>
                </View>
                <Text style={[styles.matchDate, { color: isPast ? colors.textMuted : colors.textSecondary }]}>
                  {formatDate(item.dateHeure)} · {formatTime(item.dateHeure)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root:         { flex: 1, backgroundColor: colors.bgApp },
    center:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
    },
    backBtn:      { padding: 4 },
    headerTitle:  { flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    infoCard: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
    },
    sportBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    sportLabel:   { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
    infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText:     { fontSize: 13, color: colors.textTertiary },
    listContent:  { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginTop: 16,
      marginBottom: 6,
    },
    matchCard: {
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      gap: 4,
    },
    matchTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    matchOpponent: { fontSize: 15, fontWeight: '600', flex: 1 },
    divisionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    divisionText:  { fontSize: 11, fontWeight: '600' },
    matchDate:    { fontSize: 12 },
    errorText:    { fontSize: 15, color: colors.textMuted },
    emptyText:    { fontSize: 14, color: colors.textMuted },
  });
}
