// src/screens/admin/AdminDashboardScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Trophy, Plus, LogOut, RefreshCw,
  CheckCircle, Clock, Users, TrendingUp, ChevronLeft,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminStackParamList } from '../../types';
import { Tournoi } from '../../models/Tournoi';
import { getTournois, formatPrix } from '../../services/tournoiService';
import { useAdminStore } from '../../stores/adminStore';
import { sportColors } from '../../theme';
import { useColors } from '../../hooks/useColors';
import DashboardStatCard from './components/DashboardStatCard';
import { styles } from './AdminDashboardScreen.styles';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminDashboard'>;

const SPORT_EMOJI: Record<string, string> = {
  foot: '⚽', basket: '🏀', hand: '🤾', volley: '🏐',
};

const STATUT_CONFIG = {
  ouvert:   { label: 'Ouvert',   bg: '#dcfce7', fg: '#16a34a' },
  complet:  { label: 'Complet',  bg: '#fee2e2', fg: '#dc2626' },
  en_cours: { label: 'En cours', bg: '#fef9c3', fg: '#ca8a04' },
  terminé:  { label: 'Terminé',  bg: '#f3f4f6', fg: '#6b7280' },
  annulé:   { label: 'Annulé',   bg: '#f3f4f6', fg: '#9ca3af' },
} as const;

export default function AdminDashboardScreen({ navigation }: Props) {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const logout   = useAdminStore(s => s.logout);

  const [tournois, setTournois]     = useState<Tournoi[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getTournois();
      setTournois(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const total      = tournois.length;
  const ouverts    = tournois.filter(t => t.statut === 'ouvert').length;
  const aVenir     = tournois.filter(t => t.dateDebut > new Date()).length;
  const totalInscrits = tournois.reduce((acc, t) => acc + t.equipesInscrites, 0);

  function handleLogout() {
    logout();
    navigation.getParent()?.navigate('MainTabs');
  }

  function handleBackToApp() {
    navigation.getParent()?.navigate('MainTabs');
  }

  function renderTournoiCard({ item }: { item: Tournoi }) {
    const accent  = sportColors[item.sport] ?? '#3b82f6';
    const statut  = STATUT_CONFIG[item.statut] ?? STATUT_CONFIG.ouvert;
    const pct     = item.maxEquipes > 0 ? item.equipesInscrites / item.maxEquipes : 0;
    const dateStr = item.dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('AdminTournoiDetail', { tournoiId: item.id })}
        activeOpacity={0.85}
      >
      <View style={[styles.tournoiCard, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        <View style={styles.tournoiBody}>
          {/* Header row */}
          <View style={styles.tournoiHeader}>
            <View style={[styles.sportBadge, { backgroundColor: accent + '20' }]}>
              <Text style={styles.sportEmoji}>{SPORT_EMOJI[item.sport] ?? '🏆'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.tournoiNom, { color: colors.textPrimary }]} numberOfLines={1}>{item.nom}</Text>
              <Text style={[styles.tournoiMeta, { color: colors.textTertiary }]}>
                📅 {dateStr}  ·  📍 {item.terrain_ville}
              </Text>
            </View>
            <View style={[styles.statutBadge, { backgroundColor: statut.bg }]}>
              <Text style={[styles.statutText, { color: statut.fg }]}>{statut.label}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>
              {item.equipesInscrites}/{item.maxEquipes} équipes
            </Text>
            <Text style={[styles.progressLabel, { color: accent, fontWeight: '700' }]}>
              {formatPrix(item.prixInscription)}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.bgApp }]}>
            <View style={[styles.progressFill, { backgroundColor: accent, width: `${Math.min(pct * 100, 100)}%` }]} />
          </View>
        </View>
      </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#302b63', '#0f0c29']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBackToApp} style={styles.backToAppBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronLeft size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            <Text style={styles.backToAppText}>Tournois</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerLabel}>Tableau de bord</Text>
            <Text style={styles.headerTitle}>Administration</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <LogOut size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <DashboardStatCard icon={<Trophy size={18} color="#a5b4fc" strokeWidth={2} />} value={total}         label="Tournois" />
          <DashboardStatCard icon={<CheckCircle size={18} color="#6ee7b7" strokeWidth={2} />} value={ouverts}  label="Ouverts" />
          <DashboardStatCard icon={<Clock size={18} color="#fcd34d" strokeWidth={2} />}    value={aVenir}      label="À venir" />
          <DashboardStatCard icon={<Users size={18} color="#f9a8d4" strokeWidth={2} />}    value={totalInscrits} label="Équipes" />
        </View>
      </LinearGradient>

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={tournois}
          keyExtractor={t => t.id}
          renderItem={renderTournoiCard}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#6366f1" />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: colors.textPrimary }]}>
                Mes tournois <Text style={{ color: colors.textTertiary }}>({total})</Text>
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AdminCreateTournoi')}
                style={styles.createBtn}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.createBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Plus size={15} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.createBtnText}>Créer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Trophy size={48} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                Aucun tournoi pour l'instant.{'\n'}Créez le premier !
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('AdminCreateTournoi')}
        activeOpacity={0.88}
      >
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.fabGrad}>
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}


