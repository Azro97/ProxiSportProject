// src/screens/auth/MesInscriptionsScreen.styles.ts
import { StyleSheet } from 'react-native';
import { type ColorPalette } from '../../theme';

export function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },

    accountCard: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginHorizontal: 16, marginBottom: 8, padding: 14,
      borderRadius: 14, borderWidth: 1,
    },
    avatar: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    email: { flex: 1, fontSize: 14, fontWeight: '600' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    logoutText: { fontSize: 12, fontWeight: '600' },

    deleteAccountBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      alignSelf: 'center', marginBottom: 10, paddingVertical: 4,
    },
    deleteAccountText: { fontSize: 11 },

    list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8, gap: 10 },
    card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    emoji: { fontSize: 18 },
    tournoiNom: { fontSize: 15, fontWeight: '700', flex: 1 },
    meta: { fontSize: 12 },
    cardBottom: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    statutBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
    },
    statutDot: { width: 6, height: 6, borderRadius: 3 },
    statutText: { fontSize: 11, fontWeight: '700' },
    cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60, justifyContent: 'flex-end' },
    cancelText: { fontSize: 12, fontWeight: '600' },

    empty: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
    emptyCta: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  });
}
