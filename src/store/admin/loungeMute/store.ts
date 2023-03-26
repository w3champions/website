import { LoungeMute, LoungeMuteResponse, LoungeMuteState } from "@/store/admin/loungeMute/types";
import { useOauthStore } from "@/store/oauth/store";
import ModerationService from "@/services/ModerationService";
import { format, parseISO } from "date-fns";
import { defineStore } from "pinia";

export const useLoungeMuteStore = defineStore("loungeMute", {
  state: (): LoungeMuteState => ({
    loungeMutedPlayers: [] as LoungeMuteResponse[],
  }),
  actions: {
    async loadLoungeMutes(): Promise<void> {
      const oauthStore = useOauthStore();
      const loungeMutes = await ModerationService.getLoungeMutes(oauthStore.token);

      loungeMutes.forEach((loungeMute) => {
        loungeMute.insertDate = format(parseISO(loungeMute.insertDate), "yyyy-MM-dd HH:mm:ss");
        loungeMute.endDate = format(parseISO(loungeMute.endDate), "yyyy-MM-dd HH:mm:ss");
      });

      this.SET_LOUNGE_MUTED_PLAYERS(loungeMutes);
    },
    async addLoungeMute(loungeMute: LoungeMute): Promise<void> {
      const oauthStore = useOauthStore();
      await ModerationService.postLoungeMute(oauthStore.token, loungeMute);
    },
    async deleteLoungeMute(battleTag: string): Promise<void> {
      const oauthStore = useOauthStore();
      await ModerationService.deleteLoungeMute(oauthStore.token, battleTag);
    },
    SET_LOUNGE_MUTED_PLAYERS(mutedPlayers: LoungeMuteResponse[]): void {
      this.loungeMutedPlayers = mutedPlayers;
    },
  },
});
