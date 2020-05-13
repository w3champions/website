import { moduleActionContext } from "..";
import {PlayerState, PlayerProfile, PlayerStatsRaceOnMapVersusRace} from "./types";
import {EGameMode, Match, RootState} from "../typings";
import { ActionContext } from "vuex";
import {Season, Gateways} from "@/store/ranking/types";

const mod = {
  namespaced: true,
  state: {
    playerStatsRaceVersusRaceOnMap: {} as PlayerStatsRaceOnMapVersusRace,
    battleTag: "",
    page: 0,
    totalMatches: 0,
    playerProfile: {} as PlayerProfile,
    matches: [] as Match[],
    loadingProfile: false,
    loadingRecentMatches: false,
    opponentTag: "",
    selectedSeason: {} as Season,
    gateway: 20 as Gateways,
    gameMode: 0 as EGameMode
  } as PlayerState,
  actions: {
    async loadProfile(
      context: ActionContext<PlayerState, RootState>,
      battleTag: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      commit.SET_LOADING_PROFILE(true);

      const profile = await rootGetters.profileService.retrieveProfile(
        battleTag
      );

      commit.SET_PROFILE(profile);
      commit.SET_LOADING_PROFILE(false);
    },
    async loadPlayerStatsRaceVersusRaceOnMap(
      context: ActionContext<PlayerState, RootState>,
      battleTag: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const profile = await rootGetters.profileService.retrievePlayerStatsRaceVersusRaceOnMap(
        battleTag
      );

      commit.SET_PLAYER_STATS_RACE_VERSUS_RACE_ON_MAP(profile);
    },
    async loadMatches(
      context: ActionContext<PlayerState, RootState>,
      search: {page?: number, gameMode: EGameMode}
    ) {
      const { commit, rootGetters, state } = moduleActionContext(context, mod);

      if (search.page != null && !isNaN(search.page)) {
        commit.SET_PAGE(search.page - 1);
      }
      
      commit.SET_GAMEMODE(search.gameMode);
      commit.SET_LOADING_RECENT_MATCHES(true);
      const response = await rootGetters.matchService.retrievePlayerMatches(
        state.page,
        state.battleTag,
        state.opponentTag,
        state.gameMode,
        state.gateway
      );
      commit.SET_TOTAL_MATCHES(response.count);
      commit.SET_MATCHES(response.matches);
      commit.SET_LOADING_RECENT_MATCHES(false);
    },
    async setGateway(
      context: ActionContext<PlayerState, RootState>,
      gateway: Gateways
    ) {
      const { commit, dispatch, state } = moduleActionContext(context, mod);
      commit.SET_GATEWAY(gateway);
      commit.SET_PAGE(0);

      if (state.battleTag) {
        await dispatch.loadMatches({page: 1, gameMode: state.gameMode});
      }
    },
  },
  mutations: {
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
    SET_BATTLE_TAG(state: PlayerState, battleTag: string) {
      state.battleTag = battleTag;
    },
    SET_OPPONENT_TAG(state: PlayerState, opponentTag: string) {
      state.opponentTag = opponentTag;
    },
    SET_PLAYER_STATS_RACE_VERSUS_RACE_ON_MAP(state: PlayerState, stats: PlayerStatsRaceOnMapVersusRace) {
      state.playerStatsRaceVersusRaceOnMap = stats;
    },
    SET_SELECTED_SEASON(state: PlayerState, season: Season) {
      state.selectedSeason = season;
    },
    SET_GATEWAY(state: PlayerState, gateway: Gateways) {
      state.gateway = gateway;
    },
    SET_GAMEMODE(state: PlayerState, gameMode: EGameMode) {
      state.gameMode = gameMode;
    },
  }
} as const;

export default mod;
