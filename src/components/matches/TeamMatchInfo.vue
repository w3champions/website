<template>
  <div v-if="team">
    <div
        v-for="(player, index) in team.players"
        v-bind:key="index"
        v-bind:class="{ mt2: index > 0 }"
    >
      <player-match-info
          :unfinishedMatch="unfinishedMatch"
          :player="team.players[index]"
          :left="left"
          :big-race-icon="bigRaceIcon"
          :not-clickable="notClickable"
          :is-anonymous="isAnonymous"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Team } from "@/store/typings";
import PlayerMatchInfo from "@/components/matches/PlayerMatchInfo.vue";

@Component({
  components: { PlayerMatchInfo }
})
export default class TeamMatchInfo extends Vue {
  @Prop() public team!: Team;
  @Prop() public left!: boolean;
  @Prop() public bigRaceIcon!: boolean;
  @Prop() public notClickable!: boolean;
  @Prop() public unfinishedMatch!: boolean;
  @Prop() public isAnonymous!: boolean;
}
</script>
