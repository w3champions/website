<template>
  <v-card-text>
    <br />
    <br />
    <v-row class="justify-center">
      <v-col class="text-end">
        <v-dialog v-model="invitePlayerDialog" persistent max-width="600px">
          <template v-slot:activator="{ on }">
            <v-btn :disabled="isChieftain" v-on="on" outlined color="error">
              {{ $t("components_clans_leaveclanmodal.leaveclan") }}
              {{ clanName }}
            </v-btn>
            <v-card-subtitle class="pr-0" v-if="isChieftain">
              {{ $t("components_clans_leaveclanmodal.promotefirst") }}
            </v-card-subtitle>
          </template>
          <v-card>
            <v-card-title>
              {{ $t("components_clans_leaveclanmodal.areyousureleave") }}
              {{ clanName }}?
            </v-card-title>
            <v-card-actions>
              <v-spacer />
              <v-btn color="blue darken-1" text @click="closeDialog">
                {{ $t("components_clans_leaveclanmodal.close") }}
              </v-btn>
              <v-btn color="blue darken-1" text @click="leaveClan">
                {{ $t("components_clans_leaveclanmodal.leaveclan") }}
                {{ clanName }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-card-text>
</template>
<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LeaveClanModal extends Vue {
  public invitePlayerDialog = false;
  @Prop() isChieftain!: boolean;

  public closeDialog(): void {
    this.invitePlayerDialog = false;
  }

  get clanName(): string {
    return this.$store.direct.state.clan.playersClan.clanName;
  }

  public async leaveClan(): Promise<void> {
    await this.$store.direct.dispatch.clan.leaveClan();
    this.invitePlayerDialog = false;
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
    await this.$store.direct.dispatch.clan.retrievePlayersMembership();
  }
}
</script>
