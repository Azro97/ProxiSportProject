// src/screens/tournois/components/TournoiCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { Tournoi } from '../../../models/Tournoi';
import { sportColors } from '../../../theme';
import { formatPrix } from '../../../services/tournoiService';
import { styles } from './TournoiCard.styles';

const SPORT_EMOJI: Record<string, string> = {
  foot: '⚽', basket: '🏀', hand: '🤾', volley: '🏐',
};

const STATUT_CONFIG = {
  ouvert:   { label: 'OUVERT',   bg: '#22c55e' },
  complet:  { label: 'COMPLET',  bg: '#ef4444' },
  en_cours: { label: 'EN COURS', bg: '#f59e0b' },
  terminé:  { label: 'TERMINÉ',  bg: '#6b7280' },
  annulé:   { label: 'ANNULÉ',   bg: '#374151' },
};

const SPORT_FALLBACK_COLORS: Record<string, string[]> = {
  foot:   ['#1e3a5f', '#3b82f6'],
  basket: ['#7c2d12', '#f97316'],
  hand:   ['#3b0764', '#a855f7'],
  volley: ['#14532d', '#22c55e'],
};

type Props = { tournoi: Tournoi; onPress: () => void };

export default function TournoiCard({ tournoi, onPress }: Props) {
  const accent = sportColors[tournoi.sport] ?? '#6b7280';
  const statut = STATUT_CONFIG[tournoi.statut] ?? STATUT_CONFIG.annulé;
  const fillPct = tournoi.maxEquipes > 0
    ? Math.min(tournoi.equipesInscrites / tournoi.maxEquipes, 1)
    : 0;
  const spotsLeft = tournoi.maxEquipes - tournoi.equipesInscrites;
  const dateStr = tournoi.dateDebut.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
  });
  const fallbackColors = SPORT_FALLBACK_COLORS[tournoi.sport] ?? ['#1f2937', '#374151'];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <ImageBackground
        source={tournoi.photoUrl ? { uri: tournoi.photoUrl } : undefined}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        {/* Fallback gradient when no photo */}
        {!tournoi.photoUrl && (
          <LinearGradient
            colors={fallbackColors}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {/* Dark overlay for readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top row */}
        <View style={styles.topRow}>
          <View style={[styles.sportBadge, { backgroundColor: accent }]}>
            <Text style={styles.sportEmoji}>{SPORT_EMOJI[tournoi.sport] ?? '🏆'}</Text>
            <Text style={styles.sportLabel}>{tournoi.sport.toUpperCase()}</Text>
          </View>
          <View style={[styles.statutBadge, { backgroundColor: statut.bg }]}>
            <Text style={styles.statutText}>{statut.label}</Text>
          </View>
        </View>

        {/* Bottom content */}
        <View style={styles.bottom}>
          <Text style={styles.nom} numberOfLines={2}>{tournoi.nom}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={11} color="rgba(255,255,255,0.7)" strokeWidth={2} />
              <Text style={styles.metaText}>{dateStr}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={11} color="rgba(255,255,255,0.7)" strokeWidth={2} />
              <Text style={styles.metaText}>{tournoi.terrain_ville}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.prix}>{formatPrix(tournoi.prixInscription)}</Text>
            </View>
          </View>

          {/* Teams progress */}
          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(fillPct * 100)}%` as any, backgroundColor: accent },
                ]}
              />
            </View>
            <View style={styles.progressMeta}>
              <Users size={10} color="rgba(255,255,255,0.6)" strokeWidth={2} />
              <Text style={styles.progressLabel}>
                {tournoi.equipesInscrites}/{tournoi.maxEquipes}
                {tournoi.statut === 'ouvert' && spotsLeft <= 4 && spotsLeft > 0
                  ? ` · ${spotsLeft} restante${spotsLeft > 1 ? 's' : ''}`
                  : ''}
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}
