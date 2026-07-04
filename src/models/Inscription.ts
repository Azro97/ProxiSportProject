export type InscriptionStatut = 'en_attente_paiement' | 'confirmée' | 'annulée';

export interface Inscription {
  id: string;
  tournoi_id: string;
  equipe_id: string;
  equipe_nom: string;
  capitaine_uid: string;
  dateInscription: Date;
  statut: InscriptionStatut;
  stripe_payment_intent_id?: string;
  montant_payé?: number;
}
