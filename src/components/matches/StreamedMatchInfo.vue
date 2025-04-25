<template>
  <div class="streamed-match-info">
    <streamed-match-player-info :player="match.teams[0].players[0]"></streamed-match-player-info>
    <span>{{ $t(`views_matchdetail.vs`) }}</span>
    <streamed-match-player-info
      :player="match.teams[1].players[0]"
      :align-right="true"
    ></streamed-match-player-info>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Match } from "@/store/types";
import StreamedMatchPlayerInfo from "@/components/matches/StreamedMatchPlayerInfo.vue";

export default defineComponent({
  name: "StreamedMatchInfo",
  components: {
    StreamedMatchPlayerInfo,
  },
  props: {
    match: {
      type: Object as PropType<Match>,
      required: true,
    },
  },
});
</script>

<style scoped lang="scss">
.streamed-match-info {
  display: grid;
  grid-template-columns: 1fr 25px 1fr;
  grid-column-gap: 10px;
}
</style>
