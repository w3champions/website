import { moduleActionContext } from "..";
import { Clan, ClanMembership, ClanState } from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { PlayerProfile } from "@/store/player/types";
import { useOauthStore } from "@/store/oauth/store";
import ProfileService from "@/services/ProfileService";
import ClanService from "@/services/ClanService";

const mod = {
  namespaced: true,
  state: {
    playersClan: {},
    clanValidationError: "",
    searchPlayers: [] as PlayerProfile[],
    selectedMemberShip: {},
  } as ClanState,
  actions: {
    async createClan(
      context: ActionContext<ClanState, RootState>,
      clanOptions: { clanName: string; abbreviation: string }
    ) {
      const { commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const response = await ClanService.createClan(
        clanOptions.clanName,
        clanOptions.abbreviation,
        oauthStore.token
      );

      commit.SET_CLAN_ERROR(response);
    },

    async addShaman(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { state, commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const response = await ClanService.addShaman(
        state.playersClan.clanId,
        battleTag,
        oauthStore.token
      );

      commit.SET_CLAN_ERROR(response);
    },

    async removeShaman(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { state, commit  } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const response = await ClanService.removeShaman(
        state.playersClan.clanId,
        battleTag,
        oauthStore.token
      );

      commit.SET_CLAN_ERROR(response);
    },

    async switchChieftain(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { state, commit  } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const response = await ClanService.switchChieftain(
        state.playersClan.clanId,
        battleTag,
        oauthStore.token
      );

      commit.SET_CLAN_ERROR(response);
    },

    async acceptInvite(context: ActionContext<ClanState, RootState>) {
      const {  state } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      await ClanService.acceptInvite(
        state.selectedMemberShip.pendingInviteFromClan,
        state.selectedMemberShip.battleTag,
        oauthStore.token
      );
    },

    async rejectInvite(context: ActionContext<ClanState, RootState>) {
      const {  state } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      await ClanService.rejectInvite(
        state.selectedMemberShip.pendingInviteFromClan,
        state.selectedMemberShip.battleTag,
        oauthStore.token
      );
    },

    async retrievePlayersClan(context: ActionContext<ClanState, RootState>) {
      const { commit,  rootState } = moduleActionContext(context, mod);

      const response = await ClanService.retrieveClanForPlayer(
        rootState.player.battleTag
      );

      commit.SET_PLAYERS_CLAN(response);
    },

    async deleteClan(context: ActionContext<ClanState, RootState>) {
      const { state  } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      await ClanService.deleteClan(
        state.playersClan.clanId,
        oauthStore.token
      );
    },

    async leaveClan(context: ActionContext<ClanState, RootState>) {
      const { state  } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      await ClanService.leaveClan(
        state.playersClan.clanId,
        state.selectedMemberShip.battleTag,
        oauthStore.token
      );
    },

    async retrievePlayersMembership(context: ActionContext<ClanState, RootState>) {
      const { commit,  rootState } = moduleActionContext(context, mod);

      const response = await ClanService.retrievePlayerMembership(
        rootState.player.battleTag
      );

      commit.SET_PLAYERS_MEMBERSHIP(response);
    },

    async revokeInvite(
      context: ActionContext<ClanState, RootState>,
      battleTagId: string
    ) {
      const { state  } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      await ClanService.revokeInvite(
        battleTagId,
        state.playersClan.clanId,
        oauthStore.token
      );
    },

    async searchPlayers(
      context: ActionContext<ClanState, RootState>,
      search: string
    ) {
      const { commit } = moduleActionContext(context, mod);

      const response = await ProfileService.searchPlayer(search);

      commit.SET_PLAYERS_SEARCH(response);
    },

    async invitePlayer(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { commit, state  } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const response = await ClanService.invitePlayer(
        battleTag,
        state.playersClan.clanId,
        oauthStore.token
      );

      commit.SET_CLAN_ERROR(response);
    },

    async kickPlayer(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { commit, state } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const response = await ClanService.kickPlayer(
        battleTag,
        state.playersClan.clanId,
        oauthStore.token
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
    SET_PLAYERS_SEARCH(state: ClanState, players: PlayerProfile[]) {
      state.searchPlayers = players;
    },
    SET_PLAYERS_MEMBERSHIP(state: ClanState, memberShip: ClanMembership) {
      state.selectedMemberShip = memberShip;
    },
  },
} as const;

export default mod;
