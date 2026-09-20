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
  Login: { redirectToMesInscriptions?: boolean } | undefined;
  SignUp: { redirectToMesInscriptions?: boolean } | undefined;
  ForgotPassword: undefined;
  MesInscriptions: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminTournoiDetail: { tournoiId: string };
  AdminCreateTournoi: undefined;
  AdminCreateEquipe: undefined;
};

export type BottomTabParamList = {
  Carte: undefined;
  Matchs: undefined;
  Tournois: undefined;
};
