<template>
  <div>
    <h3 class="mt-3">Bracket</h3>
    Bracket
  </div>
</template>

<script lang="ts">
import { ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";

@Component
export default class TournamentDetail extends Vue {
  @Prop() public tournament!: ITournament;
}
</script>

<style lang="scss">
</style>
