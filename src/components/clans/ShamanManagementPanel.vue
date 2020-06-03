<template>
  <v-card>
    <v-card-title>
      <span>Promote to shaman</span>
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
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class ShamanManagementPanel extends Vue {
  public searchModel = "";

  public async promoteShaman() {
    await this.$store.direct.dispatch.clan.addShaman(
      this.searchModel
    );

    await this.refreshPage();
  }

  private async refreshPage() {
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
    this.searchModel = "";
  }

  public async demoteShaman() {
    await this.$store.direct.dispatch.clan.removeShaman(
      this.searchModel
    );

    await this.refreshPage();
  }

  get members() {
    return this.$store.direct.state.clan.playersClan.members;
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }
}
</script>
