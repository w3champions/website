<template>
  <v-card-text>
    <v-row class="justify-center">
      <v-col class="text-center">
        <v-card-subtitle>
          You are not part of a clan, go ahead and create one!
        </v-card-subtitle>
      </v-col>
    </v-row>

    <v-row class="justify-center">
      <v-col cols="6">
        <v-text-field
          style="text-align: center"
          :v-model="clanNameToCreate"
          @change="changeInsertedClanName"
          hint="enter clan name"
        />
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col class="text-center">
        <v-btn @click="createClan">Create a clan!</v-btn>
      </v-col>
    </v-row>
  </v-card-text>
</template>
<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class ClanCreationPanel extends Vue {
  public clanNameToCreate = "";

  public changeInsertedClanName(newName: string) {
    this.clanNameToCreate = newName;
  }

  get clanValidationError() {
    return this.$store.direct.state.clan.clanValidationError;
  }

  public async createClan() {
    await this.$store.direct.dispatch.clan.createClan(this.clanNameToCreate);
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }
}
</script>
