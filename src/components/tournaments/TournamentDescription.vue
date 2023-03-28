<template>
  <div>
    <div>
      <b>Gateway:</b>
      {{ gateway }}
    </div>
    <div>
      <b>Start Time:</b>
      {{ formattedDate }}
    </div>
    <div>
      <b>Game Mode:</b>
      {{ gameMode }}
    </div>
    <div>
      <b>Format:</b>
      {{ format }}
    </div>
    <div>
      <b>Player Count:</b>
      {{ playerCount }}
    </div>
    <div>
      <b>Map Pool:</b>
      {{ mapPool }}
    </div>
    <div v-if="matcherinoUrl">
      <a v-bind:href="matcherinoUrl">Donate to the prize pool</a>
    </div>
    <div class="mt-2" v-if="statusInit || statusRegistration || statusMatchGeneration || statusCanceled">
      <div v-if="statusInit">Registration didn't start yet.</div>
      <div v-else-if="statusRegistration">Registration is open.</div>
      <div v-else-if="statusMatchGeneration">Generating bracket.</div>
      <div v-else-if="statusCanceled">The tournament was canceled.</div>
      <div class="mt-2" v-if="tournament.players.length > 0">Registered players list: {{ registeredPlayers }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { ETournamentState, ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ETournamentFormatLabel, EGameModeLabel, EGatewayLabel } from "@/helpers/tournaments";
import { Map } from "@/store/admin/mapsManagement/types";
import { ERaceEnum } from "@/store/typings";
import { formatDateToDateWeekday } from "@/helpers/date-functions";

@Component
export default class TournamentDescription extends Vue {
  @Prop() public tournament!: ITournament;
  @Prop() public maps!: Map[];

  get gateway() {
    return EGatewayLabel[this.tournament.gateway];
  }

  get formattedDate(): string {
    return formatDateToDateWeekday(this.tournament.startDateTime);
  }

  get gameMode() {
    return EGameModeLabel[this.tournament.mode];
  }

  get format() {
    return ETournamentFormatLabel[this.tournament.format];
  }

  get playerCount() {
    return this.tournament.players.length;
  }

  get mapPool() {
    return this.tournament.mapPool.map((mapId) => this.maps.find((map) => map.id === mapId)?.name).sort().join(", ");
  }

  get statusInit() {
    return this.tournament.state === ETournamentState.INIT;
  }

  get statusRegistration() {
    return this.tournament.state === ETournamentState.REGISTRATION;
  }

  get statusMatchGeneration() {
    return this.tournament.state === ETournamentState.MATCH_GENERATION;
  }

  get statusCanceled() {
    return this.tournament.state === ETournamentState.CANCELED;
  }

  get matcherinoUrl() {
    return this.tournament.matcherinoUrl;
  }

  get registeredPlayers(): string {
    return this.tournament.players.map((player) => (
      `${player.battleTag}(${this.$t(`racesShort.${ERaceEnum[player.race]}`)})`
    )).join(", ");
  }
}
</script>

<style lang="scss"></style>
