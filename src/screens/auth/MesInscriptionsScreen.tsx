// src/screens/auth/MesInscriptionsScreen.tsx
// The one combined "account" screen — signed-in email + logout up top,
// the user's tournament registrations below. No separate profile screen.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, UserRound, LogOut, Trophy, XCircle, Trash2 } from 'lucide-react-native';
import { RootStackParamList } from '../../types';
import { Inscription, InscriptionStatut } from '../../models/Inscription';
import { Tournoi } from '../../models/Tournoi';
import { getMyInscriptions, getTournoiById, cancelInscription } from '../../services/tournoiService';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';
import { sportColors } from '../../theme';
import ErrorState from '../../components/ErrorState';
import { makeStyles } from './MesInscriptionsScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'MesInscriptions'>;

const SPORT_EMOJI: Record<string, string> = {
  foot: '⚽', basket: '🏀', hand: '🤾', volley: '🏐',
};

const STATUT_LABEL: Record<InscriptionStatut, string> = {
  confirmée: 'Confirmée',
  en_attente_paiement: 'En attente',
  annulée: 'Annulée',
};
const STATUT_COLOR: Record<InscriptionStatut, string> = {
  confirmée: '#22c55e',
  en_attente_paiement: '#f59e0b',
  annulée: '#ef4444',
};

export default function MesInscriptionsScreen({ navigation }: Props) {
  const colors = useColors();
  const isDark = useThemeStore(s => s.isDark);
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const signOut = useAuthStore(s => s.signOut);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const styles = makeStyles(colors);

  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [tournois, setTournois] = useState<Record<string, Tournoi>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(false);
    try {
      const data = await getMyInscriptions(user.id);
      setInscriptions(data);
      const uniqueIds = [...new Set(data.map(i => i.tournoi_id))];
      const pairs = await Promise.all(
        uniqueIds.map(id => getTournoiById(id).then(t => [id, t] as const)),
      );
      const map: Record<string, Tournoi> = {};
      pairs.forEach(([id, t]) => { if (t) map[id] = t; });
      setTournois(map);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigation.replace('Login', { redirectToMesInscriptions: true });
      return;
    }
    load();
  }, [user, load, navigation]);

  async function handleLogout() {
    await signOut();
    navigation.goBack();
  }

  function handleCancel(item: Inscription) {
    const tournoi = tournois[item.tournoi_id];
    Alert.alert(
      'Annuler cette inscription ?',
      `${item.equipe_nom}${tournoi ? ` — ${tournoi.nom}` : ''}. Cette action est irréversible.`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler l\'inscription',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(item.id);
            try {
              await cancelInscription(item.id);
              await load();
            } catch {
              Alert.alert('Erreur', "Impossible d'annuler l'inscription. Réessayez.");
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer votre compte ?',
      'Cette action est définitive et irréversible. Vos inscriptions passées seront conservées de manière anonyme.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              navigation.goBack();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le compte pour le moment. Réessayez plus tard.');
            }
          },
        },
      ],
    );
  }

  if (!user) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgApp, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mes inscriptions</Text>
      </View>

      <View style={[styles.accountCard, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
        <View style={[styles.avatar, { backgroundColor: colors.userPosition }]}>
          <UserRound size={18} color="#fff" strokeWidth={2} />
        </View>
        <Text style={[styles.email, { color: colors.textPrimary }]} numberOfLines={1}>{user.email}</Text>
        <TouchableOpacity onPress={handleLogout} hitSlop={10} style={styles.logoutBtn}>
          <LogOut size={15} color={colors.textTertiary} strokeWidth={2} />
          <Text style={[styles.logoutText, { color: colors.textTertiary }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleDeleteAccount} hitSlop={8} style={styles.deleteAccountBtn}>
        <Trash2 size={12} color={colors.textDisabled} strokeWidth={2} />
        <Text style={[styles.deleteAccountText, { color: colors.textDisabled }]}>Supprimer mon compte</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.userPosition} />
      ) : error ? (
        <ErrorState
          title="Impossible de charger vos inscriptions"
          body="Vérifiez votre connexion internet et réessayez."
          onRetry={load}
        />
      ) : (
        <FlatList
          data={inscriptions}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.userPosition} />
          }
          renderItem={({ item }) => {
            const tournoi = tournois[item.tournoi_id];
            const canCancel = item.statut !== 'annulée';
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}
                activeOpacity={0.75}
                onPress={() => tournoi && navigation.navigate('TournoiDetail', { tournoiId: item.tournoi_id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.emoji}>{tournoi ? (SPORT_EMOJI[tournoi.sport] ?? '🏆') : '🏆'}</Text>
                  <Text style={[styles.tournoiNom, { color: colors.textPrimary }]} numberOfLines={1}>
                    {tournoi?.nom ?? 'Tournoi'}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {item.equipe_nom}
                  {tournoi ? `  ·  ${tournoi.dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                </Text>
                <View style={styles.cardBottom}>
                  <View style={[styles.statutBadge, { backgroundColor: STATUT_COLOR[item.statut] + '20' }]}>
                    <View style={[styles.statutDot, { backgroundColor: STATUT_COLOR[item.statut] }]} />
                    <Text style={[styles.statutText, { color: STATUT_COLOR[item.statut] }]}>
                      {STATUT_LABEL[item.statut]}
                    </Text>
                  </View>
                  {canCancel && (
                    <TouchableOpacity
                      onPress={() => handleCancel(item)}
                      disabled={cancellingId === item.id}
                      hitSlop={8}
                      style={styles.cancelBtn}
                    >
                      {cancellingId === item.id
                        ? <ActivityIndicator size="small" color={colors.textTertiary} />
                        : <>
                            <XCircle size={13} color={colors.textTertiary} strokeWidth={2} />
                            <Text style={[styles.cancelText, { color: colors.textTertiary }]}>Annuler</Text>
                          </>
                      }
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Trophy size={40} color={colors.textDisabled} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Vous n'avez pas encore d'inscription
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={[styles.emptyCta, { color: colors.userPosition }]}>Voir les tournois</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
