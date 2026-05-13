// src/screens/matchs/components/GeoFilter.tsx
// Row 2 of the cascading filter — region chips.
// Disabled (hidden) until a sport is selected.

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

type Props = {
  regions: string[];
  selected: string | null;
  onSelect: (region: string) => void;
  disabled?: boolean;
};

export default function GeoFilter({ regions, selected, onSelect, disabled = false }: Props) {
  if (disabled) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {regions.map(region => {
        const isActive = selected === region;
        return (
          <TouchableOpacity
            key={region}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(region)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{region}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    maxHeight: 50,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  content: { paddingHorizontal: theme.spacing.md, paddingVertical: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
    marginRight: theme.spacing.sm,
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  label: { fontSize: 13, color: theme.colors.text },
  labelActive: { color: theme.colors.white, fontWeight: '600' },
});
