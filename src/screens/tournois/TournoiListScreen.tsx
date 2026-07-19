// src/screens/tournois/TournoiListScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList,
  ActivityIndicator, TouchableOpacity, StatusBar,
  RefreshControl, ScrollView,
} from 'react-native';
import { Trophy, Shield } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, BottomTabParamList } from '../../types';
import { Tournoi } from '../../models/Tournoi';
import { getTournois } from '../../services/tournoiService';
import { useColors } from '../../hooks/useColors';
import { styles } from './TournoiListScreen.styles';
import TournoiCard from './components/TournoiCard';

type Props = CompositeScreenProps<
  BottomTabScreenProps<BottomTabParamList, 'Tournois'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SPORTS = [
  { key: null,       label: 'Tous' },
  { key: 'foot',     label: '⚽ Foot' },
  { key: 'basket',   label: '🏀 Basket' },
  { key: 'hand',     label: '🤾 Hand' },
  { key: 'volley',   label: '🏐 Volley' },
];

const STATUTS = [
  { key: null,       label: 'Tous' },
  { key: 'ouvert',   label: 'Ouverts' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'complet',  label: 'Complets' },
  { key: 'terminé',  label: 'Terminés' },
];

export default function TournoiListScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [allTournois, setAllTournois]   = useState<Tournoi[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [sportFilter, setSportFilter]   = useState<string | null>(null);
  const [statutFilter, setStatutFilter] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getTournois();
      setAllTournois(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = allTournois.filter(t => {
    if (sportFilter  && t.sport   !== sportFilter)  return false;
    if (statutFilter && t.statut  !== statutFilter) return false;
    return true;
  });

  function FilterPills<T extends string | null>({
    options, selected, onSelect,
  }: {
    options: { key: T; label: string }[];
    selected: T;
    onSelect: (k: T) => void;
  }) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
      >
        {options.map((opt, index) => {
          const active = opt.key === selected;
          return (
            <TouchableOpacity
              key={String(opt.key)}
              onPress={() => onSelect(opt.key)}
              style={[
                styles.pill,
                active
                  ? { backgroundColor: colors.userPosition }
                  : { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderHairline },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, { color: active ? '#fff' : colors.textSecondary }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.borderHairline, paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTitle}>
          <Trophy size={22} color={colors.userPosition} strokeWidth={2} />
          <Text style={[styles.headerText, { color: colors.textPrimary }]}>Tournois</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {!loading && (
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {displayed.length} tournoi{displayed.length !== 1 ? 's' : ''}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminLogin')}
            style={[styles.adminBtn, { backgroundColor: colors.bgApp, borderColor: colors.borderSubtle }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Shield size={15} color={colors.textTertiary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filtersArea, { backgroundColor: colors.bgApp }]}>
        <FilterPills options={SPORTS as any} selected={sportFilter} onSelect={setSportFilter} />
        <FilterPills options={STATUTS as any} selected={statutFilter} onSelect={setStatutFilter} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.userPosition} />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TournoiCard
              tournoi={item}
              onPress={() =>
                (navigation as any).navigate('TournoiDetail', { tournoiId: item.id })
              }
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.userPosition}
              colors={[colors.userPosition]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun tournoi trouvé
              </Text>
              <TouchableOpacity
                onPress={() => { setSportFilter(null); setStatutFilter(null); }}
              >
                <Text style={[styles.emptyReset, { color: colors.userPosition }]}>
                  Réinitialiser les filtres
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
