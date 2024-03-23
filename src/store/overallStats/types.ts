import { EGameMode, EPick, ERaceEnum, timestampString } from "@/store/types";
import { Gateways } from "@/store/ranking/types";

export type OverallStatisticState = {
  gamesPerDay: GameDayPerMode[][];
  loadingGamesPerDayStats: boolean;
  playersPerDay: GameDay[];
  loadingPlayersPerDayStats: boolean;
  statsPerMapAndRace: StatsPerWinrate[];
  gameLengths: GameLength[];
  matchupLength: MatchupLength;
  playedHeroes: PlayedHeroByMode[];
  heroWinrate: WinLoss;
  loadingMapAndRaceStats: boolean;
  mmrDistribution: MmrDistribution;
  heroPicks: HeroPick[];
  matchesOnMapPerSeason: MatchesOnMapPerSeason[];
  popularHours: PopularHours[];
  matchupMmrRange: MmrRangeValues;
};

export interface PlayedHeroPick {
  pick: EPick;
  stats: PlayedHero[];
}

export interface PlayedHeroByMode {
  gameMode: EGameMode;
  orderedPicks: PlayedHeroPick[];
}

export interface PlayedHero {
  icon: string;
  count: number;
}

export type GameDay = {
  date: timestampString;
  gamesPlayed: number;
  id: string;
};

export type MmrCount = {
  mmr: number;
  count: number;
};

export interface HeroPick {
  name: string;
  heroId: string;
  race: ERaceEnum;
}

export type MmrDistribution = {
  top2PercentIndex: number;
  top5PercentIndex: number;
  top10PercentIndex: number;
  top25PercentIndex: number;
  top50PercentIndex: number;
  distributedMmrs: MmrCount[];
  standardDeviation: number;
};

export type PlayersPerDay = {
  date: timestampString;
  distinctPlayers: number;
};

export interface GameDayPerMode {
  gameMode: EGameMode;
  gameDays: GameDay[];
}

export interface WinLoss {
  wins: number;
  losses: number;
  winrate: number;
  games: number;
}

export interface RaceWinLoss extends WinLoss {
  race: ERaceEnum;
}

export type Ratio = {
  race: ERaceEnum;
  winLosses: RaceWinLoss[];
};

export type StatsPerMapAndRace = {
  mapName: string;
  ratio: Ratio[];
};

export type StatsPerWinrate = {
  mmrRange: number;
  statsPerModes: StatsPerMapAndRace[];
  patchToStatsPerModes: { [patch: string]: StatsPerMapAndRace[] };
};

export interface Length {
  seconds: number;
  games: number;
}

export interface GameLength {
  gameMode: EGameMode;
  lengths: Length[];
}

export interface MatchupLength {
  id: string;
  lengthsByMmrRange: LengthsByMmrRange;
  race1: string;
  race2: string;
  season: number;
}

export enum MmrRangeValues {
  ALL = "all",
  M600 = "600",
  M800 = "800",
  M1000 = "1000",
  M1200 = "1200",
  M1400 = "1400",
  M1600 = "1600",
  M1800 = "1800",
  M2000 = "2000",
  M2200 = "2200",
  M2400 = "2400",
  M2600 = "2600",
  M2800 = "2800",
  M3000 = "3000",
}

export interface LengthsByMmrRange {
  [MmrRangeValues.ALL]: Length[];
  [MmrRangeValues.M600]: Length[];
  [MmrRangeValues.M800]: Length[];
  [MmrRangeValues.M1000]: Length[];
  [MmrRangeValues.M1200]: Length[];
  [MmrRangeValues.M1400]: Length[];
  [MmrRangeValues.M1600]: Length[];
  [MmrRangeValues.M1800]: Length[];
  [MmrRangeValues.M2000]: Length[];
  [MmrRangeValues.M2200]: Length[];
  [MmrRangeValues.M2400]: Length[];
  [MmrRangeValues.M2600]: Length[];
  [MmrRangeValues.M2800]: Length[];
  [MmrRangeValues.M3000]: Length[];
}

export interface PopularHours {
  gameMode: EGameMode;
  timeslots: Timeslot[];
}

export interface Timeslot {
  games: number;
  minutes: number;
  hours: number;
}

export interface MapCount {
  map: string;
  mapName: string;
  count: number;
}

export interface MatchesOnMapPerMode {
  gameMode: EGameMode;
  maps: MapCount[];
}

export interface MatchesOnMapPerSeason {
  matchesOnMapPerModes: MatchesOnMapPerMode[];
  season: number;
}

export interface SeasonGameModeGateWayForMMR {
  season: number;
  gameMode: EGameMode;
  gateWay: Gateways;
}
