import { ModeStat, PlayerGameLengthStats, PlayerMmrRpTimeline, PlayerProfile, PlayerState, PlayerStatsHeroOnMapVersusRace, PlayerStatsRaceOnMapVersusRace, RaceStat } from "./types";
import { EGameMode, ERaceEnum, Match } from "../types";
import { Season } from "@/store/ranking/types";
import { useOauthStore } from "@/store/oauth/store";
import { useRootStateStore } from "@/store/rootState/store";
import { useRankingStore } from "@/store/ranking/store";
import { usePersonalSettingsStore } from "@/store/personalSettings/store";
import ProfileService from "@/services/ProfileService";
import MatchService from "@/services/MatchService";
import { defineStore } from "pinia";

export const usePlayerStore = defineStore("player", {
  state: (): PlayerState => ({
    playerStatsRaceVersusRaceOnMap: {} as PlayerStatsRaceOnMapVersusRace,
    playerStatsHeroVersusRaceOnMap: {} as PlayerStatsHeroOnMapVersusRace,
    battleTag: "",
    page: 1,
    totalMatches: 0,
    playerProfile: {} as PlayerProfile,
    matches: [] as Match[],
    loadingProfile: false,
    loadingRecentMatches: false,
    loadingMmrRpTimeline: true,
    loadingPlayerStatsHeroVersusRaceOnMap: false,
    opponentTag: "",
    selectedSeason: {} as Season,
    profileMatchesGameMode: EGameMode.UNDEFINED,
    profileStatisticsRace: ERaceEnum.RANDOM,
    profileStatisticsGameMode: EGameMode.GM_1ON1,
    playerRace: undefined,
    opponentRace: undefined,
    selectedHeroes: [] as number[],
    ongoingMatch: {} as Match,
    gameModeStats: [] as ModeStat[],
    raceStats: [] as RaceStat[],
    mmrRpTimeline: {} as PlayerMmrRpTimeline,
    playerGameLengthStats: {} as PlayerGameLengthStats | undefined,
    loadProfileError: undefined,
  } as PlayerState),
  actions: {
    async loadProfile(params: { battleTag: string; freshLogin: boolean }) {
      const oauthStore = useOauthStore();
      try {
        const profile = await ProfileService.retrieveProfile(
          params.battleTag,
          params.freshLogin ? oauthStore.token : null,
        );
        this.SET_PROFILE(profile);
        this.SET_BATTLE_TAG(params.battleTag);
        this.SET_LOAD_PROFILE_ERROR(undefined);
        this.SET_SELECTED_SEASON(profile.participatedInSeasons[0]);
      } catch (err) {
        const ex = err as Error;
        this.SET_LOAD_PROFILE_ERROR(ex.message);
      }
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
      const profile = await ProfileService.retrievePlayerStatsRaceVersusRaceOnMap(
        battleTag,
        this.selectedSeason?.id ?? -1,
      );
      if (profile) {
        this.SET_PLAYER_STATS_RACE_VERSUS_RACE_ON_MAP(profile);
      }
    },
    async loadPlayerStatsHeroVersusRaceOnMap(battleTag: string) {
      const profile = await ProfileService.retrievePlayerStatsHeroVersusRaceOnMap(
        battleTag,
        this.selectedSeason?.id ?? -1,
      );
      this.SET_PLAYER_STATS_HERO_VERSUS_RACE_ON_MAP(profile);
    },
    async loadMatches(page?: number) {
      this.SET_PAGE(page ?? 1);
      this.SET_LOADING_RECENT_MATCHES(true);
      const rootStateStore = useRootStateStore();
      const response = await MatchService.retrievePlayerMatches(
        this.page - 1,
        this.battleTag,
        this.opponentTag,
        this.profileMatchesGameMode,
        this.playerRace ?? ERaceEnum.TOTAL,
        this.opponentRace ?? ERaceEnum.TOTAL,
        rootStateStore.gateway,
        this.selectedSeason?.id ?? -1,
        this.selectedHeroes,
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
      const mmrRpTimeline = await ProfileService.retrievePlayerMmrRpTimeline(
        this.battleTag,
        this.profileStatisticsRace,
        rootStateStore.gateway,
        this.selectedSeason?.id ?? -1,
        this.profileStatisticsGameMode,
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
    async loadAllDataForSelectedSeason() {
      const rankingsStore = useRankingStore();
      await Promise.all([
        this.loadGameModeStats({}),
        this.loadRaceStats(),
        this.loadMatches(1),
        this.loadPlayerStatsRaceVersusRaceOnMap(this.battleTag),
        this.loadPlayerStatsHeroVersusRaceOnMap(this.battleTag),
        this.loadPlayerGameLengths(),
        rankingsStore.retrieveActiveGameModes(),
      ]);
    },
    async initMmrRpTimeline() {
      const rankingsStore = useRankingStore();
      // Make a lookup table for active game modes
      const activeGameModesMap = rankingsStore.activeModes.reduce((acc, mode) => {
        acc[mode.id] = true;
        return acc;
      }, {} as Record<number, boolean>);

      let maxMode = EGameMode.GM_1ON1;
      let maxModeGames = 0;
      this.gameModeStats.forEach((m) => {
        if (!activeGameModesMap[m.gameMode]) return;
        if (m.games > maxModeGames) {
          maxModeGames = m.games;
          maxMode = m.gameMode;
        }
      });
      this.SET_PROFILE_STATISTICS_GAME_MODE(maxMode);

      let maxRace = ERaceEnum.HUMAN;
      let maxRaceGames = 0;
      this.raceStats.forEach((r) => {
        if (r.games > maxRaceGames) {
          maxRaceGames = r.games;
          maxRace = r.race;
        }
      });
      this.SET_PROFILE_STATISTICS_RACE(maxRace);

      await this.loadPlayerMmrRpTimeline();
    },
    async loadFullProfile(params: { battleTag: string; freshLogin: boolean }) {
      this.SET_LOADING_PROFILE(true);
      this.SET_PROFILE({} as PlayerProfile); // clear old data
      try {
        await this.loadProfile(params);
        await this.loadAllDataForSelectedSeason();
        await this.initMmrRpTimeline();
        const personalSettingsStore = usePersonalSettingsStore();
        await personalSettingsStore.loadPersonalSetting();
      } catch (_err) {
        // error already handled in loadProfile
      }
      this.SET_LOADING_PROFILE(false);
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
    SET_LOAD_PROFILE_ERROR(errorMessage: string | undefined): void {
      this.loadProfileError = errorMessage;
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
    SET_PROFILE_MATCHES_GAME_MODE(gameMode: EGameMode): void {
      this.profileMatchesGameMode = gameMode;
    },
    SET_PROFILE_STATISTICS_RACE(race: ERaceEnum): void {
      this.profileStatisticsRace = race;
    },
    SET_PROFILE_STATISTICS_GAME_MODE(gameMode: EGameMode): void {
      this.profileStatisticsGameMode = gameMode;
    },
    SET_PLAYER_RACE(playerRace: ERaceEnum): void {
      this.playerRace = playerRace;
    },
    SET_OPPONENT_RACE(opponentRace: ERaceEnum): void {
      this.opponentRace = opponentRace;
    },
    SET_SELECTED_HEROES(heroes: number[]): void {
      this.selectedHeroes = heroes;
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
    SET_MMR_RP_TIMELINE(mmrRpTimeline: PlayerMmrRpTimeline): void {
      this.mmrRpTimeline = mmrRpTimeline;
    },
    SET_PLAYER_GAME_LENGTH_STATS(playerGameLengthStats: PlayerGameLengthStats | undefined): void {
      this.playerGameLengthStats = playerGameLengthStats;
    },
  },
});
