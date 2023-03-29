import { Clan, ClanMembership, ClanState } from "./types";
import { PlayerProfile } from "@/store/player/types";
import { useOauthStore } from "@/store/oauth/store";
import ProfileService from "@/services/ProfileService";
import ClanService from "@/services/ClanService";
import { usePlayerStore } from "@/store/player/store";
import { defineStore } from "pinia";

export const useClanStore = defineStore("clan", {
  state: (): ClanState => ({
    playersClan: {} as Clan,
    clanValidationError: "",
    searchPlayers: [] as PlayerProfile[],
    selectedMemberShip: {} as ClanMembership,
  }),
  actions: {
    async createClan(clanOptions: { clanName: string; abbreviation: string }) {
      const oauthStore = useOauthStore();
      const response = await ClanService.createClan(
        clanOptions.clanName,
        clanOptions.abbreviation,
        oauthStore.token,
      );
      this.SET_CLAN_ERROR(response);
    },
    async addShaman(battleTag: string) {
      const oauthStore = useOauthStore();
      const response = await ClanService.addShaman(
        this.playersClan.clanId,
        battleTag,
        oauthStore.token,
      );
      this.SET_CLAN_ERROR(response);
    },
    async removeShaman(battleTag: string) {
      const oauthStore = useOauthStore();
      const response = await ClanService.removeShaman(
        this.playersClan.clanId,
        battleTag,
        oauthStore.token,
      );
      this.SET_CLAN_ERROR(response);
    },
    async switchChieftain(battleTag: string) {
      const oauthStore = useOauthStore();
      const response = await ClanService.switchChieftain(
        this.playersClan.clanId,
        battleTag,
        oauthStore.token,
      );
      this.SET_CLAN_ERROR(response);
    },
    async acceptInvite() {
      const oauthStore = useOauthStore();
      await ClanService.acceptInvite(
        this.selectedMemberShip.pendingInviteFromClan,
        this.selectedMemberShip.battleTag,
        oauthStore.token,
      );
    },
    async rejectInvite() {
      const oauthStore = useOauthStore();
      await ClanService.rejectInvite(
        this.selectedMemberShip.pendingInviteFromClan,
        this.selectedMemberShip.battleTag,
        oauthStore.token,
      );
    },
    async retrievePlayersClan() {
      const player = usePlayerStore();
      const response = await ClanService.retrieveClanForPlayer(
        player.battleTag,
      );
      this.SET_PLAYERS_CLAN(response);
    },
    async deleteClan() {
      const oauthStore = useOauthStore();
      await ClanService.deleteClan(
        this.playersClan.clanId,
        oauthStore.token,
      );
    },
    async leaveClan() {
      const oauthStore = useOauthStore();
      await ClanService.leaveClan(
        this.playersClan.clanId,
        this.selectedMemberShip.battleTag,
        oauthStore.token,
      );
    },
    async retrievePlayersMembership() {
      const player = usePlayerStore();
      const response = await ClanService.retrievePlayerMembership(
        player.battleTag,
      );
      this.SET_PLAYERS_MEMBERSHIP(response);
    },
    async revokeInvite(battleTagId: string) {
      const oauthStore = useOauthStore();
      await ClanService.revokeInvite(
        battleTagId,
        this.playersClan.clanId,
        oauthStore.token,
      );
    },
    async searchForPlayers(search: string) {
      const response = await ProfileService.searchPlayer(search);
      this.SET_PLAYERS_SEARCH(response);
    },
    async invitePlayer(battleTag: string) {
      const oauthStore = useOauthStore();
      const response = await ClanService.invitePlayer(
        battleTag,
        this.playersClan.clanId,
        oauthStore.token,
      );
      this.SET_CLAN_ERROR(response);
    },
    async kickPlayer(battleTag: string) {
      const oauthStore = useOauthStore();
      const response = await ClanService.kickPlayer(
        battleTag,
        this.playersClan.clanId,
        oauthStore.token,
      );
      this.SET_CLAN_ERROR(response);
    },
    SET_PLAYERS_CLAN(clan: Clan): void {
      this.playersClan = clan;
    },
    SET_CLAN_ERROR(error: string): void {
      this.clanValidationError = error;
    },
    SET_PLAYERS_SEARCH(players: PlayerProfile[]): void {
      this.searchPlayers = players;
    },
    SET_PLAYERS_MEMBERSHIP(memberShip: ClanMembership): void {
      this.selectedMemberShip = memberShip;
    },
  },
});
