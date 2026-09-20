// src/screens/auth/SignUpScreen.tsx

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, UserRound, MailCheck } from 'lucide-react-native';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';
import { makeStyles } from './LoginScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen({ navigation, route }: Props) {
  const colors = useColors();
  const isDark = useThemeStore(s => s.isDark);
  const insets = useSafeAreaInsets();
  const signUp = useAuthStore(s => s.signUp);
  const styles = makeStyles(colors);

  const [step, setStep] = useState<'form' | 'checkEmail'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && password === confirm;

  async function handleSubmit() {
    if (!emailValid) { setError('Email invalide.'); return; }
    if (!passwordValid) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    setError('');
    try {
      const { needsEmailConfirmation } = await signUp(email.trim(), password);
      if (needsEmailConfirmation) {
        setStep('checkEmail');
      } else if (route.params?.redirectToMesInscriptions) {
        navigation.replace('MesInscriptions');
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      setError(e?.message?.includes('already registered')
        ? 'Un compte existe déjà avec cet email.'
        : 'Impossible de créer le compte. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'checkEmail') {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgApp }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.content, { alignItems: 'center' }]}>
          <View style={[styles.logoRing, { backgroundColor: colors.userPosition, marginBottom: 20 }]}>
            <MailCheck size={32} color="#fff" strokeWidth={2} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary, textAlign: 'center' }]}>
            Vérifiez votre boîte mail
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary, marginTop: 8 }]}>
            Un email de confirmation a été envoyé à {email.trim()}. Confirmez votre compte puis connectez-vous.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.replace('Login', route.params)}
            style={[styles.submitBtn, { backgroundColor: colors.userPosition, marginTop: 28, paddingHorizontal: 32, alignSelf: 'stretch' }]}
          >
            <Text style={[styles.submitText, { color: '#fff' }]}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bgApp }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2} />
      </TouchableOpacity>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>

          <View style={styles.brandArea}>
            <View style={[styles.logoRing, { backgroundColor: colors.userPosition }]}>
              <UserRound size={32} color="#fff" strokeWidth={2} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Retrouvez toutes vos inscriptions au même endroit
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>Email</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.bgInput, borderColor: colors.borderSubtle }]}>
                <Mail size={17} color={colors.textMuted} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="vous@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>Mot de passe</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.bgInput, borderColor: colors.borderSubtle }]}>
                <Lock size={17} color={colors.textMuted} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { flex: 1, color: colors.textPrimary }]}
                  placeholder="6 caractères minimum"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPass
                    ? <EyeOff size={17} color={colors.textMuted} strokeWidth={2} />
                    : <Eye size={17} color={colors.textMuted} strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textTertiary }]}>Confirmer le mot de passe</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.bgInput, borderColor: colors.borderSubtle }]}>
                <Lock size={17} color={colors.textMuted} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={confirm}
                  onChangeText={v => { setConfirm(v); setError(''); }}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.submitBtn, { backgroundColor: colors.userPosition }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={[styles.submitText, { color: '#fff' }]}>Créer mon compte</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.replace('Login', route.params)}
            style={styles.footerLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              Déjà un compte ?{' '}
              <Text style={{ color: colors.userPosition, fontWeight: '700' }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
