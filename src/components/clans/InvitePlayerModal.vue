<template>
  <div>
    <v-dialog v-model="invitePlayerDialog" persistent max-width="600px">
      <template v-slot:activator="{ on }">
        <v-btn
          @click="invitePlayerDialog = true"
          class="ma-0"
          outlined
          v-on="on"
          color="primary"
        >
          <v-icon left>mdi-pencil</v-icon>
          <span>Invite Player</span>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span class="headline">Invite Player</span>
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
            item-text="name"
            item-value="id"
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
          <v-btn color="blue darken-1" text @click="closeDialog">
            Close
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            :disabled="!searchModel"
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
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import HeroPicture from "@/components/match-details/HeroPicture.vue";
import { PlayerProfile } from "@/store/player/types";
import ClanCreationPanel from "@/components/clans/ClanCreationPanel.vue";

@Component({
  components: { ClanCreationPanel, HeroPicture },
})
export default class ClanOverview extends Vue {
  public searchModel = {} as PlayerProfile;

  public search = "";
  public invitePlayerDialog = false;
  public isValidationError = false;

  public isDuplicateName(name: string) {
    return this.searchPlayers.filter((r) => r.name === name).length > 1;
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at lease 3 letters";
    }

    return "No player found";
  }

  public async invitePlayer() {
    await this.$store.direct.dispatch.clan.invitePlayer(
      this.searchModel.battleTag
    );
    if (this.$store.direct.state.clan.clanValidationError) {
      this.isValidationError = true;
    } else {
      await this.$store.direct.dispatch.clan.retrievePlayersClan();
      this.search = "";
      this.invitePlayerDialog = false;
    }
  }

  public closeDialog() {
    this.invitePlayerDialog = false;
    this.isValidationError = false;
    this.search = "";
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.clan.searchPlayers(newValue.toLowerCase());
    } else {
      this.$store.direct.commit.clan.SET_PLAYERS_SEARCH([]);
      this.isValidationError = false;
    }
  }

  get clanValidationError() {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get searchPlayers() {
    return this.$store.direct.state.clan.searchPlayers;
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }
}
</script>
