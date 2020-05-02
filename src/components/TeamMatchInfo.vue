<template>
  <div>
    <player-match-info :player="team.players[0]" :left="left" :big-race-icon="bigRaceIcon" :not-clickable="notClickable" />
    <player-match-info v-if="team.players.length > 1" :player="team.players[1]" :left="left" :big-race-icon="bigRaceIcon" :not-clickable="notClickable" />
    <player-match-info v-if="team.players.length > 2" :player="team.players[2]" :left="left" :big-race-icon="bigRaceIcon" :not-clickable="notClickable" />
    <player-match-info v-if="team.players.length > 3" :player="team.players[3]" :left="left" :big-race-icon="bigRaceIcon" :not-clickable="notClickable" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Team } from "@/store/typings";
import PlayerMatchInfo from "@/components/PlayerMatchInfo.vue";

@Component({
  components: { PlayerMatchInfo }
})
export default class TeamMatchInfo extends Vue {
  @Prop() public team!: Team;
  @Prop() public left!: boolean;
  @Prop() public bigRaceIcon!: boolean;
  @Prop() public notClickable!: boolean;
}
</script>
