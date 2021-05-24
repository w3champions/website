import { moduleActionContext } from "..";
import {
  PlayerState,
  PlayerProfile,
  PlayerStatsRaceOnMapVersusRace,
  ModeStat,
  RaceStat,
  PlayerMmrRpTimeline,
} from "./types";
import { EGameMode, ERaceEnum, Match, RootState } from "../typings";
import { ActionContext } from "vuex";
import { Season } from "@/store/ranking/types";

const mod = {
  namespaced: true,
  state: {
    isInitialized: false,
    playerStatsRaceVersusRaceOnMap: {} as PlayerStatsRaceOnMapVersusRace,
    battleTag: "",
    page: 0,
    totalMatches: 0,
    playerProfile: {} as PlayerProfile,
    matches: [] as Match[],
    loadingProfile: false,
    loadingRecentMatches: false,
    loadingMmrRpTimeline: false,
    opponentTag: "",
    selectedSeason: {} as Season,
    gameMode: 0 as EGameMode,
    race: 0 as ERaceEnum,
    ongoingMatch: {} as Match,
    gameModeStats: [] as ModeStat[],
    raceStats: [] as RaceStat[],
    mmrRpTimeline: {} as PlayerMmrRpTimeline | undefined,
  } as PlayerState,
  actions: {
    async loadProfile(
      context: ActionContext<PlayerState, RootState>,
      params: { battleTag: string; freshLogin: boolean }
    ) {
      const { commit, rootState, rootGetters } = moduleActionContext(
        context,
        mod
      );

      commit.SET_LOADING_PROFILE(true);

      const profile = await rootGetters.profileService.retrieveProfile(
        params.battleTag,
        params.freshLogin ? rootState.oauth.token : null
      );

      commit.SET_PROFILE(profile);
      commit.SET_SELECTED_SEASON(profile.participatedInSeasons[0]);
      commit.SET_LOADING_PROFILE(false);
    },
    async loadGameModeStats(
      context: ActionContext<PlayerState, RootState>,
      params: { battleTag?: string; season?: number }
    ) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );

      const modeStats = await rootGetters.profileService.retrieveGameModeStats(
        params.battleTag ?? state.battleTag,
        rootState.gateway,
        params.season ?? state.selectedSeason?.id ?? -1
      );

      commit.SET_MODE_STATS(modeStats);
    },
    async loadRaceStats(context: ActionContext<PlayerState, RootState>) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );

      const raceStats = await rootGetters.profileService.retrieveRaceStats(
        state.battleTag,
        rootState.gateway,
        state.selectedSeason?.id ?? -1
      );

      commit.SET_RACE_STATS(raceStats);
    },
    async loadPlayerStatsRaceVersusRaceOnMap(
      context: ActionContext<PlayerState, RootState>,
      battleTag: string
    ) {
      const { commit, state, rootGetters } = moduleActionContext(context, mod);
      const profile = await rootGetters.profileService.retrievePlayerStatsRaceVersusRaceOnMap(
        battleTag,
        state.selectedSeason?.id ?? -1
      );

      commit.SET_PLAYER_STATS_RACE_VERSUS_RACE_ON_MAP(profile);
    },
    async loadMatches(
      context: ActionContext<PlayerState, RootState>,
      page?: number
    ) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );

      if (page != null && !isNaN(page)) {
        commit.SET_PAGE(page - 1);
      }

      commit.SET_LOADING_RECENT_MATCHES(true);
      const response = await rootGetters.matchService.retrievePlayerMatches(
        state.page,
        state.battleTag,
        state.opponentTag,
        state.gameMode,
        rootState.gateway,
        state.selectedSeason?.id ?? -1
      );
      commit.SET_TOTAL_MATCHES(response.count);
      commit.SET_MATCHES(response.matches);
      commit.SET_LOADING_RECENT_MATCHES(false);
    },
    async loadOngoingPlayerMatch(
      context: ActionContext<PlayerState, RootState>,
      playerId: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.matchService.retrieveOnGoingPlayerMatch(
        playerId
      );
      commit.SET_ONGOING_MATCH(response || {});
    },
    async reloadPlayer(context: ActionContext<PlayerState, RootState>) {
      const { commit, dispatch, state } = moduleActionContext(context, mod);
      commit.SET_PAGE(0);

      if (state.battleTag) {
        await dispatch.loadMatches(1);
        await dispatch.loadRaceStats();
        await dispatch.loadGameModeStats({});
        await dispatch.loadPlayerMmrRpTimeline();
      }
    },
    async loadPlayerMmrRpTimeline(
      context: ActionContext<PlayerState, RootState>
    ) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );
      commit.SET_LOADING_MMR_TIMELINE(true);
      const mmrRpTimeline = await rootGetters.profileService.retrievePlayerMmrRpTimeline(
        state.battleTag,
        state.race,
        rootState.gateway,
        state.selectedSeason?.id ?? -1,
        state.gameMode
      );
      commit.SET_MMR_RP_TIMELINE(mmrRpTimeline);
      commit.SET_LOADING_MMR_TIMELINE(false);
    },
  },
  mutations: {
    SET_INITIALIZED(state: PlayerState) {
      state.isInitialized = true;
    },
    SET_PROFILE(state: PlayerState, profile: PlayerProfile) {
      state.playerProfile = profile;
    },
    SET_PAGE(state: PlayerState, page: number) {
      state.page = page;
    },
    SET_TOTAL_MATCHES(state: PlayerState, totalMatches: number) {
      state.totalMatches = totalMatches;
    },
    SET_MATCHES(state: PlayerState, matches: Match[]) {
      state.matches = matches;
    },
    SET_LOADING_PROFILE(state: PlayerState, loading: boolean) {
      state.loadingProfile = loading;
    },
    SET_LOADING_RECENT_MATCHES(state: PlayerState, loading: boolean) {
      state.loadingRecentMatches = loading;
    },
    SET_LOADING_MMR_TIMELINE(state: PlayerState, loading: boolean) {
      state.loadingMmrRpTimeline = loading;
    },
    SET_BATTLE_TAG(state: PlayerState, battleTag: string) {
      state.battleTag = battleTag;
    },
    SET_OPPONENT_TAG(state: PlayerState, opponentTag: string) {
      state.opponentTag = opponentTag;
    },
    SET_PLAYER_STATS_RACE_VERSUS_RACE_ON_MAP(
      state: PlayerState,
      stats: PlayerStatsRaceOnMapVersusRace
    ) {
      state.playerStatsRaceVersusRaceOnMap = stats;
    },
    SET_SELECTED_SEASON(state: PlayerState, season: Season) {
      state.selectedSeason = season;
    },
    SET_GAMEMODE(state: PlayerState, gameMode: EGameMode) {
      state.gameMode = gameMode;
    },
    SET_RACE(state: PlayerState, race: ERaceEnum) {
      state.race = race;
    },
    SET_ONGOING_MATCH(state: PlayerState, match: Match) {
      state.ongoingMatch = match;
    },
    SET_MODE_STATS(state: PlayerState, stats: ModeStat[]) {
      state.gameModeStats = stats;
    },
    SET_RACE_STATS(state: PlayerState, stats: RaceStat[]) {
      state.raceStats = stats;
    },
    SET_MMR_RP_TIMELINE(
      state: PlayerState,
      mmrRpTimeline: PlayerMmrRpTimeline | undefined
    ) {
      state.mmrRpTimeline = mmrRpTimeline;
    },
  },
} as const;

export default mod;
