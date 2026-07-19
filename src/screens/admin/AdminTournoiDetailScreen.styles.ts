// src/screens/admin/AdminTournoiDetailScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  root:   { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  heroWrap:       { marginBottom: 4 },
  hero:           { padding: 20, paddingBottom: 24 },
  backBtn:        { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroContent:    { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  heroEmojiBadge: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroEmoji:      { fontSize: 26 },
  heroNom:        { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28 },
  heroMeta:       { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  heroFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statutPill:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statutPillText: { fontSize: 12, fontWeight: '700' },
  heroOrg:        { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 10 },

  fillCard:       { marginHorizontal: 16, marginBottom: 6, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  fillRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  fillLabel:      { fontSize: 13, fontWeight: '600' },
  fillPct:        { fontSize: 15, fontWeight: '900' },
  fillTrack:      { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  fillFill:       { height: '100%', borderRadius: 4 },
  fillSubRow:     { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  fillSub:        { fontSize: 11, fontWeight: '600' },

  sectionTitle:   { fontSize: 17, fontWeight: '800', marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  teamsHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  countBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  countBadgeText: { fontSize: 12, fontWeight: '800' },

  timelineCard:   { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 },

  emptyTeams:     { marginHorizontal: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 32, alignItems: 'center', gap: 10 },
  emptyTeamsText: { fontSize: 14 },
});
