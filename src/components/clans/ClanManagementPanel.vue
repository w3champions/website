<template>
  <div>
    <v-dialog v-model="dialog" persistent max-width="600px">
      <template v-slot:activator="{ on }">
        <v-btn
          @click="dialog = true"
          class="ma-0"
          outlined
          v-on="on"
          color="primary"
        >
          <v-icon left>mdi-pencil</v-icon>
          <span>Clan Management</span>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          Clan Management
        </v-card-title>
        <invite-player-modal v-if="loggedInPlayerIsShaman" />
        <kick-player-modal class="mt-3" v-if="loggedInPlayerIsShaman && playersClan.isSuccesfullyFounded" />
        <shaman-management-modal class="mt-3" v-if="loggedInPlayerIsChiefTain && playersClan.isSuccesfullyFounded" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import InvitePlayerModal from "@/components/clans/InvitePlayerModal.vue";
import KickPlayerModal from "@/components/clans/KickPlayerModal.vue";
import ShamanManagementModal from "@/components/clans/ShamanManagementModal.vue";

@Component({
  components: { ShamanManagementModal, KickPlayerModal, InvitePlayerModal }
})
export default class ClanManagementPanel extends Vue {

  get loggedInPlayerIsChiefTain() {
    return (
            this.playersClan.chiefTain ===
            this.verifiedBtag
    );
  }

  get loggedInPlayerIsShaman() {
    return this.playersClan.shamans.find(s => s === this.verifiedBtag) || this.loggedInPlayerIsChiefTain
  }

  get verifiedBtag() {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }
}
</script>
