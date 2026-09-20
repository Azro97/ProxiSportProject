// src/components/InlineLoadError.tsx
// Inline load-error row for a form field whose backing list (e.g. région/
// département pickers) failed to fetch. Deliberately not the full-page
// ErrorState: this sits mid-form and must not discard whatever the user
// has already typed elsewhere on the screen. Used across 2+ screens
// (AdminCreateTournoiScreen, AdminCreateEquipeScreen) — see CLAUDE.md's
// "Frontend conventions" section.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { type ColorPalette } from '../theme';

type Props = {
  message: string;
  onRetry: () => void;
  colors: ColorPalette;
};

export default function InlineLoadError({ message, onRetry, colors }: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }]}
      onPress={onRetry}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={1}>
        {message}
      </Text>
      <View style={styles.retry}>
        <RefreshCw size={13} color="#6366f1" strokeWidth={2.2} />
        <Text style={styles.retryText}>Réessayer</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  text: { fontSize: 13, flex: 1 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  retryText: { fontSize: 12, fontWeight: '700', color: '#6366f1' },
});
