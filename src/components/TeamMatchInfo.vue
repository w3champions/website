<template>
  <player-match-info :player="team.players[0]" :left="left" />
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
}
</script>
