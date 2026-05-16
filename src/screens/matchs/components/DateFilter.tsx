// src/screens/matchs/components/DateFilter.tsx
// Row 4 of the filter — weekday date chips.
// Always visible. Defaults to today (pre-selected from the store).

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { getUpcomingWeekDays, isSameDay } from '../../../utils/date';
import { theme } from '../../../theme';

type Props = {
  selected: Date;                   // always a Date — defaults to today
  onSelect: (date: Date) => void;
};

export default function DateFilter({ selected, onSelect }: Props) {
  const weekDays = getUpcomingWeekDays();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {weekDays.map(({ label, date }) => {
        const isActive = selected ? isSameDay(selected, date) : false;
        return (
          <TouchableOpacity
            key={label}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(date)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
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
