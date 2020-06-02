import { moduleActionContext } from "..";
import { Clan, ClanMembership, ClanState } from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { PlayerProfile } from "@/store/player/types";

const mod = {
  namespaced: true,
  state: {
    playersClan: {},
    clanValidationError: "",
    loading: true,
    searchPlayers: [] as PlayerProfile[],
    selectedMemberShip: {},
  } as ClanState,
  actions: {
    async createClan(
      context: ActionContext<ClanState, RootState>,
      clanName: string
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      commit.SET_LOADING(true);

      const response = await rootGetters.clanService.createClan(
        clanName,
        rootState.oauth.token
      );

      commit.SET_LOADING(true);
      commit.SET_CLAN_ERROR(response);
    },

    async addShaman(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { state, commit, rootState, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.addShaman(
        state.playersClan.id,
        battleTag,
        rootState.oauth.token
      );

      commit.SET_CLAN_ERROR(response);
    },

    async removeShaman(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { state, commit, rootState, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.removeShaman(
        state.playersClan.id,
        battleTag,
        rootState.oauth.token
      );

      commit.SET_CLAN_ERROR(response);
    },

    async acceptInvite(
      context: ActionContext<ClanState, RootState>
    ) {
      const { rootGetters, state, rootState } = moduleActionContext(context, mod);

      await rootGetters.clanService.acceptInvite(state.selectedMemberShip.pendingInviteFromClan, state.selectedMemberShip.battleTag, rootState.oauth.token);
    },

    async rejectInvite(
      context: ActionContext<ClanState, RootState>
    ) {
      const { rootGetters, state, rootState } = moduleActionContext(context, mod);

      await rootGetters.clanService.rejectInvite(state.selectedMemberShip.pendingInviteFromClan, state.selectedMemberShip.battleTag, rootState.oauth.token);
    },

    async retrievePlayersClan(
      context: ActionContext<ClanState, RootState>,
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.retrieveClanForPlayer(
        rootState.player.battleTag
      );

      commit.SET_PLAYERS_CLAN(response);
    },

    async leaveClan(
      context: ActionContext<ClanState, RootState>,
    ) {
      const { state, rootGetters, rootState } = moduleActionContext(context, mod);

      await rootGetters.clanService.leaveClan(
        state.playersClan.id,
        state.selectedMemberShip.battleTag,
        rootState.oauth.token
      );
    },

    async retrievePlayersMembership(
      context: ActionContext<ClanState, RootState>,
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.retrievePlayerMembership(
        rootState.player.battleTag
      );

      commit.SET_PLAYERS_MEMBERSHIP(response);
    },

    async revokeInvite(
      context: ActionContext<ClanState, RootState>,
      battleTagId: string
    ) {
      const { state, rootGetters, rootState } = moduleActionContext(context, mod);

      await rootGetters.clanService.revokeInvite(
        battleTagId,
        state.playersClan.id,
        rootState.oauth.token
      );
    },

    async searchPlayers(
      context: ActionContext<ClanState, RootState>,
      search: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.profileService.searchPlayer(search);

      commit.SET_PLAYERS_SEARCH(response);
    },

    async invitePlayer(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { commit, state, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      const response = await rootGetters.clanService.invitePlayer(
        battleTag,
        state.playersClan.id,
        rootState.oauth.token
      );

      commit.SET_CLAN_ERROR(response);
    },
  },
  mutations: {
    SET_PLAYERS_CLAN(state: ClanState, clan: Clan) {
      state.playersClan = clan;
    },
    SET_CLAN_ERROR(state: ClanState, error: string) {
      state.clanValidationError = error;
    },
    SET_LOADING(state: ClanState, loading: boolean) {
      state.loading = loading;
    },
    SET_PLAYERS_SEARCH(state: ClanState, players: PlayerProfile[]) {
      state.searchPlayers = players;
    },
    SET_PLAYERS_MEMBERSHIP(state: ClanState, memberShip: ClanMembership) {
      state.selectedMemberShip = memberShip;
    },
  },
} as const;

export default mod;
