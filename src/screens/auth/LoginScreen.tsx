// src/screens/auth/LoginScreen.tsx

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, UserRound } from 'lucide-react-native';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';
import { makeStyles } from './LoginScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const colors = useColors();
  const isDark = useThemeStore(s => s.isDark);
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore(s => s.signIn);
  const styles = makeStyles(colors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      if (route.params?.redirectToMesInscriptions) {
        navigation.replace('MesInscriptions');
      } else {
        navigation.goBack();
      }
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Connexion</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Retrouvez vos inscriptions aux tournois
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
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPass
                    ? <EyeOff size={17} color={colors.textMuted} strokeWidth={2} />
                    : <Eye size={17} color={colors.textMuted} strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={styles.forgotWrap}
            >
              <Text style={[styles.forgotText, { color: colors.userPosition }]}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
              style={[styles.submitBtn, { backgroundColor: canSubmit ? colors.userPosition : colors.borderSubtle }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={[styles.submitText, { color: canSubmit ? '#fff' : colors.textTertiary }]}>Se connecter</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.replace('SignUp', route.params)}
            style={styles.footerLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              Pas encore de compte ?{' '}
              <Text style={{ color: colors.userPosition, fontWeight: '700' }}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
