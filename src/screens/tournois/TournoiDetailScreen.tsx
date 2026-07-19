// src/screens/tournois/TournoiDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ImageBackground, ActivityIndicator, StatusBar,
  Linking, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft, Calendar, MapPin, Users, Clock,
  Trophy, ChevronRight, Info,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Tournoi } from '../../models/Tournoi';
import { getTournoiById, formatPrix } from '../../services/tournoiService';
import { useColors } from '../../hooks/useColors';
import { infoStyles, styles } from './TournoiDetailScreen.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sportColors, sportColorsSoft } from '../../theme';
import InscriptionModal from './components/InscriptionModal';

type Props = NativeStackScreenProps<RootStackParamList, 'TournoiDetail'>;

const SPORT_EMOJI: Record<string, string> = {
  foot: '⚽', basket: '🏀', hand: '🤾', volley: '🏐',
};

const STATUT_CONFIG = {
  ouvert:   { label: 'Inscriptions ouvertes', color: '#22c55e' },
  complet:  { label: 'Tournoi complet',        color: '#ef4444' },
  en_cours: { label: 'En cours',               color: '#f59e0b' },
  terminé:  { label: 'Terminé',                color: '#6b7280' },
  annulé:   { label: 'Annulé',                 color: '#374151' },
};

const FALLBACK_COLORS: Record<string, string[]> = {
  foot:   ['#1e3a5f', '#3b82f6'],
  basket: ['#7c2d12', '#f97316'],
  hand:   ['#3b0764', '#a855f7'],
  volley: ['#14532d', '#22c55e'],
};

export default function TournoiDetailScreen({ route, navigation }: Props) {
  const { tournoiId } = route.params;
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [tournoi, setTournoi] = useState<Tournoi | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getTournoiById(tournoiId)
      .then(setTournoi)
      .finally(() => setLoading(false));
  }, [tournoiId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgApp }]}>
        <ActivityIndicator size="large" color={colors.userPosition} />
      </View>
    );
  }

  if (!tournoi) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgApp }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>Tournoi introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.userPosition, marginTop: 12, fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const accent = sportColors[tournoi.sport] ?? colors.userPosition;
  const accentSoft = sportColorsSoft[tournoi.sport] ?? colors.bgCard;
  const statut = STATUT_CONFIG[tournoi.statut] ?? STATUT_CONFIG.annulé;
  const fillPct = tournoi.maxEquipes > 0
    ? Math.min(tournoi.equipesInscrites / tournoi.maxEquipes, 1)
    : 0;
  const spotsLeft = tournoi.maxEquipes - tournoi.equipesInscrites;
  const fallbackColors = FALLBACK_COLORS[tournoi.sport] ?? ['#1f2937', '#374151'];

  const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatShort = (d: Date) =>
    d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  const canRegister = tournoi.statut === 'ouvert';

  function openMaps() {
    const q = encodeURIComponent(`${tournoi!.terrain_nom}, ${tournoi!.terrain_ville}`);
    const url = Platform.OS === 'ios'
      ? `maps:?q=${q}`
      : `https://www.google.com/maps/search/?api=1&query=${q}`;
    Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero image ── */}
        <View style={styles.hero}>
          <ImageBackground
            source={tournoi.photoUrl ? { uri: tournoi.photoUrl } : undefined}
            style={styles.heroImage}
          >
            {!tournoi.photoUrl && (
              <LinearGradient
                colors={fallbackColors}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />

            {/* Sport badge + title */}
            <View style={styles.heroContent}>
              <View style={[styles.sportBadge, { backgroundColor: accent }]}>
                <Text style={styles.sportEmoji}>{SPORT_EMOJI[tournoi.sport] ?? '🏆'}</Text>
                <Text style={styles.sportLabel}>{tournoi.sport.toUpperCase()}</Text>
              </View>
              <Text style={styles.heroTitle}>{tournoi.nom}</Text>
              <Text style={styles.heroOrga}>Organisé par {tournoi.organisateur_nom}</Text>
            </View>
          </ImageBackground>
        </View>

        {/* ── Status bar ── */}
        <View style={[styles.statusBar, { backgroundColor: statut.color + '22', borderBottomColor: statut.color + '44' }]}>
          <View style={[styles.statusDot, { backgroundColor: statut.color }]} />
          <Text style={[styles.statusText, { color: statut.color }]}>{statut.label}</Text>
        </View>

        <View style={styles.body}>

          {/* ── Info grid ── */}
          <View style={[styles.infoGrid, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
            <InfoRow icon={<Calendar size={16} color={accent} />} label="Début" value={formatDate(tournoi.dateDebut)} />
            <Divider color={colors.borderHairline} />
            <InfoRow icon={<Calendar size={16} color={accent} />} label="Fin" value={formatDate(tournoi.dateFin)} />
            <Divider color={colors.borderHairline} />
            <InfoRow
              icon={<Users size={16} color={accent} />}
              label="Format"
              value={`${tournoi.tailleEquipe}v${tournoi.tailleEquipe} · ${tournoi.maxEquipes} équipes max`}
            />
            <Divider color={colors.borderHairline} />
            <InfoRow
              icon={<Clock size={16} color={colors.textSecondary} />}
              label="Clôture inscriptions"
              value={formatShort(tournoi.dateClotureInscription)}
            />
            <Divider color={colors.borderHairline} />
            <TouchableOpacity onPress={openMaps} activeOpacity={0.7}>
              <InfoRow
                icon={<MapPin size={16} color={accent} />}
                label={tournoi.terrain_nom}
                value={tournoi.terrain_ville + ' · ' + tournoi.departement}
                actionIcon={<ChevronRight size={15} color={colors.textSecondary} />}
              />
            </TouchableOpacity>
          </View>

          {/* ── Teams progress ── */}
          <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
            <View style={styles.teamsHeader}>
              <View style={styles.teamsLeft}>
                <Users size={16} color={accent} strokeWidth={2} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Équipes</Text>
              </View>
              <Text style={[styles.teamsCount, { color: colors.textPrimary }]}>
                <Text style={{ color: accent, fontWeight: '800' }}>
                  {tournoi.equipesInscrites}
                </Text>
                /{tournoi.maxEquipes}
              </Text>
            </View>

            <View style={[styles.progressBg, { backgroundColor: colors.borderHairline }]}>
              <View style={[styles.progressFill, { width: `${Math.round(fillPct * 100)}%` as any, backgroundColor: accent }]} />
            </View>

            <Text style={[styles.spotsText, { color: colors.textSecondary }]}>
              {tournoi.statut === 'ouvert' && spotsLeft > 0
                ? `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} disponible${spotsLeft > 1 ? 's' : ''}`
                : tournoi.statut === 'complet'
                ? 'Tournoi complet'
                : ''}
            </Text>
          </View>

          {/* ── Price ── */}
          <View style={[styles.priceSection, { backgroundColor: accentSoft, borderColor: colors.borderHairline }]}>
            <Trophy size={20} color={accent} strokeWidth={2} />
            <View style={styles.priceInfo}>
              <Text style={[styles.priceLine, { color: colors.textSecondary }]}>Inscription par équipe</Text>
              <Text style={[styles.priceValue, { color: accent }]}>{formatPrix(tournoi.prixInscription)}</Text>
            </View>
          </View>

          {/* ── Description ── */}
          {tournoi.description ? (
            <View style={styles.descSection}>
              <View style={styles.descHeader}>
                <Info size={15} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.descTitle, { color: colors.textSecondary }]}>À propos</Text>
              </View>
              <Text style={[styles.descText, { color: colors.textPrimary }]}>{tournoi.description}</Text>
            </View>
          ) : null}

          {/* Bottom padding for CTA */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Floating back button (outside ScrollView to avoid touch blocking) ── */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── Sticky CTA ── */}
      {canRegister && (
        <View style={[styles.ctaBar, { backgroundColor: colors.bgApp, borderTopColor: colors.borderHairline }]}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: accent }]}
            activeOpacity={0.85}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.ctaBtnText}>
              S'inscrire · {formatPrix(tournoi.prixInscription)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <InscriptionModal
        visible={modalVisible}
        tournoi={tournoi}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function InfoRow({
  icon, label, value, actionIcon,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  actionIcon?: React.ReactNode;
}) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconWrap}>{icon}</View>
      <View style={infoStyles.text}>
        <Text style={infoStyles.label} numberOfLines={1}>{label}</Text>
        <Text style={infoStyles.value} numberOfLines={2}>{value}</Text>
      </View>
      {actionIcon && <View style={infoStyles.action}>{actionIcon}</View>}
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[{ height: 0.5, backgroundColor: color, marginLeft: 46 }]} />;
}

