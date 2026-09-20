// src/screens/admin/AdminCreateEquipeScreen.tsx
// Admin-only, single-step. Team creation is deliberately kept out of the
// consumer app (ClassementsScreen only searches/views) — equipes are the
// teams real scheduled league matches reference, so a normal user must never
// be able to spin one up themselves. See policies.sql's "public insert" on
// equipes for the same client-side-gate trust model as tournoi creation.

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Modal, FlatList,
  TouchableOpacity, TouchableWithoutFeedback, StatusBar, ActivityIndicator,
  KeyboardAvoidingView, Keyboard, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Check } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminStackParamList } from '../../types';
import { createEquipe } from '../../services/equipesService';
import { getRegions, getDepartements } from '../../services/matchsService';
import { sportColors } from '../../theme';
import { useColors } from '../../hooks/useColors';
import SectionTitle from '../../components/SectionTitle';
import FormField from '../../components/FormField';
import ModalPickerField from '../../components/ModalPickerField';
import { styles } from './AdminCreateTournoiScreen.styles';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminCreateEquipe'>;

const SPORTS = [
  { key: 'foot',   emoji: '⚽', label: 'Football' },
  { key: 'basket', emoji: '🏀', label: 'Basket' },
  { key: 'hand',   emoji: '🤾', label: 'Handball' },
  { key: 'volley', emoji: '🏐', label: 'Volley' },
] as const;

export default function AdminCreateEquipeScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [sport, setSport] = useState<string>('foot');
  const [nom, setNom]     = useState('');
  const [regions, setRegions]           = useState<string[]>([]);
  const [departements, setDepartements] = useState<string[]>([]);
  const [region, setRegion] = useState('');
  const [dept, setDept]     = useState('');
  const [regionsError, setRegionsError]         = useState(false);
  const [departementsError, setDepartementsError] = useState(false);

  const [modalPicker, setModalPicker] = useState<'region' | 'dept' | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accent = sportColors[sport] ?? '#3b82f6';

  useEffect(() => {
    let alive = true;
    getRegions().then(list => {
      if (!alive) return;
      setRegions(list);
      setRegion(prev => prev || list[0] || '');
    }).catch(() => { if (alive) setRegionsError(true); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!region) return;
    let alive = true;
    getDepartements(region).then(list => {
      if (!alive) return;
      setDepartements(list);
      setDept(prev => (list.includes(prev) ? prev : list[0] ?? ''));
    }).catch(() => { if (alive) setDepartementsError(true); });
    return () => { alive = false; };
  }, [region]);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!nom.trim()) errs.nom = 'Nom requis';
    if (!region) errs.region = 'Région requise';
    if (!dept) errs.dept = 'Département requis';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setSaving(true);
    try {
      await createEquipe({ nom: nom.trim(), sport, region, departement: dept });
      navigation.goBack();
    } catch {
      setErrors(prev => ({ ...prev, submit: "Échec de la création de l'équipe. Vérifiez votre connexion et réessayez." }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#302b63', '#0f0c29']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Créer une équipe</Text>
            <Text style={styles.headerStep}>Équipe officielle — apparaît dans la recherche</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
              <SectionTitle title="Sport" />
              <View style={styles.sportRow}>
                {SPORTS.map(s => {
                  const active = sport === s.key;
                  const c = sportColors[s.key];
                  return (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => setSport(s.key)}
                      style={[
                        styles.sportChip,
                        { backgroundColor: active ? c : colors.bgCard, borderColor: active ? c : colors.borderSubtle },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sportEmoji}>{s.emoji}</Text>
                      <Text style={[styles.sportLabel, { color: active ? '#fff' : colors.textSecondary }]}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <SectionTitle title="Nom de l'équipe" />
              <FormField
                value={nom} onChangeText={setNom}
                placeholder="Ex : Paris FC"
                error={errors.nom} colors={colors}
                maxLength={60}
              />

              <SectionTitle title="Région" />
              {regionsError ? (
                <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                  Impossible de charger les régions.
                </Text>
              ) : (
                <ModalPickerField value={region} onPress={() => setModalPicker('region')} colors={colors} />
              )}

              <SectionTitle title="Département" />
              {departementsError ? (
                <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>
                  Impossible de charger les départements.
                </Text>
              ) : (
                <ModalPickerField value={dept} onPress={() => setModalPicker('dept')} colors={colors} />
              )}

              {errors.submit ? (
                <Text style={{ fontSize: 12, color: '#ef4444', marginBottom: 10, textAlign: 'center' }}>
                  {errors.submit}
                </Text>
              ) : null}

              <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.ctaWrap} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.ctaBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Check size={18} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.ctaText}>{errors.submit ? 'Réessayer' : "Créer l'équipe"}</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalPicker !== null} transparent animationType="slide" onRequestClose={() => setModalPicker(null)}>
        <TouchableOpacity style={styles.mpOverlay} activeOpacity={1} onPress={() => setModalPicker(null)} />
        <View style={[styles.mpSheet, { backgroundColor: colors.bgCard }]}>
          <View style={[styles.mpHandle, { backgroundColor: colors.borderSubtle }]} />
          <Text style={[styles.mpSheetTitle, { color: colors.textPrimary }]}>
            {modalPicker === 'region' ? 'Choisir une région' : 'Choisir un département'}
          </Text>
          <FlatList
            data={modalPicker === 'region' ? regions : departements}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const selected = modalPicker === 'region' ? item === region : item === dept;
              return (
                <TouchableOpacity
                  style={[styles.mpOption, selected && { backgroundColor: colors.bgApp }]}
                  onPress={() => {
                    if (modalPicker === 'region') setRegion(item);
                    else setDept(item);
                    setModalPicker(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.mpOptionText, { color: selected ? '#6366f1' : colors.textPrimary }]}>{item}</Text>
                  {selected && <Check size={16} color="#6366f1" strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
