// src/components/FormField.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  colors: any;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
  keyboardType?: any;
  maxLength?: number;
}

export default function FormField({
  value, onChangeText, placeholder, error, colors,
  multiline, numberOfLines, style, keyboardType, maxLength,
}: Props) {
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.bgCard,
            borderColor: error ? '#ef4444' : colors.borderSubtle,
            color: colors.textPrimary,
          },
          style,
        ]}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 48,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 2,
  },
  error: { fontSize: 11, color: '#ef4444', marginBottom: 4, marginLeft: 4 },
});
