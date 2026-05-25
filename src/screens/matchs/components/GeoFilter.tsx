// src/screens/matchs/components/GeoFilter.tsx
// Row 2 of the filter — region chips with multi-select support.
// Disabled (hidden) until a sport is selected.

import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { sportColors, type ColorPalette } from '../../../theme';
import { useColors } from '../../../hooks/useColors';
import { useFiltresStore } from '../../../stores/filtresStore';

type Props = {
  regions: string[];
  selected: string[];
  onToggle: (region: string) => void;
  disabled?: boolean;
};

export default function GeoFilter({ regions, selected, onToggle, disabled = false }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sport = useFiltresStore(s => s.sport);
  const accent = sport ? sportColors[sport] : colors.textPrimary;

  return (
    <View style={[styles.wrapper, disabled && styles.wrapperDisabled]}>
      <Text style={styles.stepLabel}>2 · RÉGION</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEnabled={!disabled}
      >
        {regions.map(region => {
          const isActive = selected.includes(region);
          return (
            <TouchableOpacity
              key={region}
              style={[
                styles.chip,
                { borderColor: isActive ? accent : colors.borderSubtle },
                isActive && { backgroundColor: `${accent}22` },
                disabled && styles.chipDisabled,
              ]}
              onPress={() => !disabled && onToggle(region)}
              activeOpacity={disabled ? 1 : 0.7}
            >
              <Text style={[
                styles.label,
                isActive && { color: accent },
                disabled && styles.labelDisabled,
              ]}>{region}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  wrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  wrapperDisabled: { opacity: 0.4 },
  stepLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  content: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.bgInput,
  },
  chipDisabled: { borderColor: colors.borderFaint },
  label: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  labelDisabled: { color: colors.textDisabled },
  });
}
