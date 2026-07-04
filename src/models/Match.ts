import { Division } from './Filtre';

export type MatchStatut = 'à_venir' | 'terminé';

export interface Match {
  id: string;
  sport: string;           // "foot" | "basket" | "hand" | "volley"
  equipeA_id: string;
  equipeA_nom: string;     // denormalized for list rendering
  equipeB_id: string;
  equipeB_nom: string;     // denormalized
  terrain_id: string;
  dateHeure: Date;         // converted from Firestore Timestamp in services
  division: Division;
  region: string;
  departement: string;
  statut?: MatchStatut;    // derived from dateHeure when absent
  scoreA?: number;         // set only when statut === 'terminé'
  scoreB?: number;
}
