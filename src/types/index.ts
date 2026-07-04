// src/types/index.ts
// Navigation param lists only.
// Domain types (Match, Terrain, Equipe, Filtre, Division) are in src/models/

export type RootStackParamList = {
  MainTabs: undefined;
  MatchDetail: { matchId: string };
  TeamDetail: { equipeId: string };
  TournoiDetail: { tournoiId: string };
};

export type BottomTabParamList = {
  Carte: undefined;
  Matchs: undefined;
  Tournois: undefined;
  Classements: undefined;
};
