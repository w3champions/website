<template>
  <div class="streamed-match-info">
    <v-btn v-if="player.twitch" icon :href="twitchLink" target="_blank" :style="{order: isRightAligned ? 4 : 1}">
      <v-icon color="purple accent-4">mdi-twitch</v-icon>&nbsp;
    </v-btn>
    <span class="streamed-match-info__name">{{ player.name }}</span>
    <span class="streamed-match-info__mmr">({{ player.oldMmr }})</span>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { PlayerInTeam } from "@/store/typings";

@Component({})
export default class StreamedMatchInfo extends Vue {
  @Prop() private player!: PlayerInTeam;
  @Prop() private isRightAligned = false;

  get twitchLink(){
    return `https://twitch.tv/${this.player.twitch}`
  }
}
</script>

<style scoped lang="scss">
.streamed-match-info {
  display: flex;
  align-items: center;
  font-size: 14px;

  &__name {
    order: 2;
    margin: 0 5px;
  }

  &__mmr {
    order: 3;
  }
}
</style>
