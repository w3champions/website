<template>
  <div>
    <v-dialog v-model="dialog" max-width="900px">
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
      <v-card class="pa-4">
        <v-card-title>
          Clan Management
        </v-card-title>
        <v-row>
          <v-col>
            <invite-player-panel v-if="loggedInPlayerIsShaman" />
          </v-col>
          <v-col>
            <kick-player-panel
              v-if="loggedInPlayerIsShaman && playersClan.isSuccesfullyFounded"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <shaman-management-panel
              v-if="
                loggedInPlayerIsChiefTain && playersClan.isSuccesfullyFounded
              "
            />
          </v-col>
          <v-col>
            <switch-chieftain-panel v-if="loggedInPlayerIsChiefTain" />
          </v-col>
        </v-row>

        <delete-clan-modal v-if="loggedInPlayerIsChiefTain" />

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
import KickPlayerPanel from "@/components/clans/KickPlayerPanel.vue";
import ShamanManagementPanel from "@/components/clans/ShamanManagementPanel.vue";
import SwitchChieftainPanel from "@/components/clans/SwitchChieftainPanel.vue";
import InvitePlayerPanel from "@/components/clans/InvitePlayerPanel.vue";
import DeleteClanModal from "@/components/clans/DeleteClanModal.vue";

@Component({
  components: {
    DeleteClanModal,
    InvitePlayerPanel,
    SwitchChieftainPanel,
    ShamanManagementPanel,
    KickPlayerPanel,
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
