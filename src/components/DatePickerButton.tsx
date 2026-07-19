// src/components/DatePickerButton.tsx
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { formatDate } from '../utils/date';

interface Props {
  date: Date | null;
  onPress: () => void;
  error?: string;
  colors: any;
  accent: string;
}

export default function DatePickerButton({ date, onPress, error, colors, accent }: Props) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.bgCard,
            borderColor: error ? '#ef4444' : (date ? accent + '80' : colors.borderSubtle),
            marginBottom: 2,
          },
        ]}
        activeOpacity={0.8}
      >
        <Calendar
          size={16}
          color={date ? accent : colors.textTertiary}
          strokeWidth={2}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.triggerText, { color: date ? colors.textPrimary : colors.textMuted }]}>
          {date ? formatDate(date) : 'Appuyez pour choisir'}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  triggerText: { flex: 1, fontSize: 15 },
  error: { fontSize: 11, color: '#ef4444', marginBottom: 4, marginLeft: 4 },
});
