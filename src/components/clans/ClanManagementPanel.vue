<template>
  <div>
    <v-dialog v-model="dialog" max-width="600px">
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
        <kick-player-modal
          v-if="loggedInPlayerIsShaman && playersClan.isSuccesfullyFounded"
        />
        <shaman-management-modal
          v-if="loggedInPlayerIsChiefTain && playersClan.isSuccesfullyFounded"
        />
        <switch-chieftain-panel
          v-if="loggedInPlayerIsChiefTain"
        />
        <v-alert
          v-model="isValidationError"
          type="warning"
          dense
          class="ml-4 mr-4"
          dismissible
        >
          {{ clanValidationError }}
        </v-alert>
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
import SwitchChieftainPanel from "@/components/clans/SwitchChieftainPanel.vue";

@Component({
  components: {
    SwitchChieftainPanel,
    ShamanManagementModal,
    KickPlayerModal,
    InvitePlayerModal,
  },
})
export default class ClanManagementPanel extends Vue {
  public dialog = false;

  get loggedInPlayerIsChiefTain() {
    return this.playersClan.chiefTain === this.verifiedBtag;
  }

  get loggedInPlayerIsShaman() {
    return (
      this.playersClan.shamans.find((s) => s === this.verifiedBtag) ||
      this.loggedInPlayerIsChiefTain
    );
  }

  get verifiedBtag() {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }

  get clanValidationError() {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get isValidationError() {
    return this.$store.direct.state.clan.clanValidationError !== "";
  }
}
</script>
