<template>
  <v-card>
    <v-card-title>
      <span>Switch Chieftain</span>
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
        @click="switchChieftain"
      >
        Switch chieftain
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class SwitchChieftainPanel extends Vue {
  public searchModel = "";

  public async switchChieftain() {
    await this.$store.direct.dispatch.clan.switchChieftain(
      this.searchModel
    );

    await this.$store.direct.dispatch.clan.retrievePlayersClan();
    this.searchModel = "";
  }

  get members() {
    return this.$store.direct.state.clan.playersClan.members;
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }
}
</script>
