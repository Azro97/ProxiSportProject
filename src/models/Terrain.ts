// src/models/Terrain.ts

export interface Terrain {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  lat: number;
  lng: number;
  sports: string[]; // e.g. ["foot", "basket"]
}
