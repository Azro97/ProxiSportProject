// src/types/index.ts
// Navigation param lists only.
// Domain types (Match, Terrain, Equipe, Filtre, Division) are in src/models/

export type RootStackParamList = {
  MainTabs: undefined;
  MatchDetail: { matchId: string };
  TeamDetail: { equipeId: string };
  TournoiDetail: { tournoiId: string };
  RechercheEquipes: undefined;
  AdminLogin: undefined;
  AdminMain: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminTournoiDetail: { tournoiId: string };
  AdminCreateTournoi: undefined;
};

export type BottomTabParamList = {
  Carte: undefined;
  Matchs: undefined;
  Tournois: undefined;
};
