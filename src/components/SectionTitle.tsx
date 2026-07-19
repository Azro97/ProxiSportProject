// src/components/SectionTitle.tsx
import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
}

export default function SectionTitle({ title }: Props) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 18,
  },
});
