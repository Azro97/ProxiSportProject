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
import { sportColors, sportColorsSoft } from '../../theme';

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

  const [tournoi, setTournoi] = useState<Tournoi | null>(null);
  const [loading, setLoading] = useState(true);

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
            />

            {/* Back button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>

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

      {/* ── Sticky CTA ── */}
      {canRegister && (
        <View style={[styles.ctaBar, { backgroundColor: colors.bgApp, borderTopColor: colors.borderHairline }]}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: accent }]}
            activeOpacity={0.85}
            onPress={() => {
              // TODO: hook up payment / inscription flow
            }}
          >
            <Text style={styles.ctaBtnText}>
              S'inscrire · {formatPrix(tournoi.prixInscription)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: color, marginLeft: 46 }]} />;
}

const infoStyles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  iconWrap:{ width: 30, marginRight: 8 },
  text:    { flex: 1 },
  label:   { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  value:   { fontSize: 14, fontWeight: '600', color: '#111827' },
  action:  { marginLeft: 8 },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:    { flexGrow: 1 },
  notFound:  { fontSize: 16 },

  hero:      { height: 300 },
  heroImage: { flex: 1, justifyContent: 'space-between' },
  backBtn:   {
    position: 'absolute', top: 52, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: { padding: 16, gap: 6 },
  sportBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sportEmoji: { fontSize: 13 },
  sportLabel: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  heroTitle:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.2, lineHeight: 32 },
  heroOrga:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  infoGrid: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },

  section: {
    padding: 16, borderRadius: 16, gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  teamsHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamsLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamsCount:   { fontSize: 18, fontWeight: '700' },
  progressBg:   { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  spotsText:    { fontSize: 12 },

  priceSection: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  priceInfo:  { flex: 1 },
  priceLine:  { fontSize: 12 },
  priceValue: { fontSize: 26, fontWeight: '900' },

  descSection: { gap: 8 },
  descHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  descTitle:   { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  descText:    { fontSize: 15, lineHeight: 23 },

  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});
