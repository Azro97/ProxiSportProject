// src/screens/admin/AdminCreateTournoiScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header:        { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerStep:    { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressLabels:{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progLabel:     { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },

  // Form
  form: { paddingHorizontal: 20, paddingTop: 4 },

  // Sport chips
  sportRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sportChip:  { flex: 1, minWidth: '44%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  sportEmoji: { fontSize: 20 },
  sportLabel: { fontSize: 13, fontWeight: '700' },

  // Taille pills
  pillRow:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  taillePill:    { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  taillePillText:{ fontSize: 14, fontWeight: '700' },

  // Stepper
  stepperRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  stepperBtn:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepperIcon: { fontSize: 22, fontWeight: '300', lineHeight: 26 },
  stepperValue:{ fontSize: 22, fontWeight: '800', minWidth: 50, textAlign: 'center' },

  // Preview card
  previewCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 20, marginBottom: 4 },
  previewBadge:{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewEmoji:{ fontSize: 22 },
  previewNom:  { fontSize: 15, fontWeight: '800' },
  previewMeta: { fontSize: 12 },

  // CTA
  ctaWrap: { marginTop: 24 },
  ctaBtn:  { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Modal picker
  mpOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  mpSheet:      { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, maxHeight: '60%' },
  mpHandle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  mpSheetTitle: { fontSize: 15, fontWeight: '700', paddingHorizontal: 20, paddingVertical: 12 },
  mpOption:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  mpOptionText: { flex: 1, fontSize: 15 },
});
