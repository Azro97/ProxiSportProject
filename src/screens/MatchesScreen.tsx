// src/screens/MatchesScreen.tsx
// NOTE: This file is superseded by src/screens/matchs/MatchsScreen.tsx
// It is no longer referenced by navigation. Kept for reference only.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MatchesScreen() {
  return (
    <View style={styles.container}>
      <Text>Voir src/screens/matchs/MatchsScreen.tsx</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
