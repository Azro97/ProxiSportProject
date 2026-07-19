// src/screens/admin/AdminCreateTournoiScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Modal, FlatList,
  TouchableOpacity, TouchableWithoutFeedback, StatusBar, ActivityIndicator,
  Animated, KeyboardAvoidingView, Keyboard, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Check } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminStackParamList } from '../../types';
import { createTournoi } from '../../services/tournoiService';
import { getRegions, getDepartements } from '../../services/matchsService';
import { sportColors } from '../../theme';
import { useColors } from '../../hooks/useColors';
import SectionTitle from '../../components/SectionTitle';
import FormField from '../../components/FormField';
import DatePickerButton from '../../components/DatePickerButton';
import ModalPickerField from '../../components/ModalPickerField';
import { styles } from './AdminCreateTournoiScreen.styles';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminCreateTournoi'>;

const SPORTS = [
  { key: 'basket', emoji: '🏀', label: 'Basket' },
  { key: 'hand',   emoji: '🤾', label: 'Handball' },
  { key: 'volley', emoji: '🏐', label: 'Volley' },
] as const;

const TAILLE_OPTIONS: Record<string, number[]> = {
  foot:   [5, 7, 11],
  basket: [3, 5],
  hand:   [7],
  volley: [2, 3, 4, 6],
};

const DEFAULT_TAILLE: Record<string, number> = {
  foot: 5, basket: 3, hand: 7, volley: 6,
};

const SPORT_PHOTOS: Record<string, string> = {
  foot:   'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=900&auto=format',
  basket: 'https://images.unsplash.com/photo-1546519638391-bb197d0bc7f5?w=900&auto=format',
  hand:   'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=900&auto=format',
  volley: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=900&auto=format',
};

export default function AdminCreateTournoiScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2>(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Step 1 fields
  const [sport, setSport]         = useState<string>('foot');
  const [nom, setNom]             = useState('');
  const [description, setDesc]    = useState('');
  const [ville, setVille]         = useState('');
  const [terrainNom, setTerrain]  = useState('');
  const [regions, setRegions]     = useState<string[]>([]);
  const [departements, setDepartements] = useState<string[]>([]);
  const [region, setRegion]       = useState('');
  const [dept, setDept]           = useState('');

  useEffect(() => {
    let alive = true;
    getRegions().then(list => {
      if (!alive) return;
      setRegions(list);
      setRegion(prev => prev || list[0] || '');
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!region) return;
    let alive = true;
    getDepartements(region).then(list => {
      if (!alive) return;
      setDepartements(list);
      setDept(prev => (list.includes(prev) ? prev : list[0] ?? ''));
    });
    return () => { alive = false; };
  }, [region]);

  // Step 2 fields
  const [dateDebut, setDateDebut]   = useState<Date | null>(null);
  const [dateFin, setDateFin]       = useState<Date | null>(null);
  const [dateCloture, setDateClo]   = useState<Date | null>(null);
  const [activeDateField, setActiveDateField] = useState<'debut' | 'fin' | 'cloture' | null>(null);
  const [prix, setPrix]             = useState('');
  const [tailleEquipe, setTaille]   = useState(5);
  const [maxEquipes, setMaxEq]      = useState(8);

  // Modal pickers for region/dept
  const [modalPicker, setModalPicker] = useState<'region' | 'dept' | null>(null);

  const [saving, setSaving]  = useState(false);
  const [errors, setErrors]  = useState<Record<string, string>>({});

  const accent = sportColors[sport] ?? '#3b82f6';

  function handleSportChange(s: string) {
    setSport(s);
    setTaille(DEFAULT_TAILLE[s] ?? 5);
  }

  function goToStep2() {
    const errs: Record<string, string> = {};
    if (!nom.trim())       errs.nom       = 'Nom requis';
    if (!description.trim()) errs.desc    = 'Description requise';
    if (!ville.trim())     errs.ville     = 'Ville requise';
    if (!terrainNom.trim()) errs.terrain  = 'Terrain requis';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(2);
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }).start();
  }

  function goBack() {
    if (step === 2) {
      setStep(1);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }).start();
    } else {
      navigation.goBack();
    }
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    const prixCents = Math.round(parseFloat(prix.replace(',', '.') || '0') * 100);

    if (!dateDebut)   errs.dateDebut   = 'Choisissez une date de début';
    if (!dateFin)     errs.dateFin     = 'Choisissez une date de fin';
    if (!dateCloture) errs.dateCloture = 'Choisissez une date de clôture';
    if (dateDebut && dateFin && dateFin < dateDebut) errs.dateFin = 'La fin doit être après le début';
    if (isNaN(prixCents) || prixCents < 0) errs.prix  = 'Prix invalide';

    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      await createTournoi({
        nom:                    nom.trim(),
        sport,
        description:            description.trim(),
        photoUrl:               SPORT_PHOTOS[sport],
        terrain_id:             'custom_' + Date.now(),
        terrain_nom:            terrainNom.trim(),
        terrain_ville:          ville.trim(),
        organisateur_id:        'admin',
        organisateur_nom:       'Admin ProxiSport',
        dateDebut:              dateDebut!,
        dateFin:                dateFin!,
        dateClotureInscription: dateCloture!,
        prixInscription:        prixCents,
        maxEquipes,
        tailleEquipe,
        statut:                 'ouvert',
        region,
        departement:            dept,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  const progressPct = step === 1 ? 0.5 : 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#302b63', '#0f0c29']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Créer un tournoi</Text>
            <Text style={styles.headerStep}>Étape {step}/2</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[
            styles.progressFill,
            {
              backgroundColor: accent,
              width: `${progressPct * 100}%`,
            },
          ]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progLabel, step === 1 && { color: '#fff', fontWeight: '700' }]}>Infos</Text>
          <Text style={[styles.progLabel, step === 2 && { color: '#fff', fontWeight: '700' }]}>Dates & Format</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {step === 1 ? (
            <>
              {/* Sport selector */}
              <SectionTitle title="Sport" />
              <View style={styles.sportRow}>
                {SPORTS.map(s => {
                  const active = sport === s.key;
                  const c = sportColors[s.key];
                  return (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => handleSportChange(s.key)}
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

              {/* Nom */}
              <SectionTitle title="Nom du tournoi" />
              <FormField
                value={nom} onChangeText={setNom}
                placeholder="Ex : Open d'Été Paris 2026"
                error={errors.nom} colors={colors}
                maxLength={60}
              />

              {/* Description */}
              <SectionTitle title="Description" />
              <FormField
                value={description} onChangeText={setDesc}
                placeholder="Décrivez le tournoi, les règles, les prix…"
                error={errors.desc} colors={colors}
                multiline numberOfLines={4}
                style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
              />

              {/* Région */}
              <SectionTitle title="Région" />
              <ModalPickerField
                value={region}
                onPress={() => setModalPicker('region')}
                colors={colors}
              />

              {/* Département */}
              <SectionTitle title="Département" />
              <ModalPickerField
                value={dept}
                onPress={() => setModalPicker('dept')}
                colors={colors}
              />

              {/* Ville */}
              <SectionTitle title="Ville" />
              <FormField
                value={ville} onChangeText={setVille}
                placeholder="Ex : Paris"
                error={errors.ville} colors={colors}
              />

              {/* Terrain */}
              <SectionTitle title="Nom du terrain / stade" />
              <FormField
                value={terrainNom} onChangeText={setTerrain}
                placeholder="Ex : Stade Charléty"
                error={errors.terrain} colors={colors}
              />

              <TouchableOpacity onPress={goToStep2} style={styles.ctaWrap} activeOpacity={0.85}>
                <LinearGradient
                  colors={[accent, accent + 'cc']}
                  style={styles.ctaBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.ctaText}>Étape suivante →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Dates */}
              <SectionTitle title="Date de début" />
              <DatePickerButton
                date={dateDebut}
                onPress={() => setActiveDateField('debut')}
                error={errors.dateDebut}
                colors={colors}
                accent={accent}
              />

              <SectionTitle title="Date de fin" />
              <DatePickerButton
                date={dateFin}
                onPress={() => setActiveDateField('fin')}
                error={errors.dateFin}
                colors={colors}
                accent={accent}
              />

              <SectionTitle title="Clôture des inscriptions" />
              <DatePickerButton
                date={dateCloture}
                onPress={() => setActiveDateField('cloture')}
                error={errors.dateCloture}
                colors={colors}
                accent={accent}
              />

              {/* DateTimePicker natif Android */}
              {activeDateField !== null && (
                <DateTimePicker
                  value={
                    activeDateField === 'debut' ? (dateDebut ?? new Date()) :
                    activeDateField === 'fin'   ? (dateFin   ?? dateDebut ?? new Date()) :
                    (dateCloture ?? new Date())
                  }
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(_evt: any, selected?: Date) => {
                    setActiveDateField(null);
                    if (!selected) return;
                    if (activeDateField === 'debut')  setDateDebut(selected);
                    if (activeDateField === 'fin')    setDateFin(selected);
                    if (activeDateField === 'cloture') setDateClo(selected);
                  }}
                />
              )}

              {/* Prix */}
              <SectionTitle title="Prix d'inscription (€ par équipe)" />
              <FormField
                value={prix} onChangeText={setPrix}
                placeholder="Ex : 30  (mettre 0 pour gratuit)"
                error={errors.prix} colors={colors}
                keyboardType="decimal-pad"
              />

              {/* Taille équipe */}
              <SectionTitle title="Joueurs par équipe" />
              <View style={styles.pillRow}>
                {(TAILLE_OPTIONS[sport] ?? [5]).map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setTaille(n)}
                    style={[
                      styles.taillePill,
                      { backgroundColor: tailleEquipe === n ? accent : colors.bgCard, borderColor: tailleEquipe === n ? accent : colors.borderSubtle },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.taillePillText, { color: tailleEquipe === n ? '#fff' : colors.textSecondary }]}>{n}v{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Max équipes */}
              <SectionTitle title="Nombre maximum d'équipes" />
              <View style={[styles.stepperRow, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}>
                <TouchableOpacity
                  onPress={() => setMaxEq(e => Math.max(2, e - 2))}
                  style={[styles.stepperBtn, { backgroundColor: colors.bgApp }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.stepperIcon, { color: colors.textPrimary }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.textPrimary }]}>{maxEquipes}</Text>
                <TouchableOpacity
                  onPress={() => setMaxEq(e => Math.min(64, e + 2))}
                  style={[styles.stepperBtn, { backgroundColor: colors.bgApp }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.stepperIcon, { color: colors.textPrimary }]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Preview card */}
              <View style={[styles.previewCard, { backgroundColor: colors.bgCard, borderColor: accent + '40' }]}>
                <View style={[styles.previewBadge, { backgroundColor: accent }]}>
                  <Text style={styles.previewEmoji}>
                    {SPORTS.find(s => s.key === sport)?.emoji ?? '🏆'}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 3, marginLeft: 12 }}>
                  <Text style={[styles.previewNom, { color: colors.textPrimary }]} numberOfLines={1}>{nom || 'Nom du tournoi'}</Text>
                  <Text style={[styles.previewMeta, { color: colors.textSecondary }]}>
                    {tailleEquipe}v{tailleEquipe}  ·  max {maxEquipes} équipes  ·  {ville || '?'}
                  </Text>
                  <Text style={[styles.previewMeta, { color: accent, fontWeight: '700' }]}>
                    {prix ? (parseFloat(prix) === 0 ? 'Gratuit' : prix + ' €/équipe') : 'Prix non défini'}
                  </Text>
                </View>
              </View>

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
                        <Text style={styles.ctaText}>Publier le tournoi</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal picker région / département */}
      <Modal
        visible={modalPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalPicker(null)}
      >
        <TouchableOpacity
          style={styles.mpOverlay}
          activeOpacity={1}
          onPress={() => setModalPicker(null)}
        />
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
                    if (modalPicker === 'region') {
                      setRegion(item);
                    } else {
                      setDept(item);
                    }
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

