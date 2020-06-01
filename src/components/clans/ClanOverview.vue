<template>
  <v-card-text>
    <div v-if="hasNoClan && !isLoggedInPlayer">
      <v-row class="justify-center">
        <v-col class="text-center">
          <v-card-subtitle>
            This player is not part of a clan
          </v-card-subtitle>
        </v-col>
      </v-row>
    </div>
    <div v-if="hasNoClan && isLoggedInPlayer">
      <clan-creation-panel />
    </div>
    <div v-if="!hasNoClan">
      <v-card-title class="justify-space-between">
        <span>{{ playersClan.clanName }}</span>
        <invite-player-modal v-if="loggedInPlayerIsChiefTain"/>
      </v-card-title>
      <v-card-subtitle
        class="pointer"
        @click="gotToChiefTain"
        v-if="playersClan.isSuccesfullyFounded"
      >
        Chieftain: {{ playersClan.chiefTain.split("#")[0] }}
      </v-card-subtitle>
      <v-card-subtitle v-if="!playersClan.isSuccesfullyFounded">
        This clan is not founded yet
      </v-card-subtitle>
      <div v-if="playersClan.isSuccesfullyFounded">
        <v-card-title>
          Members:
        </v-card-title>
        <v-list>
          <v-list-item
            class="pointer"
            @click="goToPlayer(member)"
            v-for="member in playersClan.members"
            :key="member"
          >
            {{ member.split("#")[0] }}
          </v-list-item>
        </v-list>
      </div>

      <div v-if="!playersClan.isSuccesfullyFounded">
        <v-card-title>
          Signees:
        </v-card-title>
        <table class="custom-table">
          <tr
            v-for="member in playersClan.foundingFathers"
            :key="member"
            @click="goToPlayer(member)"
          >
            <td>
              <span class="pointer" @click="goToPlayer(member)">{{ member.split("#")[0] }}</span>
            </td>
          </tr>
        </table>
        <pending-invites-panel v-if="loggedInPlayerIsChiefTain"/>
      </div>
    </div>
  </v-card-text>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import HeroPicture from "@/components/match-details/HeroPicture.vue";
import { PlayerProfile } from "@/store/player/types";
import ClanCreationPanel from "@/components/clans/ClanCreationPanel.vue";
import InvitePlayerModal from "@/components/clans/InvitePlayerModal.vue";
import PendingInvitesPanel from "@/components/clans/PendingInvitesPanel.vue";

@Component({
  components: { PendingInvitesPanel, InvitePlayerModal, ClanCreationPanel, HeroPicture },
})
export default class ClanOverview extends Vue {
  public searchModel = {} as PlayerProfile;

  public clanNameToCreate = "";
  public search = "";
  public invitePlayerDialog = false;
  public isValidationError = false;

  public isDuplicateName(name: string) {
    return this.searchPlayers.filter((r) => r.name === name).length > 1;
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at lease 3 letters";
    }

    return "No player found";
  }

  public async invitePlayer() {
    await this.$store.direct.dispatch.clan.invitePlayer(
      this.searchModel.battleTag
    );
    if (this.$store.direct.state.clan.clanValidationError) {
      this.isValidationError = true;
    } else {
      await this.$store.direct.dispatch.clan.retrievePlayersClan();
      this.search = "";
      this.invitePlayerDialog = false;
    }
  }

  public closeDialog() {
    this.invitePlayerDialog = false;
    this.isValidationError = false;
    this.search = "";
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.clan.searchPlayers(newValue.toLowerCase());
    } else {
      this.$store.direct.commit.clan.SET_PLAYERS_SEARCH([]);
      this.isValidationError = false;
    }
  }

  public async revokeInvite(member: string) {
    await this.$store.direct.dispatch.clan.revokeInvite(member);
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }

  public changeInsertedClanName(newName: string) {
    this.clanNameToCreate = newName;
  }

  get clanValidationError() {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get hasNoPendingInvites() {
    return this.playersClan?.pendingInvites?.length === 0;
  }

  get searchPlayers() {
    return this.$store.direct.state.clan.searchPlayers;
  }

  public gotToChiefTain() {
    this.goToPlayer(this.playersClan.chiefTain);
  }

  get loggedInPlayerIsChiefTain() {
    return (
      this.playersClan.chiefTain ===
      this.verifiedBtag
    );
  }

  public goToPlayer(battleTag: string) {
    this.$router.push({ path: "/player/" + encodeURIComponent(battleTag) });
  }

  get verifiedBtag() {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag
  }

  get hasNoClan() {
    return !this.playersClan?.id;
  }

  get isLoggedInPlayer() {
    return this.verifiedBtag === this.selectedPlayer;
  }

  get selectedPlayer() {
    return this.$store.direct.state.player.battleTag
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }

  async mounted() {
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }
}
</script>
