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
        <v-icon left>mdi-pencil</v-icon>
        <span>Invite player</span>
      </v-btn>
    </template>
    <v-card class="pa-4">
      <v-card-title>
        <span>Invite Player</span>
      </v-card-title>
      <v-card-text>
        <v-autocomplete
          v-model="searchModel"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          clearable
          :items="searchPlayers"
          :search-input.sync="search"
          :no-data-text="noDataText"
          item-text="battleTag"
          item-value="battleTag"
          placeholder="Start typing to Search"
          return-object
        >
          <template v-slot:item="data">
            <template v-if="typeof data.item !== 'object'">
              <v-list-item-content v-text="data.item"></v-list-item-content>
            </template>
            <template v-else>
              <v-list-item-content>
                <v-list-item-title>
                  <span v-if="!isDuplicateName(data.item.name)">
                    {{ data.item.name }}
                  </span>
                  <span v-if="isDuplicateName(data.item.name)">
                    {{ data.item.battleTag }}
                  </span>
                </v-list-item-title>
              </v-list-item-content>
            </template>
          </template>
        </v-autocomplete>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="blue darken-1"
          text
          :disabled="!search"
          @click="invitePlayer"
        >
          Invite
        </v-btn>
      </v-card-actions>

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
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { PlayerProfile } from "@/store/player/types";

@Component({})
export default class InvitePlayerModal extends Vue {
  public searchModel = {} as PlayerProfile;
  public search = "";

  public dialog = false;

  get loggedInPlayerIsChiefTain() {
    return this.playersClan.chiefTain === this.verifiedBtag;
  }

  get verifiedBtag() {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get clanValidationError() {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get isValidationError() {
    return this.$store.direct.state.clan.clanValidationError !== "";
  }

  public isDuplicateName(name: string) {
    return this.searchPlayers.filter((r) => r.name === name).length > 1;
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at least 3 letters";
    }

    return "No player found";
  }

  public async invitePlayer() {
    await this.$store.direct.dispatch.clan.invitePlayer(
      this.searchModel.battleTag
    );

    await this.$store.direct.dispatch.clan.retrievePlayersClan();
    this.search = "";
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.clan.searchPlayers(newValue.toLowerCase());
    } else {
      this.$store.direct.commit.clan.SET_PLAYERS_SEARCH([]);
    }
  }

  get searchPlayers() {
    return this.$store.direct.state.clan.searchPlayers;
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }
}
</script>
