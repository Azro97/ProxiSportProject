export type TournoiStatut = 'ouvert' | 'complet' | 'en_cours' | 'terminé' | 'annulé';

export interface Tournoi {
  id: string;
  nom: string;
  sport: string;
  description: string;
  photoUrl?: string;              // Firebase Storage URL
  terrain_id: string;
  terrain_nom: string;
  terrain_ville: string;
  organisateur_id: string;
  organisateur_nom: string;
  dateDebut: Date;
  dateFin: Date;
  dateClotureInscription: Date;
  prixInscription: number;        // centimes — ex: 3000 = 30,00 €
  maxEquipes: number;
  equipesInscrites: number;       // compteur dénormalisé
  tailleEquipe: number;           // joueurs par équipe — ex: 5 pour 5v5, 4 pour 4v4
  statut: TournoiStatut;
  region: string;
  departement: string;
}
