// src/screens/admin/AdminLoginScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#0f0c29' },
  flex:            { flex: 1 },
  backBtn:         { position: 'absolute', left: 16, zIndex: 10, padding: 8 },
  content:         { flex: 1, paddingHorizontal: 24, paddingBottom: 32, justifyContent: 'center' },

  circle: {
    position: 'absolute', width: 360, height: 360, borderRadius: 180,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  circleTop:       { top: -120, right: -80 },
  circleBottom:    { bottom: -160, left: -80 },

  brandArea:       { alignItems: 'center', marginBottom: 36 },
  logoRing: {
    width: 80, height: 80, borderRadius: 40, marginBottom: 16,
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
  },
  logoGradient:    { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  appName:         { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  adminBadge: {
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.25)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.5)',
  },
  adminBadgeText:  { fontSize: 10, fontWeight: '800', color: '#a5b4fc', letterSpacing: 2 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  cardTitle:       { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  cardSubtitle:    { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 },

  fieldWrap:       { marginBottom: 16 },
  label:           { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingHorizontal: 14, height: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  input:           { flex: 1, fontSize: 15, color: '#fff' },

  errorBox:        { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText:       { fontSize: 13, color: '#fca5a5', textAlign: 'center', fontWeight: '600' },

  submitBtn:       { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  submitText:      { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  footNote:        { fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 28 },
});
