// src/screens/admin/components/TimelineRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  date: string;
  badge?: string;
  badgeColor?: string;
  colors: any;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function TimelineRow({ label, date, badge, badgeColor, colors, isLast }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.dotCol}>
        <View style={[styles.dot, { backgroundColor: badgeColor ?? colors.borderSubtle }]} />
        {!isLast && <View style={[styles.line, { backgroundColor: colors.borderHairline }]} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.dateRow}>
          <Text style={[styles.date, { color: colors.textPrimary }]}>{date}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: (badgeColor ?? '#6b7280') + '20' }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 14, paddingVertical: 12 },
  dotCol:    { width: 16, alignItems: 'center' },
  dot:       { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  line:      { flex: 1, width: 2, marginTop: 4, marginBottom: -12 },
  content:   { flex: 1, paddingBottom: 4 },
  label:     { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  dateRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date:      { fontSize: 15, fontWeight: '700' },
  badge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
