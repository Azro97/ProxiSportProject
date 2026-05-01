// src/types/index.ts

export type Sport = 'Football' | 'Basketball' | 'Handball' | 'Rugby' | 'Volleyball';

export type Division = 'Nationale' | 'Régionale' | 'Départementale';

export type DayFilter = 'Aujourd\'hui' | 'Lun' | 'Mar' | 'Mer' | 'Jeu' | 'Ven' | 'Sam' | 'Dim' | 'date';

export interface Match {
  id: string;
  sport: Sport;
  region: string;
  departement: string;
  division: Division;
  dateHeure: Date | string;
  domicile: string;
  exterieur: string;
  scoreDomicile?: number;
  scoreExterieur?: number;
  lieu: string;
  statut: 'À venir' | 'En cours' | 'Terminé';
}

export type RootStackParamList = {
  MainTabs: undefined;
  MatchDetail: { matchId: string };
};

export type BottomTabParamList = {
  Matchs: undefined;
  Classements: undefined;
};
