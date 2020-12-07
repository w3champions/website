<template>
  <div class="streamed-match-info">
    <streamed-match-player-info :player="match.teams[0].players[0]"/>
    <span class="streamed-match-info__vs">VS</span>
    <streamed-match-player-info :player="match.teams[1].players[0]" :align-right="true"/>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { Match } from "@/store/typings";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import StreamedMatchPlayerInfo from "@/components/matches/StreamedMatchPlayerInfo.vue";

@Component({ components: { StreamedMatchPlayerInfo, PlayerIcon } })
export default class StreamedMatchInfo extends Vue {
  @Prop() private match!: Match;
}
</script>

<style scoped lang="scss">
.streamed-match-info {
  display: flex;
  align-items: center;

  &__vs {
    margin: 0 12px;
  }
}
</style>
