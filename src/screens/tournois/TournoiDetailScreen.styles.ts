// src/screens/tournois/TournoiDetailScreen.styles.ts
import { StyleSheet } from 'react-native';

export const infoStyles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  iconWrap:{ width: 30, marginRight: 8 },
  text:    { flex: 1 },
  label:   { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  value:   { fontSize: 14, fontWeight: '600', color: '#111827' },
  action:  { marginLeft: 8 },
});

export const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:    { flexGrow: 1 },
  notFound:  { fontSize: 16 },

  hero:      { height: 300 },
  heroImage: { flex: 1, justifyContent: 'space-between' },
  backBtn: {
    position: 'absolute', left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 100, elevation: 10,
  },
  heroContent: { padding: 16, gap: 6 },
  sportBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sportEmoji: { fontSize: 13 },
  sportLabel: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  heroTitle:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.2, lineHeight: 32 },
  heroOrga:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  infoGrid: { borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },

  section:      { padding: 16, borderRadius: 16, gap: 10, borderWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  teamsHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamsLeft:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamsCount:   { fontSize: 18, fontWeight: '700' },
  progressBg:   { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  spotsText:    { fontSize: 12 },

  priceSection: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  priceInfo:  { flex: 1 },
  priceLine:  { fontSize: 12 },
  priceValue: { fontSize: 26, fontWeight: '900' },

  descSection: { gap: 8 },
  descHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  descTitle:   { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  descText:    { fontSize: 15, lineHeight: 23 },

  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn:     { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});
