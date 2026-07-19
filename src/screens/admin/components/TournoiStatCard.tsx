// src/screens/admin/components/TournoiStatCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
  colors: any;
}

export default function TournoiStatCard({ icon, value, label, accent, colors }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderHairline }]}>
      <View style={[styles.iconWrap, { backgroundColor: accent + '15' }]}>{icon}</View>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:     { flex: 1, padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', gap: 6, minWidth: '44%' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value:    { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  label:    { fontSize: 10, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },
});
