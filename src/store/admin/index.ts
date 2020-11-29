import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { AdminState, BannedPlayer, NewsMessage } from "./types";
import moment from "moment";
const mod = {
  namespaced: true,
  state: {
    total: 0,
    players: [],
    news: [],
  } as AdminState,
  actions: {
    async loadNews(context: ActionContext<AdminState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const news = await rootGetters.adminService.getNews();
      commit.SET_NEWS(news);
    },
    async editNews(
      context: ActionContext<AdminState, RootState>,
      newsMessage: NewsMessage
    ) {
      const { rootGetters, rootState, dispatch } = moduleActionContext(
        context,
        mod
      );
      const success = await rootGetters.adminService.editNews(
        newsMessage,
        rootState.oauth.token
      );
      if (success) {
        await dispatch.loadNews();
      }
    },
    async deleteNews(
      context: ActionContext<AdminState, RootState>,
      newsMessage: NewsMessage
    ) {
      const { rootGetters, dispatch, rootState } = moduleActionContext(
        context,
        mod
      );
      const success = await rootGetters.adminService.deleteNews(
        newsMessage,
        rootState.oauth.token
      );
      if (success) {
        await dispatch.loadNews();
      }
    },
    async loadBannedPlayers(context: ActionContext<AdminState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const bannedPlayers = await rootGetters.adminService.getBannedPlayers();
      const bannedChats = await rootGetters.adminService.getBannedChats();

      bannedPlayers.players.forEach(player => {
        const formattedDate = moment(player.endDate, "YYYY-MM-DD").toISOString();
        if (formattedDate) {
          player.endDate = formattedDate.substr(0, 10);
        }
      })

      bannedChats.players.forEach(chatBan => {
        const foundPlayer = bannedPlayers.players.find(p => p.battleTag === chatBan.battleTag);
        if (!foundPlayer) {
          const formattedDate = moment(chatBan.endDate, "YYYY-MM-DD").toISOString();
          if (formattedDate) {
            chatBan.endDate = formattedDate.substr(0, 10);
          }
          chatBan.isOnlyChatBan = true;
          bannedPlayers.players.push(chatBan)
        }
      })

      commit.SET_BANNED_PLAYERS(bannedPlayers.players);
    },
    async postBan(
      context: ActionContext<AdminState, RootState>,
      bannedPlayer: BannedPlayer
    ) {
      const { state, commit, rootState, rootGetters } = moduleActionContext(
        context,
        mod
      );

      if (!bannedPlayer.isOnlyChatBan) {
        await rootGetters.adminService.postBan(
          bannedPlayer,
          rootState.oauth.token
        );
      }

      await rootGetters.adminService.postChatBan(
        bannedPlayer,
        rootState.oauth.token
      );

      let filterPlayer = state.players.filter(
        (p: BannedPlayer) => p.battleTag !== bannedPlayer.battleTag
      );

      commit.SET_BANNED_PLAYERS([bannedPlayer, ...filterPlayer]);
    },
    async deleteBan(
      context: ActionContext<AdminState, RootState>,
      bannedPlayer: BannedPlayer
    ) {
      const { state, commit, rootState, rootGetters } = moduleActionContext(
        context,
        mod
      );

      await rootGetters.adminService.deleteBan(
        bannedPlayer,
        rootState.oauth.token
      );

      await rootGetters.adminService.deleteChatBan(
        bannedPlayer,
        rootState.oauth.token
      );

      const bannedPlayers = state.players.filter(
        (p) => p.battleTag != bannedPlayer.battleTag
      );

      commit.SET_BANNED_PLAYERS(bannedPlayers);
    },
  },
  mutations: {
    SET_NEWS(state: AdminState, news: NewsMessage[]) {
      state.news = news;
    },
    SET_BANNED_PLAYERS(state: AdminState, bannedPlayers: BannedPlayer[]) {
      state.players = bannedPlayers;
    }
  },
} as const;

export default mod;
