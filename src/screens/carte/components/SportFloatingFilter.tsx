// src/screens/carte/components/SportFloatingFilter.tsx
// Floating sport chip row overlaid on the map.
// This filter is local to CarteScreen — independent of filtresStore.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../theme';

const SPORTS = [
  { key: 'foot',   label: 'Foot' },
  { key: 'basket', label: 'Basket' },
  { key: 'hand',   label: 'Hand' },
  { key: 'volley', label: 'Volley' },
];

type Props = {
  selected: string | null;
  onSelect: (sport: string | null) => void;
};

export default function SportFloatingFilter({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {SPORTS.map(s => {
          const isActive = selected === s.key;
          const color = theme.sportColors[s.key];
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.chip, { borderColor: color }, isActive && { backgroundColor: color }]}
              onPress={() => onSelect(isActive ? null : s.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.md,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    marginRight: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 4,
  },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  labelActive: { color: theme.colors.white },
});
