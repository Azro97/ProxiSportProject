// src/screens/auth/LoginScreen.styles.ts
import { StyleSheet } from 'react-native';
import { type ColorPalette } from '../../theme';

export function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    root:      { flex: 1 },
    flex:      { flex: 1 },
    backBtn:   { position: 'absolute', left: 16, zIndex: 10, padding: 8 },
    content:   { flex: 1, paddingHorizontal: 24, paddingBottom: 32, justifyContent: 'center' },

    brandArea: { alignItems: 'center', marginBottom: 28 },
    logoRing: {
      width: 64, height: 64, borderRadius: 32, marginBottom: 14,
      alignItems: 'center', justifyContent: 'center',
    },
    title:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    subtitle:  { fontSize: 13, marginTop: 4, textAlign: 'center' },

    card: {
      borderRadius: 20, padding: 20, borderWidth: 1,
    },
    fieldWrap: { marginBottom: 14 },
    label: {
      fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
      textTransform: 'uppercase', marginBottom: 7,
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 12, paddingHorizontal: 13, height: 48, borderWidth: 1,
    },
    input: { flex: 1, fontSize: 15 },

    forgotWrap:  { alignSelf: 'flex-end', marginBottom: 6 },
    forgotText:  { fontSize: 12, fontWeight: '600' },

    errorBox:  {
      backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 10,
      marginBottom: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    },
    errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center', fontWeight: '600' },

    submitBtn:  { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    submitText: { fontSize: 15, fontWeight: '800' },

    footerLink: { marginTop: 24, alignItems: 'center' },
    footerText: { fontSize: 13 },
  });
}
