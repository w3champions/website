<template>
  <v-dialog v-model="dialog" max-width="600px">
    <template v-slot:activator="{ on }">
      <v-btn
        @click="dialog = true"
        class="ma-0"
        outlined
        v-on="on"
        color="primary"
      >
        <v-icon left>{{ mdiPencil }}</v-icon>
        <span>{{ $t("components_clans_inviteplayermodal.inviteplayer") }}</span>
      </v-btn>
    </template>
    <v-card class="pa-4">
      <v-card-title>
        <span>{{ $t("components_clans_inviteplayermodal.inviteplayer") }}</span>
      </v-card-title>
      <v-card-text>
        <player-search
          @searchCleared="searchCleared"
          @playerFound="playerFound"
          classes="ml-5 mr-5"
        ></player-search>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="blue darken-1"
          text
          :disabled="!player"
          @click="invitePlayer"
        >
          {{ $t("components_clans_inviteplayermodal.inviteplayer") }}
        </v-btn>
      </v-card-actions>

      <v-alert
        v-model="clanValidationError"
        type="warning"
        dense
        class="ml-4 mr-4"
        dismissible
      >
        {{ clanValidationErrorText }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { useClanStore } from "@/store/clan/store";
import { mdiMagnify, mdiPencil } from "@mdi/js";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { usePlayerSearchStore } from "@/store/playerSearch/store";

@Component({ components: { PlayerSearch } })
export default class InvitePlayerModal extends Vue {
  public mdiMagnify = mdiMagnify;
  public mdiPencil = mdiPencil;
  public player = "";
  private playerSearchStore = usePlayerSearchStore();

  public dialog = false;
  private clanStore = useClanStore();

  get clanValidationErrorText(): string {
    return this.clanStore.clanValidationError;
  }

  get clanValidationError(): boolean {
    return this.clanStore.clanValidationError !== "";
  }

  set clanValidationError(_val: boolean) {
    this.clanStore.clanValidationError = "";
  }

  public async invitePlayer(): Promise<void> {
    await this.clanStore.invitePlayer(this.player);
    await this.clanStore.retrievePlayersClan();
    this.playerSearchStore.clearPlayerSearch();
  }

  playerFound(bTag: string): void {
    this.player = bTag;
  }

  searchCleared(): void {
    this.player = "";
  }
}
</script>
