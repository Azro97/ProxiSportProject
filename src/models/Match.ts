// src/models/Match.ts

export interface Match {
  id: string;
  sport: string;           // "foot" | "basket" | "hand" | "volley"
  equipeA_id: string;
  equipeA_nom: string;     // denormalized for list rendering
  equipeB_id: string;
  equipeB_nom: string;     // denormalized
  terrain_id: string;
  dateHeure: Date;         // converted from Firestore Timestamp in services
  division: 'Nationale' | 'Régionale' | 'Départementale';
  region: string;
  departement: string;
}
