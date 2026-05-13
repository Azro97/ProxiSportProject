// src/screens/matchs/components/SportSelector.tsx
// Row 1 of the cascading filter — sport chips with sport-specific colors.

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

const SPORTS = [
  { key: 'foot',   label: 'Football' },
  { key: 'basket', label: 'Basketball' },
  { key: 'hand',   label: 'Handball' },
  { key: 'volley', label: 'Volleyball' },
];

type Props = {
  selected: string | null;
  onSelect: (sport: string) => void;
};

export default function SportSelector({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {SPORTS.map(s => {
        const isActive = selected === s.key;
        const color = theme.sportColors[s.key];
        return (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, { borderColor: color }, isActive && { backgroundColor: color }]}
            onPress={() => onSelect(s.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{s.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { maxHeight: 54, backgroundColor: theme.colors.white },
  content: { paddingHorizontal: theme.spacing.md, paddingVertical: 9, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    marginRight: theme.spacing.sm,
  },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  labelActive: { color: theme.colors.white },
});
