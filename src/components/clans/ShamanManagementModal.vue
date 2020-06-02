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
          <span>Manage Shamans</span>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span class="headline">Manage Shamans</span>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="searchModel"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            clearable
            :items="members"
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
                    {{ data.item.split("#")[0] }}
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
            @click="promoteShaman"
          >
            Promote
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            :disabled="!searchModel"
            @click="demoteShaman"
          >
            Demote
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
import ClanCreationPanel from "@/components/clans/ClanCreationPanel.vue";

@Component({
  components: { ClanCreationPanel },
})
export default class ShamanManagementModal extends Vue {
  public searchModel = "";

  public search = "";
  public dialog = false;
  public isValidationError = false;

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at lease 3 letters";
    }

    return "No player found";
  }

  public async promoteShaman() {
    await this.$store.direct.dispatch.clan.addShaman(
      this.searchModel
    );
    await this.handleErrors();
  }

  public async demoteShaman() {
    await this.$store.direct.dispatch.clan.removeShaman(
      this.searchModel
    );
    await this.handleErrors();
  }

  private async handleErrors() {
    if (this.$store.direct.state.clan.clanValidationError) {
      this.isValidationError = true;
    } else {
      await this.$store.direct.dispatch.clan.retrievePlayersClan();
      this.search = "";
    }
  }

  public closeDialog() {
    this.dialog = false;
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

  get members() {
    return this.$store.direct.state.clan.playersClan.members;
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }
}
</script>
