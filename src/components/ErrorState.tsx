// src/components/ErrorState.tsx
// Shared fallback UI shown when a screen's data fetch fails (network/Supabase error).
// Distinct from an "empty" state (fetch succeeded, zero rows) — this is for when the
// fetch itself threw. Used across 2+ screens, so it lives in src/components —
// see CLAUDE.md's "Frontend conventions" section (also documents the
// separate InlineLoadError, used for mid-form field failures instead of this).

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useColors } from '../hooks/useColors';
import { type ColorPalette } from '../theme';

type Props = {
  title?: string;
  body?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
};

export default function ErrorState({
  title = 'Une erreur est survenue',
  body = 'Vérifiez votre connexion internet et réessayez.',
  onRetry,
  fullScreen = true,
}: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, fullScreen && styles.fullScreen]}>
      <View style={styles.iconWrap}>
        <WifiOff size={26} color={colors.textMuted} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 40,
    },
    fullScreen: { flex: 1 },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.bgInput,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
      textAlign: 'center',
    },
    body: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textTertiary,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryBtn: {
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.userPosition,
    },
    retryText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 14,
    },
  });
}
