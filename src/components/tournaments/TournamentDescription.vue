<template>
  <div>
    <div>
      <b>Start Time:</b>
      {{ 123 }}
    </div>
    <div>
      <b>Game Type:</b>
      {{ "1vs1" }}
    </div>
    <div>
      <b>Format:</b>
      {{ "Single Elimination" }}
    </div>
    <div>
      <b>Map Pool:</b>
      {{ "EI, TM, CH, AZ" }}
    </div>
  </div>
</template>

<script lang="ts">
import { ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component
export default class TournamentDetail extends Vue {
  @Prop() public tournament!: ITournament;
}
</script>

<style lang="scss">
</style>
