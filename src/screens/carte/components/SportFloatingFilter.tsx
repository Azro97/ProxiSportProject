// src/screens/carte/components/SportFloatingFilter.tsx
// Floating sport chip row overlaid on the map.
// This filter is local to CarteScreen — independent of filtresStore.

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { sportColors, sportColorsSoft, type ColorPalette } from '../../../theme';
import { useColors } from '../../../hooks/useColors';

const SPORTS = [
  { key: 'foot',   label: 'Foot',   emoji: '⚽' },
  { key: 'basket', label: 'Basket', emoji: '🏀' },
  { key: 'hand',   label: 'Hand',   emoji: '🤾' },
  { key: 'volley', label: 'Volley', emoji: '🏐' },
];

type Props = {
  selected: string | null;
  onSelect: (sport: string | null) => void;
};

export default function SportFloatingFilter({ selected, onSelect }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {SPORTS.map(s => {
          const isActive = selected === s.key;
          const accent = sportColors[s.key];
          const soft = sportColorsSoft[s.key];
          return (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.chip,
                { borderColor: isActive ? accent : colors.borderSubtle },
                isActive ? { backgroundColor: accent } : { backgroundColor: colors.bgCard },
              ]}
              onPress={() => onSelect(isActive ? null : s.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{s.emoji}</Text>
              <Text style={[styles.label, { color: isActive ? colors.textInvert : colors.textSecondary }]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 58,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
    },
    content: { gap: 8, flexDirection: 'row' },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1.5,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
    },
    emoji: { fontSize: 13 },
    label: { fontSize: 12, fontWeight: '700' },
  });
}
