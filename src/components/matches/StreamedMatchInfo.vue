<template>
  <div class="streamed-match-info">
    <streamed-match-player-info :player="match.teams[0].players[0]" />
    <span>{{ $t(`views_matchdetail.vs`) }}</span>
    <streamed-match-player-info
      :player="match.teams[1].players[0]"
      :align-right="true"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { Match } from "@/store/types";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import StreamedMatchPlayerInfo from "@/components/matches/StreamedMatchPlayerInfo.vue";

@Component({ components: { StreamedMatchPlayerInfo, PlayerIcon } })
export default class StreamedMatchInfo extends Vue {
  @Prop() public match!: Match;
}
</script>

<style scoped lang="scss">
.streamed-match-info {
  display: grid;
  grid-template-columns: 1fr 25px 1fr;
  grid-column-gap: 10px;
}
</style>
