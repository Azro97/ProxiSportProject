// src/screens/tournois/TournoiListScreen.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container:   { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText:  { fontSize: 22, fontWeight: '800', letterSpacing: 0.2 },
  countText:   { fontSize: 13 },
  filtersArea: { paddingTop: 10, paddingBottom: 4 },
  pillRow:  { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' },
  pill:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: '600' },
  list:     { paddingTop: 10, paddingBottom: 40 },
  loader:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty:    { flex: 1, alignItems: 'center', paddingTop: 64, gap: 10 },
  emptyIcon:  { fontSize: 48 },
  emptyText:  { fontSize: 16, fontWeight: '500' },
  emptyReset: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  adminBtn: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
