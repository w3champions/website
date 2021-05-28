<template>
  <div>
    <v-card-title>
      {{ $t("components_clans_pendinginvitespanel.invitespending") }}
    </v-card-title>
    <v-card-subtitle v-if="hasNoPendingInvites">
      {{ $t("components_clans_pendinginvitespanel.nonepending") }}
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
import { getProfileUrl } from "@/helpers/url-functions";
import { PlayerProfile } from "@/store/player/types";
import { Clan } from "@/store/clan/types";

@Component({
  components: { LeagueIcon, InvitePlayerModal, ClanCreationPanel },
})
export default class PendingInvitesPanel extends Vue {
  public search = "";

  public async revokeInvite(member: string): Promise<void> {
    await this.$store.direct.dispatch.clan.revokeInvite(member);
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }

  get clanValidationError(): string {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get hasNoPendingInvites(): boolean {
    return this.playersClan?.pendingInvites?.length === 0;
  }

  get searchPlayers(): PlayerProfile[] {
    return this.$store.direct.state.clan.searchPlayers;
  }

  public goToPlayer(battleTag: string): void {
    this.$router.push({ path: getProfileUrl(battleTag) });
  }

  get playersClan(): Clan {
    return this.$store.direct.state.clan.playersClan;
  }

  async mounted(): Promise<void> {
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }
}
</script>
