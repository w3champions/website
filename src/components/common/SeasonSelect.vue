<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn
        tile
        v-on="on"
        class="ma-4"
        style="background-color: transparent"
      >
        <h2 class="pa-0">{{ $t("components_common_seasonselect.season") }} {{ selectedSeason.id }}</h2>
        <v-icon class="ml-4">mdi-chevron-right</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>{{ $t("components_common_seasonselect.prevseasons") }}</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-list dense>
          <v-list-item
            v-for="season in seasons"
            :key="season.id"
            @click="selectSeason(season)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ $t("components_common_seasonselect.season") }} {{ season.id }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Season } from "@/store/ranking/types";

@Component({})
export default class SeasonSelect extends Vue {
  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  get selectedSeason() {
    return this.$store.direct.state.rankings.selectedSeason;
  }

  public selectSeason(season: Season) {
    this.$store.direct.dispatch.rankings.setSeason(season);
    this.$emit("seasonSelected", season);
  }

}
</script>

<style></style>
