<template>
  <v-card-text>
    <v-row class="justify-center">
      <v-col class="text-center">
        <h3>
          {{ $t("components_clans_acceptinvitepanel.invitemsg1") }}
          <b>{{ clanName }}</b>
          {{ $t("components_clans_acceptinvitepanel.invitemsg2") }}
        </h3>
      </v-col>
    </v-row>

    <v-row class="justify-center">
      <v-col cols="3" class="text-center">
        <v-btn @click="joinClan">
          {{ $t("components_clans_acceptinvitepanel.join") }}
          {{ clanName }} !
        </v-btn>
      </v-col>
      <v-col cols="3" class="text-center">
        <v-btn outlined @click="rejectClan">
          {{ $t("components_clans_acceptinvitepanel.reject") }}
        </v-btn>
      </v-col>
    </v-row>
  </v-card-text>
</template>
<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { useClanStore } from "@/store/clan/store";

@Component({})
export default class AcceptInvitePanel extends Vue {
  private clanStore = useClanStore();

  get clanName(): string {
    return this.clanStore.selectedMemberShip.clanName;
  }

  public async joinClan(): Promise<void> {
    await this.clanStore.acceptInvite();
    await this.clanStore.retrievePlayersClan();
    await this.clanStore.retrievePlayersMembership();
  }

  public async rejectClan(): Promise<void> {
    await this.clanStore.rejectInvite();
    await this.clanStore.retrievePlayersClan();
    await this.clanStore.retrievePlayersMembership();
  }
}
</script>
