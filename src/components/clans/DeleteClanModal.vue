<template>
  <v-card-text>
    <v-row class="justify-center">
      <v-col class="text-end">
        <v-dialog v-model="dialog" persistent max-width="400px">
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" outlined color="error">
              {{ $t("components_clans_deleteclanmodal.delete") }} {{ clanName }}
            </v-btn>
          </template>
          <v-card>
            <v-card-title class="text-center">
              <span>
                {{ $t("components_clans_deleteclanmodal.areyousuredelete") }}
                {{ clanName }}?
              </span>
            </v-card-title>
            <v-card-actions>
              <v-spacer />
              <v-btn color="blue darken-1" text @click="closeDialog">
                {{ $t("components_clans_deleteclanmodal.close") }}
              </v-btn>
              <v-btn color="blue darken-1" text @click="leaveClan">
                {{ $t("components_clans_deleteclanmodal.delete") }}
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
import { Component } from "vue-property-decorator";

@Component({})
export default class DeleteClanModal extends Vue {
  public dialog = false;

  public closeDialog(): void {
    this.dialog = false;
  }

  get clanName(): string {
    return this.$store.direct.state.clan.playersClan.clanName;
  }

  public async leaveClan(): Promise<void> {
    await this.$store.direct.dispatch.clan.deleteClan();
    this.dialog = false;
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
    await this.$store.direct.dispatch.clan.retrievePlayersMembership();
  }
}
</script>
