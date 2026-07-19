// src/screens/tournois/components/TournoiCard.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  image:      { height: 210, backgroundColor: '#1f2937', justifyContent: 'space-between' },
  imageStyle: { borderRadius: 20 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
  },
  sportBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  sportEmoji:    { fontSize: 12 },
  sportLabel:    { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  statutBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statutText:    { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.6 },
  bottom:        { padding: 14, gap: 8 },
  nom:           { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: 0.2, lineHeight: 24 },
  metaRow:       { flexDirection: 'row', gap: 14, flexWrap: 'wrap', alignItems: 'center' },
  metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  prix:          { fontSize: 13, fontWeight: '700', color: '#fff' },
  progressRow:   { gap: 6 },
  progressBg:    { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  progressMeta:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
});
