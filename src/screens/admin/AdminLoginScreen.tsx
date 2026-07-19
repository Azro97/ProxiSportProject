// src/screens/admin/AdminLoginScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Shield, User, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types';
import { useAdminStore } from '../../stores/adminStore';
import { styles } from './AdminLoginScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminLogin'>;

export default function AdminLoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const login  = useAdminStore(s => s.login);

  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const errorAnim  = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function showError(msg: string) {
    setError(msg);
    errorAnim.setValue(0);
    Animated.timing(errorAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    shake();
  }

  async function handleLogin() {
    if (!username.trim()) { showError('Identifiant requis'); return; }
    if (!password)        { showError('Mot de passe requis'); return; }
    setLoading(true);
    // Simulate slight network delay for UX
    await new Promise(r => setTimeout(r, 600));
    const ok = login(username.trim(), password.trim());
    setLoading(false);
    if (ok) {
      setError('');
      navigation.replace('AdminMain');
    } else {
      showError('Identifiants incorrects');
    }
  }

  const canSubmit = username.trim().length > 0 && password.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleTop]} />
      <View style={[styles.circle, styles.circleBottom]} />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ChevronLeft size={24} color="rgba(255,255,255,0.7)" strokeWidth={2} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>

          {/* Brand */}
          <Animated.View style={[styles.brandArea, { transform: [{ translateX: shakeAnim }] }]}>
            <View style={styles.logoRing}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.logoGradient}
              >
                <Shield size={34} color="#fff" strokeWidth={2} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>ProxiSport</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ESPACE ADMIN</Text>
            </View>
          </Animated.View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSubtitle}>Accès réservé aux administrateurs</Text>

            {/* Username */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Identifiant</Text>
              <View style={styles.inputRow}>
                <User size={17} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Nom d'utilisateur"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={username}
                  onChangeText={v => { setUsername(v); setError(''); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputRow}>
                <Lock size={17} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPass
                    ? <EyeOff size={17} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                    : <Eye    size={17} color="rgba(255,255,255,0.4)" strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <Animated.View style={[styles.errorBox, { opacity: errorAnim }]}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
              style={{ marginTop: 6 }}
            >
              <LinearGradient
                colors={canSubmit ? ['#6366f1', '#8b5cf6'] : ['#333', '#333']}
                style={[styles.submitBtn, !canSubmit && { opacity: 0.5 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitText}>Se connecter</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.footNote}>ProxiSport Admin © 2026</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}


