// src/screens/tournois/components/InscriptionModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, StyleSheet, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Check, X, Plus, Trash2, Mail, LogIn, UserPlus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStripe } from '@stripe/stripe-react-native';
import { RootStackParamList } from '../../../types';
import { Tournoi } from '../../../models/Tournoi';
import { formatPrix, createInscription } from '../../../services/tournoiService';
import { createPaymentIntent, type CreatePaymentIntentResult } from '../../../services/paymentService';
import { useAuthStore } from '../../../stores/authStore';
import { sportColors } from '../../../theme';
import { useColors } from '../../../hooks/useColors';
import { styles } from './InscriptionModal.styles';
import ErrorState from '../../../components/ErrorState';

const SPORT_EMOJI: Record<string, string> = {
  foot: '⚽', basket: '🏀', hand: '🤾', volley: '🏐',
};

type Step = 'choice' | 'form' | 'recap' | 'success' | 'error';

interface Props {
  visible: boolean;
  tournoi: Tournoi;
  onClose: () => void;
  /** Closes the modal and navigates to Login/SignUp — arms a reopen-on-return in the parent screen. */
  onRequestAuth?: () => void;
}

export default function InscriptionModal({ visible, tournoi, onClose, onRequestAuth }: Props) {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAuthStore(s => s.user);
  const accent = sportColors[tournoi.sport] ?? '#3b82f6';
  const isFree = tournoi.prixInscription === 0;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [step, setStep]         = useState<Step>(user ? 'form' : 'choice');
  const [teamName, setTeamName] = useState('');
  const [email, setEmail]       = useState(user?.email ?? '');
  const [members, setMembers]   = useState<string[]>(() => Array(tournoi.tailleEquipe).fill(''));
  const [paying, setPaying]     = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<CreatePaymentIntentResult | null>(null);

  const slideAnim    = useRef(new Animated.Value(500)).current;
  const checkScale   = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(user ? 'form' : 'choice');
      setTeamName('');
      setEmail(user?.email ?? '');
      setMembers(Array(tournoi.tailleEquipe).fill(''));
      setPaying(false);
      setErrorMessage(null);
      setPaymentIntent(null);
      checkScale.setValue(0);
      checkOpacity.setValue(0);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 68, friction: 12 }).start();
    } else {
      slideAnim.setValue(500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function goAuth(route: 'Login' | 'SignUp') {
    (onRequestAuth ?? onClose)();
    navigation.navigate(route, { redirectToMesInscriptions: false });
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
    const membresTrimmed = members.filter(m => m.trim().length > 0).map(m => m.trim());

    if (isFree) {
      setPaying(true);
      try {
        await createInscription({
          tournoi_id: tournoi.id,
          equipe_nom: teamName.trim(),
          capitaine_email: email.trim(),
          membres: membresTrimmed,
          montant_payé: 0,
        });
        setStep('success');
      } catch {
        setErrorMessage(null);
        setStep('error');
      } finally {
        setPaying(false);
      }
      return;
    }

    // Paid tournoi — Stripe flow. Confirmation is webhook-driven server-side
    // (see supabase/functions/stripe-webhook) — success here means the charge
    // went through, not that the row is flipped to 'confirmée' yet.
    setPaying(true);
    try {
      let intent = paymentIntent;
      if (!intent) {
        intent = await createPaymentIntent({
          tournoi_id: tournoi.id,
          equipe_nom: teamName.trim(),
          capitaine_email: email.trim(),
          membres: membresTrimmed,
        });
        setPaymentIntent(intent);
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'ProxiSport',
        paymentIntentClientSecret: intent.clientSecret,
        defaultBillingDetails: { email: email.trim() },
        appearance: { colors: { primary: accent } },
      });
      if (initError) throw initError;

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          // User closed the sheet themselves — not a failure, stay on 'recap'.
          return;
        }
        setErrorMessage(
          "Votre carte a été refusée ou le paiement n'a pas abouti. Vérifiez vos informations et réessayez, ou utilisez un autre moyen de paiement.",
        );
        setStep('error');
        return;
      }

      setStep('success');
    } catch {
      setErrorMessage('Vérifiez votre connexion internet et réessayez. Aucun paiement n\'a été débité.');
      setStep('error');
    } finally {
      setPaying(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.scrim}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleClose} activeOpacity={1} />

          <Animated.View style={[styles.sheet, { backgroundColor: colors.bgCard, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.handle, { backgroundColor: colors.borderSubtle }]} />

            {/* STEP 0: CHOICE — account (recommended) vs guest */}
            {step === 'choice' && (
              <>
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{'S\'inscrire'}</Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                      {SPORT_EMOJI[tournoi.sport] ?? '🏆'}{' '}{tournoi.nom}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={18} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.ctaArea}>
                  <Text style={[styles.emailHint, { color: colors.textTertiary, textAlign: 'center', marginBottom: 6 }]}>
                    Créez un compte pour retrouver toutes vos inscriptions au même endroit — ou inscrivez-vous sans compte, vous recevrez votre confirmation par email.
                  </Text>

                  <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: accent, flexDirection: 'row', gap: 8 }]}
                    onPress={() => goAuth('Login')}
                    activeOpacity={0.85}
                  >
                    <LogIn size={17} color="#fff" strokeWidth={2.2} />
                    <Text style={styles.payBtnText}>Se connecter</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: accent, flexDirection: 'row', gap: 8 }]}
                    onPress={() => goAuth('SignUp')}
                    activeOpacity={0.85}
                  >
                    <UserPlus size={17} color={accent} strokeWidth={2.2} />
                    <Text style={[styles.payBtnText, { color: accent }]}>Créer un compte</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setStep('form')}
                    style={{ alignItems: 'center', paddingVertical: 4 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.secureNote, { color: colors.textSecondary, fontWeight: '600' }]}>
                      Continuer sans compte
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STEP 1 */}
            {step === 'form' && (
              <>
                <View style={styles.header}>
                  {!user && (
                    <TouchableOpacity onPress={() => setStep('choice')} style={styles.backStepBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={[styles.backArrow, { color: colors.textPrimary }]}>{'←'}</Text>
                    </TouchableOpacity>
                  )}
                  <View style={{ flex: 1, marginLeft: user ? 0 : 8 }}>
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
                      editable={!user}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>
                  <Text style={[styles.emailHint, { color: colors.textTertiary }]}>
                    {user
                      ? 'Connecté — confirmation envoyée à votre adresse de compte.'
                      : "La confirmation d'inscription sera envoyée à cette adresse."}
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
                  <TouchableOpacity
                    onPress={() => { setStep('form'); setPaymentIntent(null); }}
                    style={styles.backStepBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
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
                      : <Text style={styles.payBtnText}>
                          {isFree ? "Confirmer l'inscription" : 'Payer · ' + formatPrix(tournoi.prixInscription)}
                        </Text>
                    }
                  </TouchableOpacity>
                  {!isFree && (
                    <Text style={[styles.secureNote, { color: colors.textTertiary }]}>
                      {'🔒 Paiement sécurisé · Remboursable 48h avant'}
                    </Text>
                  )}
                </View>
              </>
            )}

            {/* STEP 3 */}
            {step === 'success' && (
              <View style={styles.successBody}>
                <Animated.View style={[styles.checkCircle, { backgroundColor: accent, opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
                  <Check size={40} color="#fff" strokeWidth={3} />
                </Animated.View>
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                  {isFree ? 'Inscription confirmée !' : 'Paiement reçu !'}
                </Text>
                <Text style={[styles.successSub, { color: colors.textSecondary }]}>
                  <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{teamName.trim()}</Text>
                  {' (' + filledMembers.length + ' joueur' + (filledMembers.length > 1 ? 's' : '') + ') inscrite à\n'}
                  <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{tournoi.nom}</Text>
                </Text>
                <Text style={[styles.successNote, { color: colors.textTertiary }]}>
                  {isFree
                    ? 'Confirmation envoyée à ' + email.trim()
                    : 'Paiement reçu — vous recevrez un email de confirmation à ' + email.trim()}
                </Text>
                <TouchableOpacity style={[styles.doneBtn, { backgroundColor: accent }]} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={styles.doneBtnText}>Parfait !</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP: ERROR */}
            {step === 'error' && (
              <View style={styles.successBody}>
                {paying ? (
                  <ActivityIndicator color={accent} size="large" />
                ) : (
                  <>
                    <ErrorState
                      title="L'inscription a échoué"
                      body={errorMessage ?? "Vérifiez votre connexion internet et réessayez. Aucun paiement n'a été débité."}
                      onRetry={handlePay}
                      fullScreen={false}
                    />
                    <TouchableOpacity onPress={() => setStep('recap')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={[styles.secureNote, { color: colors.textSecondary, fontWeight: '600' }]}>
                        Retour au récapitulatif
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

