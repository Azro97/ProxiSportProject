// src/screens/auth/ForgotPasswordScreen.tsx

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Mail, KeyRound, MailCheck } from 'lucide-react-native';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useColors } from '../../hooks/useColors';
import { useThemeStore } from '../../stores/themeStore';
import { makeStyles } from './LoginScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const colors = useColors();
  const isDark = useThemeStore(s => s.isDark);
  const insets = useSafeAreaInsets();
  const resetPassword = useAuthStore(s => s.resetPassword);
  const styles = makeStyles(colors);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await resetPassword(email.trim());
    } catch {
      // Deliberately silent — always show the same success state below,
      // regardless of whether the email exists, to avoid account enumeration.
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
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
            Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.submitBtn, { backgroundColor: colors.userPosition, marginTop: 28, alignSelf: 'stretch' }]}
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
              <KeyRound size={30} color="#fff" strokeWidth={2} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Mot de passe oublié</Text>
            <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
              Recevez un lien pour réinitialiser votre mot de passe
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
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!email.trim() || loading}
              activeOpacity={0.85}
              style={[styles.submitBtn, { backgroundColor: email.trim() ? colors.userPosition : colors.borderSubtle }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={[styles.submitText, { color: email.trim() ? '#fff' : colors.textTertiary }]}>
                    Envoyer le lien
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
