// src/screens/matchs/components/DateFilter.tsx
// Row 4 of the filter — date scrubber.
// Always visible. Defaults to today (pre-selected from the store).

import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { getUpcomingWeekDays, isSameDay } from '../../../utils/date';
import { sportColors, type ColorPalette } from '../../../theme';
import { useColors } from '../../../hooks/useColors';
import { useFiltresStore } from '../../../stores/filtresStore';

type Props = {
  selected: Date | null;
  onSelect: (date: Date | null) => void;
  disabled?: boolean;
};

export default function DateFilter({ selected, onSelect, disabled = false }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sport = useFiltresStore(s => s.sport);
  const accent = sport ? sportColors[sport] : colors.textPrimary;
  const weekDays = getUpcomingWeekDays();
  const isTous = selected === null;

  return (
    <View style={[styles.wrapper, disabled && styles.wrapperDisabled]}>
      <Text style={styles.stepLabel}>3 · DATE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEnabled={!disabled}
      >
        {/* TOUS chip */}
        <TouchableOpacity
          style={[
            styles.chip,
            styles.tousChip,
            isTous && { backgroundColor: colors.bgInput, borderColor: colors.borderSubtle },
            !isTous && { borderColor: colors.borderFaint },
          ]}
          onPress={() => !disabled && onSelect(null)}
          activeOpacity={disabled ? 1 : 0.7}
        >
          <Text style={[styles.tousLabel, isTous && { color: colors.textPrimary }]}>
            TOUS
          </Text>
          {isTous && <View style={styles.tousDot} />}
        </TouchableOpacity>

        {weekDays.map(({ dayName, dayNum, month, date }) => {
          const isActive = selected ? isSameDay(selected, date) : false;
          return (
            <TouchableOpacity
              key={date.toDateString()}
              style={[
                styles.chip,
                isActive && { backgroundColor: accent, borderColor: accent },
                !isActive && { borderColor: colors.borderSubtle },
              ]}
              onPress={() => !disabled && onSelect(date)}
              activeOpacity={disabled ? 1 : 0.7}
            >
              <Text style={[styles.dayName, isActive && styles.activeText]}>
                {dayName}
              </Text>
              <Text style={[styles.dayNum, isActive && styles.activeText]}>
                {dayNum}
              </Text>
              <Text style={[styles.dayMonth, isActive && styles.activeText]}>
                {month}
              </Text>
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  wrapperDisabled: { opacity: 0.4 },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  content: { paddingHorizontal: 16, gap: 6, flexDirection: 'row' },
  chip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: colors.bgInput,
    minWidth: 44,
  },
  tousChip: {
    minWidth: 54,
    paddingHorizontal: 12,
    paddingVertical: 7,
    justifyContent: 'center',
  },
  tousLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  tousDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textSecondary,
    marginTop: 4,
    alignSelf: 'center',
  },
  dayName: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 2,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayMonth: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: 1,
  },
  activeText: { color: colors.textInvert },
  });
}
