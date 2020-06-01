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
    <accept-invite-panel v-if="hasPendingInvite && isLoggedInPlayer" />
    <clan-creation-panel v-if="!hasPendingInvite && hasNoClan && isLoggedInPlayer" />
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
import { Component } from "vue-property-decorator";
import ClanCreationPanel from "@/components/clans/ClanCreationPanel.vue";
import InvitePlayerModal from "@/components/clans/InvitePlayerModal.vue";
import PendingInvitesPanel from "@/components/clans/PendingInvitesPanel.vue";
import AcceptInvitePanel from "@/components/clans/AcceptInvitePanel.vue";

@Component({
  components: { AcceptInvitePanel, PendingInvitesPanel, InvitePlayerModal, ClanCreationPanel },
})

export default class ClanOverview extends Vue {
  get clanValidationError() {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get hasPendingInvite() {
    return this.$store.direct.state.clan.selectedMemberShip?.pendingInviteFromClan;
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
    await this.$store.direct.dispatch.clan.retrievePlayersMembership();
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }
}
</script>
