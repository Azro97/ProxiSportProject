// src/screens/admin/AdminTournoiDetailScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowLeft, Users, Calendar, MapPin, Euro,
  CheckCircle2, Clock, XCircle,
  TrendingUp, Award, Shield,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminStackParamList } from '../../types';
import { Tournoi } from '../../models/Tournoi';
import { Inscription } from '../../models/Inscription';
import { getTournoiById, getInscriptionsByTournoi, formatPrix } from '../../services/tournoiService';
import { sportColors } from '../../theme';
import { useColors } from '../../hooks/useColors';
import TournoiStatCard from './components/TournoiStatCard';
import TimelineRow from './components/TimelineRow';
import TeamCard from './components/TeamCard';
import { styles } from './AdminTournoiDetailScreen.styles';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminTournoiDetail'>;

const SPORT_EMOJI: Record<string, string> = {
  foot: 'balle_de_football', basket: 'balle_de_basket', hand: 'handball', volley: 'volleyball',
};

const SPORT_EMOJI_DISPLAY: Record<string, string> = {
  foot: 'u26bd', basket: 'u1f3c0', hand: 'u1f93e', volley: 'u1f3d0',
};

const STATUT_CONFIG = {
  ouvert:   { label: 'Ouvert',   bg: '#dcfce7', fg: '#16a34a' },
  complet:  { label: 'Complet',  bg: '#fee2e2', fg: '#dc2626' },
  en_cours: { label: 'En cours', bg: '#fef9c3', fg: '#ca8a04' },
  'terminé':  { label: 'Terminé',  bg: '#f3f4f6', fg: '#6b7280' },
  'annulé':   { label: 'Annulé',   bg: '#f3f4f6', fg: '#9ca3af' },
} as const;

const SPORT_EMOJI_MAP: Record<string, string> = {
  foot: '\u26bd', basket: '\u1f3c0', hand: '\u1f93e', volley: '\u1f3d0',
};

export default function AdminTournoiDetailScreen({ navigation, route }: Props) {
  const { tournoiId } = route.params;
  const colors  = useColors();
  const insets  = useSafeAreaInsets();

  const [tournoi, setTournoi]           = useState<Tournoi | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading]           = useState(true);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, ins] = await Promise.all([
        getTournoiById(tournoiId),
        getInscriptionsByTournoi(tournoiId),
      ]);
      setTournoi(t);
      setInscriptions(ins);
    } finally {
      setLoading(false);
    }
  }, [tournoiId]);

  useEffect(() => { load(); }, [load]);

  if (loading || !tournoi) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgApp }]}>
        <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
      </View>
    );
  }

  const accent     = sportColors[tournoi.sport] ?? '#3b82f6';
  const statut     = (STATUT_CONFIG as any)[tournoi.statut] ?? STATUT_CONFIG.ouvert;
  const pct        = tournoi.maxEquipes > 0 ? tournoi.equipesInscrites / tournoi.maxEquipes : 0;
  const emoji      = SPORT_EMOJI_MAP[tournoi.sport] ?? '\u26bd';
  const confirmed  = inscriptions.filter(i => i.statut === 'confirmée').length;
  const pending    = inscriptions.filter(i => i.statut === 'en_attente_paiement').length;
  const totalRevenue = inscriptions
    .filter(i => i.statut === 'confirmée' && i.montant_payé)
    .reduce((acc, i) => acc + (i.montant_payé ?? 0), 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bgApp }]}>
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Hero gradient ── */}
        <View style={styles.heroWrap}>
          <LinearGradient colors={[accent, accent + 'cc']} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.heroContent}>
              <View style={[styles.heroEmojiBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.heroEmoji}>{emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroNom}>{tournoi.nom}</Text>
                <Text style={styles.heroMeta}>{tournoi.terrain_nom} · {tournoi.terrain_ville}</Text>
              </View>
            </View>

            <View style={styles.heroFooter}>
              <View style={[styles.statutPill, { backgroundColor: statut.bg }]}>
                <Text style={[styles.statutPillText, { color: statut.fg }]}>{statut.label}</Text>
              </View>
              <Text style={styles.heroOrg}>par {tournoi.organisateur_nom}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          <TournoiStatCard
            icon={<Users size={18} color={accent} strokeWidth={2} />}
            value={`${tournoi.equipesInscrites}/${tournoi.maxEquipes}`}
            label="Equipes"
            accent={accent}
            colors={colors}
          />
          <TournoiStatCard
            icon={<CheckCircle2 size={18} color="#16a34a" strokeWidth={2} />}
            value={`${confirmed}`}
            label="Confirmees"
            accent="#16a34a"
            colors={colors}
          />
          <TournoiStatCard
            icon={<Clock size={18} color="#d97706" strokeWidth={2} />}
            value={`${pending}`}
            label="En attente"
            accent="#d97706"
            colors={colors}
          />
          <TournoiStatCard
            icon={<Euro size={18} color="#6366f1" strokeWidth={2} />}
            value={formatPrix(totalRevenue)}
            label="Revenus"
            accent="#6366f1"
            colors={colors}
          />
        </View>

        {/* ── Fill card ── */}
        <View style={[styles.fillCard, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
          <View style={styles.fillRow}>
            <Text style={[styles.fillLabel, { color: colors.textPrimary }]}>Remplissage</Text>
            <Text style={[styles.fillPct, { color: accent }]}>{Math.round(pct * 100)}%</Text>
          </View>
          <View style={[styles.fillTrack, { backgroundColor: colors.bgApp }]}>
            <View style={[styles.fillFill, { backgroundColor: accent, width: `${Math.round(pct * 100)}%` }]} />
          </View>
          <View style={styles.fillSubRow}>
            <Text style={[styles.fillSub, { color: colors.textTertiary }]}>{tournoi.equipesInscrites} inscrites</Text>
            <Text style={[styles.fillSub, { color: colors.textTertiary }]}>{tournoi.maxEquipes - tournoi.equipesInscrites} places restantes</Text>
            <Text style={[styles.fillSub, { color: colors.textTertiary }]}>{tournoi.tailleEquipe}v{tournoi.tailleEquipe}</Text>
          </View>
        </View>

        {/* ── Timeline ── */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Calendrier</Text>
        <View style={[styles.timelineCard, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
          <TimelineRow
            label="Cloture inscriptions"
            date={tournoi.dateClotureInscription.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            badge="Cloture"
            badgeColor="#d97706"
            colors={colors}
          />
          <TimelineRow
            label="Debut"
            date={tournoi.dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            badge="Debut"
            badgeColor={accent}
            colors={colors}
          />
          <TimelineRow
            label="Fin"
            date={tournoi.dateFin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            badge="Fin"
            badgeColor="#6b7280"
            colors={colors}
            isLast
          />
        </View>

        {/* ── Details ── */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Informations</Text>
        <View style={[styles.fillCard, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
          <View style={styles.fillSubRow}>
            <View style={{ gap: 4 }}>
              <Text style={[styles.fillSub, { color: colors.textTertiary }]}>Prix inscription</Text>
              <Text style={[styles.fillLabel, { color: colors.textPrimary }]}>{formatPrix(tournoi.prixInscription)}</Text>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={[styles.fillSub, { color: colors.textTertiary }]}>Region</Text>
              <Text style={[styles.fillLabel, { color: colors.textPrimary }]}>{tournoi.region}</Text>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={[styles.fillSub, { color: colors.textTertiary }]}>Departement</Text>
              <Text style={[styles.fillLabel, { color: colors.textPrimary }]}>{tournoi.departement}</Text>
            </View>
          </View>
        </View>

        {/* ── Teams ── */}
        <View style={styles.teamsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginHorizontal: 0, marginTop: 0, marginBottom: 0 }]}>
            Equipes inscrites
          </Text>
          <View style={[styles.countBadge, { backgroundColor: accent + '20' }]}>
            <Text style={[styles.countBadgeText, { color: accent }]}>{inscriptions.length}</Text>
          </View>
        </View>

        {inscriptions.length === 0 ? (
          <View style={[styles.emptyTeams, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
            <Users size={32} color={colors.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyTeamsText, { color: colors.textTertiary }]}>Aucune equipe inscrite</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {inscriptions.map((insc, idx) => (
              <TeamCard
                key={insc.id}
                inscription={insc}
                index={idx}
                expanded={expandedId === insc.id}
                onToggle={() => setExpandedId(expandedId === insc.id ? null : insc.id)}
                accent={accent}
                colors={colors}
              />
            ))}
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}
