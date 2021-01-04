<template>
  <v-card-text>
    <v-row class="justify-center">
      <v-col class="text-center">
        <v-card-subtitle>
          {{ $t("components_clans_clancreationpanel.noclanmsg") }}
        </v-card-subtitle>
      </v-col>
    </v-row>

    <v-row class="justify-center">
      <v-col cols="6">
        <v-text-field
          :v-model="clanNameToCreate"
          @change="changeInsertedClanName"
          :rules="[mustBeBetween(3, 30, ' ')]"
          label="{{$t(`components_clans_clancreationpanel.clanname`)}}"
          hint="{{$t(`components_clans_clancreationpanel.enterclanname`)}}"
        />
        <v-text-field
          :v-model="clanAbbreviationToCreate"
          @change="changeInsertedClanAbbreviation"
          :rules="[mustBeBetween(2, 5, '')]"
          label="{{$t(`components_clans_clancreationpanel.clanabbrev`)}}"
          hint="{{$t(`components_clans_clancreationpanel.enterclanabbrev`)}}"
        />
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col class="text-center">
        <v-btn @click="createClan">
          {{ $t("components_clans_clancreationpanel.createclan") }}
        </v-btn>
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
import { LocaleMessage } from "vue-i18n";
import { Component } from "vue-property-decorator";

@Component({})
export default class ClanCreationPanel extends Vue {
  public clanNameToCreate = "";
  public clanAbbreviationToCreate = "";

  public mustBeBetween(min: number, max: number, space: string) {
    return (v: string): LocaleMessage => {
      if (!v)
        return this.$t("components_clans_clancreationpanel.fieldismandatory");
      if (!v.match(`^[a-zA-Z0-9${space}]{${min},${max}}$`))
        return this.$t("components_clans_clancreationpanel.minmaxchars", {
          min,
          max,
        });
      return "";
    };
  }

  public changeInsertedClanName(newName: string): void {
    this.clanNameToCreate = newName;
  }

  public changeInsertedClanAbbreviation(newName: string): void {
    this.clanAbbreviationToCreate = newName;
  }

  get clanValidationError(): string {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get isValidationError(): boolean {
    return this.$store.direct.state.clan.clanValidationError !== "";
  }

  public async createClan(): Promise<void> {
    await this.$store.direct.dispatch.clan.createClan({
      clanName: this.clanNameToCreate.trim(),
      abbreviation: this.clanAbbreviationToCreate,
    });
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }
}
</script>
