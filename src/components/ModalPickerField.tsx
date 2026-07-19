// src/components/ModalPickerField.tsx
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface Props {
  value: string;
  onPress: () => void;
  colors: any;
}

export default function ModalPickerField({ value, onPress, colors }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.trigger,
        { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle, marginBottom: 2 },
      ]}
      activeOpacity={0.8}
    >
      <Text style={[styles.triggerText, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
      <ChevronRight size={16} color={colors.textTertiary} strokeWidth={2} />
    </TouchableOpacity>
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
});
