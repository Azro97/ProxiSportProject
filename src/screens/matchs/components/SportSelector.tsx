// src/screens/matchs/components/SportSelector.tsx
// Row 1 of the cascading filter — sport chips with sport-specific colors.

import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { sportColors, sportColorsSoft, type ColorPalette } from '../../../theme';
import { useColors } from '../../../hooks/useColors';

const SPORTS = [
  { key: 'foot',   label: 'Football',   emoji: '⚽' },
  { key: 'basket', label: 'Basketball', emoji: '🏀' },
  { key: 'hand',   label: 'Handball',   emoji: '🤾' },
  { key: 'volley', label: 'Volleyball', emoji: '🏐' },
];

type Props = {
  selected: string | null;
  onSelect: (sport: string) => void;
};

export default function SportSelector({ selected, onSelect }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.stepLabel}>1 · CHOISIR LE SPORT</Text>
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
                isActive && { backgroundColor: soft },
              ]}
              onPress={() => onSelect(s.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{s.emoji}</Text>
              <Text style={[styles.label, isActive && { color: accent }]}>{s.label}</Text>
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
    paddingTop: 8,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  content: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.bgInput,
  },
  emoji: { fontSize: 13 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  });
}
