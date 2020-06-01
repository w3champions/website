<template>
  <v-card-text>
    <br />
    <br />
    <v-row class="justify-center">
      <v-col class="text-end">
        <v-btn outlined color="error" @click="leaveClan">Leave Clan</v-btn>
      </v-col>
    </v-row>
  </v-card-text>
</template>
<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class LeaveClanModal extends Vue {
  get clanName() {
    return this.$store.direct.state.clan.selectedMemberShip.clanName;
  }

  public async leaveClan() {
    await this.$store.direct.dispatch.clan.leaveClan();
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
    await this.$store.direct.dispatch.clan.retrievePlayersMembership();
  }
}
</script>
