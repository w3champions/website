<template>
  <div>
    <player-match-info
      :unfinishedMatch="unfinishedMatch"
      :player="team.players[0]"
      :left="left"
      :big-race-icon="bigRaceIcon"
      :not-clickable="notClickable"
    />
    <div class="mt-2">
      <player-match-info
        v-if="team.players.length > 1"
        :unfinishedMatch="unfinishedMatch"
        :player="team.players[1]"
        :left="left"
        :big-race-icon="bigRaceIcon"
        :not-clickable="notClickable"
      />
    </div>

    <div class="mt-2">
      <player-match-info
        v-if="team.players.length > 2"
        :unfinishedMatch="unfinishedMatch"
        :player="team.players[2]"
        :left="left"
        :big-race-icon="bigRaceIcon"
        :not-clickable="notClickable"
      />
    </div>

    <div class="mt-2">
      <player-match-info
        v-if="team.players.length > 3"
        :unfinishedMatch="unfinishedMatch"
        :player="team.players[3]"
        :left="left"
        :big-race-icon="bigRaceIcon"
        :not-clickable="notClickable"
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
  components: { PlayerMatchInfo },
})
export default class TeamMatchInfo extends Vue {
  @Prop() public team!: Team;
  @Prop() public left!: boolean;
  @Prop() public bigRaceIcon!: boolean;
  @Prop() public notClickable!: boolean;
  @Prop() public unfinishedMatch!: boolean;
}
</script>
