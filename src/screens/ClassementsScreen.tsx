// src/screens/ClassementsScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { type ColorPalette } from '../theme';
import { useColors } from '../hooks/useColors';
import { useThemeStore } from '../stores/themeStore';

export default function ClassementsScreen() {
  const colors = useColors();
  const { isDark, toggleTheme } = useThemeStore();
  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Classements</Text>
        <Text style={styles.subtitle}>Disponible prochainement</Text>

        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.75}>
          {isDark
            ? <Sun size={18} color={colors.textSecondary} strokeWidth={2} />
            : <Moon size={18} color={colors.textSecondary} strokeWidth={2} />}
          <Text style={styles.themeLabel}>{isDark ? 'Mode clair' : 'Mode sombre'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgApp },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: 20 },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.bgCard,
    },
    themeLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  });
}
