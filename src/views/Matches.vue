<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            {{ $t("views_app.matches") }}
          </v-card-title>
          <v-card-text>
            <matches-status-select />
            <gateway-select @gatewayChanged="gatewayChanged" />
            <game-mode-select
              :disabledModes="disabledGameModes"
              :gameMode="gameMode"
              @gameModeChanged="gameModeChanged"
            ></game-mode-select>
          </v-card-text>
          <matches-grid
            v-model="matches"
            :totalMatches="totalMatches"
            @pageChanged="onPageChanged"
            :itemsPerPage="50"
            :unfinished="unfinished"
          ></matches-grid>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

import { Match, EGameMode } from "@/store/typings";
import { MatchStatus } from "@/store/match/types";

import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import MatchesStatusSelect from "@/components/matches/MatchesStatusSelect.vue";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";

@Component({
  components: {
    MatchesGrid,
    MatchesStatusSelect,
    GatewaySelect,
    GameModeSelect,
  },
})
export default class MatchesView extends Vue {
  onPageChanged(page: number) {
    this.getMatches(page);
  }

  get disabledGameModes() {
    if (this.$store.direct.state.matches.status == MatchStatus.onGoing) {
      return [EGameMode.GM_2ON2_AT];
    }

    return [];
  }

  get totalMatches(): number {
    return this.$store.direct.state.matches.totalMatches;
  }

  get matches(): Match[] {
    return this.$store.direct.state.matches.matches;
  }

  get unfinished(): boolean {
    return this.$store.direct.state.matches.status == MatchStatus.onGoing;
  }

  get gameMode(): EGameMode {
    return this.$store.direct.state.matches.gameMode;
  }

  public getMatches(page?: number) {
    this.$store.direct.dispatch.matches.loadMatches(page);
  }

  mounted() {
    this.getMatches(1);
  }

  gatewayChanged() {
    this.getMatches(1);
  }

  gameModeChanged(gameMode: EGameMode) {
    this.$store.direct.dispatch.matches.setGameMode(gameMode);
  }
}
</script>
