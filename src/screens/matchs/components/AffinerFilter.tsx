// src/screens/matchs/components/AffinerFilter.tsx
// Step 2 — "Affiner" row: two pill dropdowns for Région + Division.
//
// Division sheet uses a grouped/hierarchical layout:
//   • Tap group row  → toggles all 3 sub-levels in that group at once
//   • Tap chevron    → expand / collapse sub-levels
//   • Tap sub-level  → toggle that specific level only

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Pressable,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useFiltresStore } from '../../../stores/filtresStore';
import {
  Division,
  DivisionGroupe,
  DIVISION_GROUPS,
  DIVISION_GROUPE_NAMES,
} from '../../../models/Filtre';
import { sportColors, type ColorPalette } from '../../../theme';
import { useColors } from '../../../hooks/useColors';
import { getRegions } from '../../../services/matchsService';

type Sheet = 'region' | 'division' | null;

/** Shortened label for a specific level: "Nationale 1" → "N1" */
const shortDiv = (d: Division): string => {
  if (d.startsWith('Nat')) return 'N' + d.slice(-1);
  if (d.startsWith('Rég')) return 'R' + d.slice(-1);
  return 'D' + d.slice(-1);
};

export default function AffinerFilter({ disabled = false }: { disabled?: boolean }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    sport, regions, divisions,
    toggleRegion, clearRegions,
    toggleDivision, clearDivisions, toggleDivisionGroup,
  } = useFiltresStore();
  const [open, setOpen] = useState<Sheet>(null);
  const [expandedGroupe, setExpandedGroupe] = useState<DivisionGroupe | null>(null);
  const [allRegions, setAllRegions] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    getRegions().then(regions => { if (alive) setAllRegions(regions); });
    return () => { alive = false; };
  }, []);

  const accent = sport ? sportColors[sport] : colors.textPrimary;

  const regionLabel =
    regions.length === 0 ? 'Tous'
    : regions.length === 1 ? regions[0]
    : `${regions.length} régions`;

  const divisionLabel = (() => {
    if (divisions.length === 0) return 'Tous';
    // If exactly one complete group is selected → show just the group name
    for (const grp of DIVISION_GROUPE_NAMES) {
      const subs = DIVISION_GROUPS[grp];
      if (divisions.length === subs.length && subs.every(d => divisions.includes(d))) {
        return grp;
      }
    }
    if (divisions.length <= 2) return divisions.map(shortDiv).join(', ');
    return `${divisions.length} div.`;
  })();

  const closeSheet = () => {
    setOpen(null);
    setExpandedGroupe(null);
  };

  return (
    <>
      <View style={[styles.wrapper, disabled && styles.dimmed]}>
        <Text style={styles.stepLabel}>2 · AFFINER</Text>
        <View style={styles.pills}>

          {/* Région pill */}
          <TouchableOpacity
            style={[styles.pill, regions.length > 0 && { borderColor: accent }]}
            onPress={() => !disabled && setOpen('region')}
            activeOpacity={disabled ? 1 : 0.75}
          >
            <View style={styles.pillText}>
              <Text style={styles.pillLabel}>Région</Text>
              <Text
                style={[styles.pillValue, regions.length > 0 && { color: accent }]}
                numberOfLines={1}
              >
                {regionLabel}
              </Text>
            </View>
            <ChevronDown size={14} color={regions.length > 0 ? accent : colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>

          {/* Division pill */}
          <TouchableOpacity
            style={[styles.pill, divisions.length > 0 && { borderColor: accent }]}
            onPress={() => !disabled && setOpen('division')}
            activeOpacity={disabled ? 1 : 0.75}
          >
            <View style={styles.pillText}>
              <Text style={styles.pillLabel}>Division</Text>
              <Text
                style={[styles.pillValue, divisions.length > 0 && { color: accent }]}
                numberOfLines={1}
              >
                {divisionLabel}
              </Text>
            </View>
            <ChevronDown size={14} color={divisions.length > 0 ? accent : colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>

        </View>
      </View>

      {/* ── Bottom-sheet Modal ───────────────────────────────────────────── */}
      <Modal
        visible={open !== null}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.overlay} onPress={closeSheet} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>
            {open === 'region' ? 'Choisir une région' : 'Choisir une division'}
          </Text>

          {/* ── Région: flat list ─────────────────────────────────────── */}
          {open === 'region' && (
            <FlatList
              data={allRegions}
              keyExtractor={item => item}
              style={styles.list}
              ListHeaderComponent={
                <>
                  <TouchableOpacity style={styles.optionRow} onPress={clearRegions} activeOpacity={0.7}>
                    <Text style={[styles.optionLabel, regions.length === 0 && { color: accent, fontWeight: '700' }]}>
                      Tous
                    </Text>
                    {regions.length === 0 && <Check size={16} color={accent} strokeWidth={2.5} />}
                  </TouchableOpacity>
                  <View style={styles.separator} />
                </>
              }
              renderItem={({ item }) => {
                const active = regions.includes(item);
                return (
                  <TouchableOpacity style={styles.optionRow} onPress={() => toggleRegion(item)} activeOpacity={0.7}>
                    <Text style={[styles.optionLabel, active && { color: accent, fontWeight: '700' }]}>
                      {item}
                    </Text>
                    {active && <Check size={16} color={accent} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          {/* ── Division: grouped / hierarchical ─────────────────────── */}
          {open === 'division' && (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {/* Tous row */}
              <TouchableOpacity style={styles.optionRow} onPress={clearDivisions} activeOpacity={0.7}>
                <Text style={[styles.optionLabel, divisions.length === 0 && { color: accent, fontWeight: '700' }]}>
                  Tous
                </Text>
                {divisions.length === 0 && <Check size={16} color={accent} strokeWidth={2.5} />}
              </TouchableOpacity>
              <View style={styles.separator} />

              {DIVISION_GROUPE_NAMES.map(grp => {
                const subs = DIVISION_GROUPS[grp];
                const selectedCount = subs.filter(d => divisions.includes(d)).length;
                const allSel = selectedCount === subs.length;
                const someSel = selectedCount > 0 && !allSel;
                const isExpanded = expandedGroupe === grp;

                return (
                  <View key={grp}>
                    {/* Group header row */}
                    <View style={styles.groupRow}>
                      {/* Left side — tap to toggle entire group */}
                      <TouchableOpacity
                        style={styles.groupRowLeft}
                        onPress={() => toggleDivisionGroup(grp)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.checkBox,
                          (allSel || someSel) && { borderColor: accent },
                          allSel && { backgroundColor: accent },
                        ]}>
                          {allSel && <Check size={11} color="#000" strokeWidth={3} />}
                          {someSel && <View style={[styles.partialFill, { backgroundColor: accent }]} />}
                        </View>
                        <Text style={[
                          styles.groupLabel,
                          allSel && { color: accent, fontWeight: '700' },
                          someSel && { color: accent },
                        ]}>
                          {grp}
                        </Text>
                        {someSel && (
                          <Text style={[styles.partialCount, { color: accent }]}>
                            {selectedCount}/3
                          </Text>
                        )}
                      </TouchableOpacity>
                      {/* Right side — expand/collapse chevron */}
                      <TouchableOpacity
                        style={styles.expandBtn}
                        onPress={() => setExpandedGroupe(isExpanded ? null : grp)}
                        activeOpacity={0.7}
                      >
                        <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                          <ChevronDown
                            size={15}
                            color={isExpanded ? accent : colors.textMuted}
                            strokeWidth={2}
                          />
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Sub-levels (visible when expanded) */}
                    {isExpanded && subs.map((div, i) => {
                      const active = divisions.includes(div);
                      return (
                        <React.Fragment key={div}>
                          <TouchableOpacity
                            style={styles.subRow}
                            onPress={() => toggleDivision(div)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.subLabel, active && { color: accent, fontWeight: '600' }]}>
                              {div}
                            </Text>
                            {active && <Check size={14} color={accent} strokeWidth={2.5} />}
                          </TouchableOpacity>
                          {i < subs.length - 1 && <View style={styles.subSeparator} />}
                        </React.Fragment>
                      );
                    })}

                    <View style={styles.separator} />
                  </View>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: accent }]}
            onPress={closeSheet}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  dimmed: { opacity: 0.4 },
  stepLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  pills: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgInput,
    gap: 6,
  },
  pillText: { flex: 1 },
  pillLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 1,
  },
  pillValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: colors.bgScrim,
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSubtle,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: { flexGrow: 0 },

  // Flat rows (Tous + region items)
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderFaint,
    marginHorizontal: 20,
  },

  // Division group rows
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingLeft: 20,
    paddingRight: 8,
  },
  groupRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partialFill: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  partialCount: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  expandBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  // Division sub-level rows
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 52,
    paddingRight: 20,
    backgroundColor: colors.bgCardElev,
  },
  subLabel: {
    fontSize: 13.5,
    fontWeight: '400',
    color: colors.textMuted,
  },
  subSeparator: {
    height: 1,
    backgroundColor: colors.borderFaint,
    marginLeft: 52,
    marginRight: 0,
  },

  // Confirm button
  doneBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInvert,
  },
  });
}
