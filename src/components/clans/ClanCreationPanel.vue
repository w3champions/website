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
          :v-model="clanNameToCreate"
          @change="changeInsertedClanName"
          :rules="[mustBeBetween(3, 30, ' ')]"
          label="Clan name"
          hint="enter clan name"
        />
        <v-text-field
          :v-model="clanAbbreviationToCreate"
          @change="changeInsertedClanAbbreviation"
          :rules="[mustBeBetween(2, 5, '')]"
          label="Clan abbreviation"
          hint="enter clan abbreviation"
        />
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col class="text-center">
        <v-btn @click="createClan">Create a clan!</v-btn>
      </v-col>
    </v-row>
    <v-alert
      v-model="isValidationError"
      type="warning"
      dense
      class="ml-4 mr-4"
      dismissible
    >
      {{ clanValidationError }}
    </v-alert>
  </v-card-text>
</template>
<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class ClanCreationPanel extends Vue {
  public clanNameToCreate = "";
  public clanAbbreviationToCreate = "";

  public mustBeBetween(min: number, max: number, space: string) {
    return function (v: string) {
      if (!v) return "";
      if (!v.match(`^[a-zA-Z0-9${space}]{${min},${max}}$`)) return `Must be between ${min} and ${max} numerical characters`;
      return "";
    }
  }

  public changeInsertedClanName(newName: string) {
    this.clanNameToCreate = newName;
  }

  public changeInsertedClanAbbreviation(newName: string) {
    this.clanAbbreviationToCreate = newName;
  }

  get clanValidationError() {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get isValidationError() {
    return this.$store.direct.state.clan.clanValidationError !== "";
  }

  public async createClan() {
    await this.$store.direct.dispatch.clan.createClan({ clanName: this.clanNameToCreate, abbreviation: this.clanAbbreviationToCreate });
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }
}
</script>
