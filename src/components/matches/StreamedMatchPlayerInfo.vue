<template>
  <div class="streamed-match-player-info">
    <div v-if="player.twitch" :style="{order: this.alignRight ? 3 : 1}">
      <v-btn icon :href="twitchLink" target="_blank">
        <v-icon color="purple accent-4">mdi-twitch</v-icon>
      </v-btn>
    </div>
    <div class="streamed-match-player-info__player">
      <player-icon class="streamed-match-player-info__race" :race="player.race" />
      <span class="streamed-match-player-info__name" :title="player.name">
        {{ player.name }}
      </span>
      <span class="streamed-match-player-info__mmr">({{ player.oldMmr }})</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from "vue-property-decorator";
import { PlayerInTeam } from "../../store/typings";

@Component({})
export default class StreamedMatchPlayerInfo extends Vue{
  @Prop() private player!: PlayerInTeam;
  @Prop() private alignRight = false

  get twitchLink():string {
    return `https://twitch.tv/${this.player.twitch}`
  }
}
</script>

<style scoped lang="scss">
.streamed-match-player-info {
  display: inline-flex;

  &__player {
    order: 2;
    display: grid;
    grid-template-areas: 'race name' 'race mmr';
    grid-column-gap: 5px;
    align-items: center;
  }

  &__race {
    grid-area: race;
  }

  &__name {
    grid-area: name;
    font-size: 14px;
    max-width: 75px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__mmr {
    grid-area: mmr;
    font-size: 12px;
  }
}
</style>