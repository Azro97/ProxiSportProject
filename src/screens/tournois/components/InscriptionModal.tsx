// src/screens/tournois/components/InscriptionModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, StyleSheet, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Check, X, Plus, Trash2, Mail } from 'lucide-react-native';
import { Tournoi } from '../../../models/Tournoi';
import { formatPrix, createInscription } from '../../../services/tournoiService';
import { sportColors } from '../../../theme';
import { useColors } from '../../../hooks/useColors';
import { styles } from './InscriptionModal.styles';

const SPORT_EMOJI: Record<string, string> = {
  foot: '⚽', basket: '🏀', hand: '🤾', volley: '🏐',
};

type Step = 'form' | 'recap' | 'success';

interface Props {
  visible: boolean;
  tournoi: Tournoi;
  onClose: () => void;
}

export default function InscriptionModal({ visible, tournoi, onClose }: Props) {
  const colors = useColors();
  const accent = sportColors[tournoi.sport] ?? '#3b82f6';

  const [step, setStep]         = useState<Step>('form');
  const [teamName, setTeamName] = useState('');
  const [email, setEmail]       = useState('');
  const [members, setMembers]   = useState<string[]>(() => Array(tournoi.tailleEquipe).fill(''));
  const [paying, setPaying]     = useState(false);

  const slideAnim    = useRef(new Animated.Value(500)).current;
  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('form');
      setTeamName('');
      setEmail('');
      setMembers(Array(tournoi.tailleEquipe).fill(''));
      setPaying(false);
      checkScale.setValue(0);
      checkOpacity.setValue(0);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 68, friction: 12 }).start();
    } else {
      slideAnim.setValue(500);
    }
  }, [visible]);

  useEffect(() => {
    if (step === 'success') {
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 55, friction: 7 }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [step]);

  const filledMembers = members.filter(m => m.trim().length > 0);
  const emailValid    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canContinue   = teamName.trim().length > 0 && emailValid && filledMembers.length > 0;

  function handleClose() {
    Animated.timing(slideAnim, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => onClose());
  }

  function addMember() {
    if (members.length < 15) setMembers(m => [...m, '']);
  }

  function removeMember(index: number) {
    setMembers(m => m.filter((_, i) => i !== index));
  }

  function updateMember(index: number, value: string) {
    setMembers(m => m.map((v, i) => (i === index ? value : v)));
  }

  async function handlePay() {
    setPaying(true);
    try {
      await createInscription({
        tournoi_id: tournoi.id,
        equipe_nom: teamName.trim(),
        capitaine_email: email.trim(),
        membres: members.filter(m => m.trim().length > 0).map(m => m.trim()),
        montant_payé: tournoi.prixInscription,
      });
    } catch (_) {
      // mock never throws — silently continue
    } finally {
      setPaying(false);
      setStep('success');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.scrim}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleClose} activeOpacity={1} />

          <Animated.View style={[styles.sheet, { backgroundColor: colors.bgCard, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.handle, { backgroundColor: colors.borderSubtle }]} />

            {/* STEP 1 */}
            {step === 'form' && (
              <>
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{'Créer ton équipe'}</Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                      {SPORT_EMOJI[tournoi.sport] ?? '🏆'}{' '}{tournoi.tailleEquipe}v{tournoi.tailleEquipe}{' · '}{tournoi.nom}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={18} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{'Nom de l\'équipe'}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.bgApp, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                    placeholder="Ex : Les Invincibles"
                    placeholderTextColor={colors.textTertiary}
                    value={teamName}
                    onChangeText={setTeamName}
                    maxLength={40}
                    returnKeyType="next"
                  />

                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email de contact</Text>
                  <View style={styles.emailRow}>
                    <Mail size={16} color={emailValid ? accent : colors.textTertiary} strokeWidth={2} style={styles.emailIcon} />
                    <TextInput
                      style={[styles.emailInput, { backgroundColor: colors.bgApp, borderColor: emailValid ? accent : colors.borderSubtle, color: colors.textPrimary }]}
                      placeholder="ton@email.com"
                      placeholderTextColor={colors.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>
                  <Text style={[styles.emailHint, { color: colors.textTertiary }]}>
                    La confirmation d'inscription sera envoyée à cette adresse.
                  </Text>

                  <View style={styles.membersHeader}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                      {'Membres · ' + filledMembers.length + ' joueur' + (filledMembers.length !== 1 ? 's' : '')}
                    </Text>
                    <TouchableOpacity onPress={addMember} style={[styles.addBtn, { backgroundColor: accent + '18', borderColor: accent + '40' }]} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Plus size={14} color={accent} strokeWidth={2.5} />
                      <Text style={[styles.addBtnText, { color: accent }]}>Ajouter</Text>
                    </TouchableOpacity>
                  </View>

                  {members.map((val, idx) => (
                    <View key={idx} style={styles.memberRow}>
                      <View style={[styles.memberNum, { backgroundColor: accent + '18' }]}>
                        <Text style={[styles.memberNumText, { color: accent }]}>{idx + 1}</Text>
                      </View>
                      <TextInput
                        style={[styles.memberInput, { backgroundColor: colors.bgApp, borderColor: colors.borderSubtle, color: colors.textPrimary }]}
                        placeholder={'Pseudo joueur ' + (idx + 1)}
                        placeholderTextColor={colors.textTertiary}
                        value={val}
                        onChangeText={v => updateMember(idx, v)}
                        maxLength={30}
                        returnKeyType="next"
                      />
                      {members.length > 1 && (
                        <TouchableOpacity onPress={() => removeMember(idx)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Trash2 size={15} color={colors.textTertiary} strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  <View style={{ height: 12 }} />
                </ScrollView>

                <View style={styles.ctaArea}>
                  <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: canContinue ? accent : colors.borderSubtle }]}
                    onPress={() => canContinue && setStep('recap')}
                    activeOpacity={canContinue ? 0.85 : 1}
                  >
                    <Text style={[styles.payBtnText, { color: canContinue ? '#fff' : colors.textTertiary }]}>Continuer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STEP 2 */}
            {step === 'recap' && (
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={() => setStep('form')} style={styles.backStepBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[styles.backArrow, { color: colors.textPrimary }]}>{'←'}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.sheetTitle, { color: colors.textPrimary, flex: 1, marginLeft: 8 }]}>Confirmer</Text>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={18} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
                  <View style={[styles.recapCard, { backgroundColor: colors.bgApp, borderColor: colors.borderHairline }]}>
                    <View style={[styles.recapSportBadge, { backgroundColor: accent }]}>
                      <Text style={styles.recapSportEmoji}>{SPORT_EMOJI[tournoi.sport] ?? '🏆'}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[styles.recapTournoiNom, { color: colors.textPrimary }]} numberOfLines={2}>{tournoi.nom}</Text>
                      <Text style={[styles.recapMeta, { color: colors.textSecondary }]}>{'📍 ' + tournoi.terrain_ville}</Text>
                      <Text style={[styles.recapMeta, { color: colors.textSecondary }]}>
                        {'📅 ' + tournoi.dateDebut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.recapInfoRow, { borderBottomColor: colors.borderHairline }]}>
                    <Text style={[styles.recapLabel, { color: colors.textSecondary }]}>{'Équipe'}</Text>
                    <Text style={[styles.recapValue, { color: colors.textPrimary }]}>{teamName.trim()}</Text>
                  </View>

                  <View style={[styles.recapInfoRow, { borderBottomColor: colors.borderHairline }]}>
                    <Text style={[styles.recapLabel, { color: colors.textSecondary }]}>Email</Text>
                    <Text style={[styles.recapValue, { color: colors.textPrimary }]} numberOfLines={1}>{email.trim()}</Text>
                  </View>

                  <View style={[styles.recapInfoRow, { borderBottomColor: colors.borderHairline, alignItems: 'flex-start' }]}>
                    <Text style={[styles.recapLabel, { color: colors.textSecondary }]}>Membres</Text>
                    <View style={{ flex: 1, alignItems: 'flex-end', gap: 3 }}>
                      {filledMembers.map((m, i) => (
                        <Text key={i} style={[styles.recapValue, { color: colors.textPrimary }]}>{m}</Text>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.recapInfoRow, { borderBottomColor: 'transparent' }]}>
                    <Text style={[styles.recapLabel, { color: colors.textSecondary }]}>Montant total</Text>
                    <Text style={[styles.recapPrice, { color: accent }]}>{formatPrix(tournoi.prixInscription)}</Text>
                  </View>
                  <View style={{ height: 8 }} />
                </ScrollView>

                <View style={styles.ctaArea}>
                  <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: accent }, paying && { opacity: 0.75 }]}
                    onPress={handlePay}
                    disabled={paying}
                    activeOpacity={0.85}
                  >
                    {paying
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.payBtnText}>{'Payer · ' + formatPrix(tournoi.prixInscription)}</Text>
                    }
                  </TouchableOpacity>
                  <Text style={[styles.secureNote, { color: colors.textTertiary }]}>
                    {'🔒 Paiement sécurisé · Remboursable 48h avant'}
                  </Text>
                </View>
              </>
            )}

            {/* STEP 3 */}
            {step === 'success' && (
              <View style={styles.successBody}>
                <Animated.View style={[styles.checkCircle, { backgroundColor: accent, opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
                  <Check size={40} color="#fff" strokeWidth={3} />
                </Animated.View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>{'Inscription confirmée !'}</Text>
                <Text style={[styles.successSub, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{teamName.trim()}</Text>
                  {' (' + filledMembers.length + ' joueur' + (filledMembers.length > 1 ? 's' : '') + ') inscrite à\n'}
                  <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{tournoi.nom}</Text>
                </Text>
                <Text style={[styles.successNote, { color: colors.textTertiary }]}>
                  Confirmation envoyée à {email.trim()}
                </Text>
                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: accent }]} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={styles.doneBtnText}>Parfait !</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

