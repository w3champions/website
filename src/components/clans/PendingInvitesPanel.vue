<template>
  <div>
    <v-card-title>
      Invites Pending:
    </v-card-title>
    <v-card-subtitle v-if="hasNoPendingInvites">
      None pending
    </v-card-subtitle>
    <table class="custom-table" v-if="!hasNoPendingInvites">
      <tr v-for="member in playersClan.pendingInvites" :key="member">
        <td>
          <v-row class="justify-space-between align-center ma-0">
            <v-col class="pa-0">
              <span class="pointer" @click="goToPlayer(member)">
                {{ member.split("#")[0] }}
              </span>
            </v-col>
            <v-col class="text-right pa-0">
              <v-btn @click="revokeInvite(member)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import ClanCreationPanel from "@/components/clans/ClanCreationPanel.vue";
import InvitePlayerModal from "@/components/clans/InvitePlayerModal.vue";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import { getProfileUrl } from '@/helpers/url-functions';

@Component({
  components: { LeagueIcon, InvitePlayerModal, ClanCreationPanel },
})
export default class PendingInvitesPanel extends Vue {
  public search = "";

  public async revokeInvite(member: string) {
    await this.$store.direct.dispatch.clan.revokeInvite(member);
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
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

  public goToPlayer(battleTag: string) {
    this.$router.push({ path: getProfileUrl(battleTag) });
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }

  async mounted() {
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }
}
</script>
