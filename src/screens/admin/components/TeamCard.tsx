// src/screens/admin/components/TeamCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Inscription, InscriptionStatut } from '../../../models/Inscription';
import { formatPrix } from '../../../services/tournoiService';

const STATUT_INSCR: Record<InscriptionStatut, { label: string; color: string }> = {
  confirmée:           { label: 'Confirmée',  color: '#16a34a' },
  en_attente_paiement: { label: 'En attente', color: '#d97706' },
  annulée:             { label: 'Annulée',    color: '#dc2626' },
};

interface Props {
  inscription: Inscription;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  accent: string;
  colors: any;
}

export default function TeamCard({ inscription, index, expanded, onToggle, accent, colors }: Props) {
  const cfg         = STATUT_INSCR[inscription.statut];
  const isCancelled = inscription.statut === 'annulée';

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: expanded ? accent + '60' : colors.borderHairline,
          borderWidth: expanded ? 1.5 : StyleSheet.hairlineWidth,
          opacity: isCancelled ? 0.6 : 1,
        },
      ]}
      activeOpacity={0.85}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={[styles.rankBadge, { backgroundColor: isCancelled ? colors.bgApp : accent + '18' }]}>
          <Text style={[styles.rankText, { color: isCancelled ? colors.textMuted : accent }]}>#{index + 1}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.teamName, { color: colors.textPrimary }]}>{inscription.equipe_nom}</Text>
          <Text style={[styles.email, { color: colors.textTertiary }]}>{inscription.capitaine_email}</Text>
        </View>

        <View style={[styles.statusChip, { backgroundColor: cfg.color + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        <View style={{ marginLeft: 6 }}>
          {expanded
            ? <ChevronUp size={16} color={colors.textTertiary} strokeWidth={2} />
            : <ChevronDown size={16} color={colors.textTertiary} strokeWidth={2} />
          }
        </View>
      </View>

      {/* Expanded: members + payment */}
      {expanded && (
        <View style={[styles.body, { borderTopColor: colors.borderHairline }]}>
          <Text style={[styles.membersTitle, { color: colors.textTertiary }]}>
            {inscription.membres.length} joueur{inscription.membres.length > 1 ? 's' : ''}
          </Text>
          <View style={styles.membersGrid}>
            {inscription.membres.map((m, i) => (
              <View key={i} style={[styles.memberChip, { backgroundColor: accent + '10', borderColor: accent + '30' }]}>
                <View style={[styles.memberNum, { backgroundColor: accent }]}>
                  <Text style={styles.memberNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.memberName, { color: colors.textPrimary }]} numberOfLines={1}>{m}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.payRow, { borderTopColor: colors.borderHairline }]}>
            <View style={styles.payItem}>
              <Text style={[styles.payLabel, { color: colors.textTertiary }]}>Inscription</Text>
              <Text style={[styles.payDate, { color: colors.textSecondary }]}>
                {inscription.dateInscription.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={styles.payItem}>
              <Text style={[styles.payLabel, { color: colors.textTertiary }]}>Paiement</Text>
              <Text style={[styles.payAmount, { color: inscription.montant_payé ? '#16a34a' : colors.textMuted }]}>
                {inscription.montant_payé ? formatPrix(inscription.montant_payé) : '—'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:         { borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  header:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  rankBadge:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rankText:     { fontSize: 12, fontWeight: '800' },
  teamName:     { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  email:        { fontSize: 11, marginTop: 1 },
  statusChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusText:   { fontSize: 10, fontWeight: '700' },
  body:         { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: StyleSheet.hairlineWidth },
  membersTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 12, marginBottom: 8 },
  membersGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  memberChip:   { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, overflow: 'hidden', paddingRight: 10 },
  memberNum:    { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  memberNumText:{ fontSize: 10, fontWeight: '800', color: '#fff' },
  memberName:   { fontSize: 12, fontWeight: '600', maxWidth: 110 },
  payRow:       { flexDirection: 'row', gap: 24, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12 },
  payItem:      { gap: 3 },
  payLabel:     { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  payDate:      { fontSize: 13, fontWeight: '600' },
  payAmount:    { fontSize: 15, fontWeight: '800' },
});
