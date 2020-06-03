<template>
  <v-card>
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
      <v-btn
        color="blue darken-1"
        text
        :disabled="!searchModel.id"
        @click="invitePlayer"
      >
        Invite
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { PlayerProfile } from "@/store/player/types";

@Component({})
export default class ClanOverview extends Vue {
  public searchModel = {} as PlayerProfile;

  public search = "";

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
