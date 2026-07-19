// src/screens/admin/components/DashboardStatCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  icon: React.ReactNode;
  value: number;
  label: string;
}

export default function DashboardStatCard({ icon, value, label }: Props) {
  return (
    <View style={styles.card}>
      {icon}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:  { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingVertical: 12, gap: 3 },
  value: { fontSize: 22, fontWeight: '900', color: '#fff' },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
});
