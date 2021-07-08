<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon style="margin-right: 5px">mdi-trophy</v-icon>
        {{ selectedTournamentText }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t("components_tournaments_tournamentselect.selecttourney") }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item
            v-for="tournament in tournaments"
            :key="tournament.id"
            @click="selectTournament(tournament)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ tournament.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class TournamentSelect extends Vue {
  @Prop() tournaments!: ITournament[];
  @Prop() selectedTournament!: ITournament;

  get selectedTournamentText() {
    return this.selectedTournament
      ? this.selectedTournament.name
      : "Select tournament";
  }

  public selectTournament(tournament: ITournament) {
    this.$emit("tournamentSelected", tournament);
  }
}
</script>

<style></style>
