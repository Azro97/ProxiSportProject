// src/screens/admin/AdminDashboardScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:       { paddingHorizontal: 20, paddingBottom: 20 },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerLabel:  { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' },
  headerTitle:  { fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 2 },
  logoutBtn:    { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  backToAppBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backToAppText:{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  statsRow:     { flexDirection: 'row', gap: 10 },

  listHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  listTitle:    { fontSize: 18, fontWeight: '800' },
  createBtn:    { borderRadius: 20, overflow: 'hidden' },
  createBtnGrad:{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7 },
  createBtnText:{ fontSize: 13, fontWeight: '800', color: '#fff' },

  tournoiCard: {
    flexDirection: 'row', borderRadius: 16, marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  accentBar:    { width: 4 },
  tournoiBody:  { flex: 1, padding: 14 },
  tournoiHeader:{ flexDirection: 'row', alignItems: 'center' },
  sportBadge:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sportEmoji:   { fontSize: 18 },
  tournoiNom:   { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  tournoiMeta:  { fontSize: 11, marginTop: 2 },
  statutBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statutText:   { fontSize: 10, fontWeight: '700' },

  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 5 },
  progressLabel:{ fontSize: 11 },
  progressTrack:{ height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  emptyState:   { alignItems: 'center', paddingTop: 60, gap: 14 },
  emptyText:    { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  fab:     { position: 'absolute', right: 24, width: 58, height: 58, borderRadius: 29, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
  fabGrad: { flex: 1, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
});
