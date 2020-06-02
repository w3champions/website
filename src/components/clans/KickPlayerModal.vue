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
          <span>Manage Members</span>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span class="headline">Manage Members</span>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="searchModel"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            clearable
            :items="members"
            no-data-text="no player found"
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
            @click="kickPlayer"
          >
            Kick
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
import { Component } from "vue-property-decorator";
import ClanCreationPanel from "@/components/clans/ClanCreationPanel.vue";

@Component({
  components: { ClanCreationPanel },
})
export default class KickPlayerModal extends Vue {
  public searchModel = "";

  public dialog = false;
  public isValidationError = false;

  public async kickPlayer() {
    await this.$store.direct.dispatch.clan.kickPlayer(
      this.searchModel
    );
    await this.handleErrors();
  }

  private async handleErrors() {
    if (this.$store.direct.state.clan.clanValidationError) {
      this.isValidationError = true;
    } else {
      await this.$store.direct.dispatch.clan.retrievePlayersClan();
      this.searchModel = "";
      this.isValidationError = false;
    }
  }

  public closeDialog() {
    this.dialog = false;
    this.isValidationError = false;
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
