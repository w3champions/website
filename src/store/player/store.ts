import {
  ModeStat,
  PlayerMmrRpTimeline,
  PlayerProfile,
  PlayerState,
  PlayerStatsHeroOnMapVersusRace,
  PlayerStatsRaceOnMapVersusRace,
  RaceStat,
  PlayerGameLengthStats,
} from "./types";
import { EGameMode, ERaceEnum, Match } from "../types";
import { Season } from "@/store/ranking/types";
import { useOauthStore } from "@/store/oauth/store";
import { useRootStateStore } from "@/store/rootState/store";
import ProfileService from "@/services/ProfileService";
import MatchService from "@/services/MatchService";
import { defineStore } from "pinia";

export const usePlayerStore = defineStore("player", {
  state: (): PlayerState => ({
    isInitialized: false,
    playerStatsRaceVersusRaceOnMap: {} as PlayerStatsRaceOnMapVersusRace,
    playerStatsHeroVersusRaceOnMap: {} as PlayerStatsHeroOnMapVersusRace,
    battleTag: "",
    page: 0,
    totalMatches: 0,
    playerProfile: {} as PlayerProfile,
    matches: [] as Match[],
    loadingProfile: false,
    loadingRecentMatches: false,
    loadingMmrRpTimeline: true,
    opponentTag: "",
    selectedSeason: {} as Season,
    gameMode: 0 as EGameMode,
    race: 0 as ERaceEnum,
    playerRace: 16 as ERaceEnum,
    opponentRace: 16 as ERaceEnum,
    ongoingMatch: {} as Match,
    gameModeStats: [] as ModeStat[],
    raceStats: [] as RaceStat[],
    mmrRpTimeline: {} as PlayerMmrRpTimeline | undefined,
    playerGameLengthStats: {} as PlayerGameLengthStats | undefined,
  } as PlayerState),
  actions: {
    async loadProfile(params: { battleTag: string; freshLogin: boolean }) {
      this.SET_LOADING_PROFILE(true);
      const oauthStore = useOauthStore();
      const profile = await ProfileService.retrieveProfile(
        params.battleTag,
        params.freshLogin ? oauthStore.token : null,
      );
      this.SET_PROFILE(profile);
      this.SET_SELECTED_SEASON(profile.participatedInSeasons[0]);
      this.SET_LOADING_PROFILE(false);
    },
    async loadGameModeStats(params: { battleTag?: string; season?: number }) {
      const rootStateStore = useRootStateStore();
      const modeStats = await ProfileService.retrieveGameModeStats(
        params.battleTag ?? this.battleTag,
        rootStateStore.gateway,
        params.season ?? this.selectedSeason?.id ?? -1,
      );
      this.SET_MODE_STATS(modeStats);
    },
    async loadRaceStats() {
      const rootStateStore = useRootStateStore();
      const raceStats = await ProfileService.retrieveRaceStats(
        this.battleTag,
        rootStateStore.gateway,
        this.selectedSeason?.id ?? -1,
      );
      this.SET_RACE_STATS(raceStats);
    },
    async loadPlayerStatsRaceVersusRaceOnMap(battleTag: string) {
      const profile =
        await ProfileService.retrievePlayerStatsRaceVersusRaceOnMap(
          battleTag,
          this.selectedSeason?.id ?? -1,
        );
      this.SET_PLAYER_STATS_RACE_VERSUS_RACE_ON_MAP(profile);
    },
    async loadPlayerStatsHeroVersusRaceOnMap(battleTag: string) {
      const profile =
        await ProfileService.retrievePlayerStatsHeroVersusRaceOnMap(
          battleTag,
          this.selectedSeason?.id ?? -1,
        );
      this.SET_PLAYER_STATS_HERO_VERSUS_RACE_ON_MAP(profile);
    },
    async loadMatches(page?: number) {
      if (page != null && !isNaN(page)) {
        this.SET_PAGE(page - 1);
      }
      this.SET_LOADING_RECENT_MATCHES(true);
      const rootStateStore = useRootStateStore();
      const response = await MatchService.retrievePlayerMatches(
        this.page,
        this.battleTag,
        this.opponentTag,
        this.gameMode,
        this.playerRace,
        this.opponentRace,
        rootStateStore.gateway,
        this.selectedSeason?.id ?? -1,
      );
      this.SET_TOTAL_MATCHES(response.count);
      this.SET_MATCHES(response.matches);
      this.SET_LOADING_RECENT_MATCHES(false);
    },
    async loadOngoingPlayerMatch(playerId: string) {
      const response = await MatchService.retrieveOnGoingPlayerMatch(playerId);
      this.SET_ONGOING_MATCH(response || {});
    },
    async reloadPlayer() {
      this.SET_PAGE(0);
      if (this.battleTag) {
        await this.loadMatches(1);
        await this.loadRaceStats();
        await this.loadGameModeStats({});
        await this.loadPlayerMmrRpTimeline();
        await this.loadPlayerGameLengths();
        await this.loadPlayerStatsHeroVersusRaceOnMap;
      }
    },
    async loadPlayerMmrRpTimeline() {
      this.SET_LOADING_MMR_TIMELINE(true);
      const rootStateStore = useRootStateStore();
      const mmrRpTimeline =
        await ProfileService.retrievePlayerMmrRpTimeline(
          this.battleTag,
          this.race,
          rootStateStore.gateway,
          this.selectedSeason?.id ?? -1,
          this.gameMode,
        );
      this.SET_MMR_RP_TIMELINE(mmrRpTimeline);
      this.SET_LOADING_MMR_TIMELINE(false);
    },
    async loadPlayerGameLengths() {
      const playerGameLengthStats = await ProfileService.retrievePlayerGameLengthStats(
        this.battleTag,
        this.selectedSeason?.id ?? -1,
      );
      this.SET_PLAYER_GAME_LENGTH_STATS(playerGameLengthStats);
    },
    SET_INITIALIZED(): void {
      this.isInitialized = true;
    },
    SET_PROFILE(profile: PlayerProfile): void {
      this.playerProfile = profile;
    },
    SET_PAGE(page: number): void {
      this.page = page;
    },
    SET_TOTAL_MATCHES(totalMatches: number): void {
      this.totalMatches = totalMatches;
    },
    SET_MATCHES(matches: Match[]): void {
      this.matches = matches;
    },
    SET_LOADING_PROFILE(loading: boolean): void {
      this.loadingProfile = loading;
    },
    SET_LOADING_RECENT_MATCHES(loading: boolean): void {
      this.loadingRecentMatches = loading;
    },
    SET_LOADING_MMR_TIMELINE(loading: boolean): void {
      this.loadingMmrRpTimeline = loading;
    },
    SET_BATTLE_TAG(battleTag: string): void {
      this.battleTag = battleTag;
    },
    SET_OPPONENT_TAG(opponentTag: string): void {
      this.opponentTag = opponentTag;
    },
    SET_PLAYER_STATS_RACE_VERSUS_RACE_ON_MAP(stats: PlayerStatsRaceOnMapVersusRace): void {
      this.playerStatsRaceVersusRaceOnMap = stats;
    },
    SET_PLAYER_STATS_HERO_VERSUS_RACE_ON_MAP(stats: PlayerStatsHeroOnMapVersusRace): void {
      this.playerStatsHeroVersusRaceOnMap = stats;
    },
    SET_SELECTED_SEASON(season: Season): void {
      this.selectedSeason = season;
    },
    SET_GAMEMODE(gameMode: EGameMode): void {
      this.gameMode = gameMode;
    },
    SET_RACE(race: ERaceEnum): void {
      this.race = race;
    },
    SET_PLAYER_RACE(playerRace: ERaceEnum): void {
      this.playerRace = playerRace;
    },
    SET_OPPONENT_RACE(opponentRace: ERaceEnum): void {
      this.opponentRace = opponentRace;
    },
    SET_ONGOING_MATCH(match: Match): void {
      this.ongoingMatch = match;
    },
    SET_MODE_STATS(stats: ModeStat[]): void {
      this.gameModeStats = stats;
    },
    SET_RACE_STATS(stats: RaceStat[]): void {
      this.raceStats = stats;
    },
    SET_MMR_RP_TIMELINE(mmrRpTimeline: PlayerMmrRpTimeline | undefined): void {
      this.mmrRpTimeline = mmrRpTimeline;
    },
    SET_PLAYER_GAME_LENGTH_STATS(playerGameLengthStats: PlayerGameLengthStats | undefined): void {
      this.playerGameLengthStats = playerGameLengthStats;
    }
  },
});
