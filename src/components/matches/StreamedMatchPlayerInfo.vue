<template>
  <div class="streamed-match-player-info">
    <div
      class="streamed-match-player-info__twitch"
      :style="{ order: this.alignRight ? 3 : 1 }"
    >
      <v-btn v-if="player.twitch" icon :href="twitchLink" target="_blank">
        <v-icon color="purple accent-4">{{ mdiTwitch }}</v-icon>
      </v-btn>
    </div>
    <div class="streamed-match-player-info__player">
      <player-icon
        class="streamed-match-player-info__race"
        :race="player.race"
      />
      <router-link
        :to="playerProfilePage"
        class="streamed-match-player-info__name"
        :title="player.name"
      >
        {{ player.name }}
      </router-link>
      <span class="streamed-match-player-info__mmr">({{ player.oldMmr }})</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerInTeam } from "@/store/types";
import { mdiTwitch } from "@mdi/js";

@Component({})
export default class StreamedMatchPlayerInfo extends Vue {
  @Prop() readonly player!: PlayerInTeam;
  @Prop({ default: false }) readonly alignRight!: boolean;
  public mdiTwitch = mdiTwitch;

  get twitchLink(): string {
    return `https://twitch.tv/${this.player.twitch}`;
  }

  get playerProfilePage() {
    const playerId = encodeURIComponent(this.player.battleTag);
    return `/player/${playerId}`;
  }
}
</script>

<style scoped lang="scss">
.streamed-match-player-info {
  display: inline-flex;

  &__twitch {
    width: 36px;
  }

  &__player {
    order: 2;
    display: grid;
    grid-template-areas: "race name" "race mmr";
    grid-column-gap: 5px;
    align-items: center;
  }

  &__race {
    grid-area: race;
  }

  &__name {
    grid-area: name;
    font-size: 14px;
    width: 75px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-decoration: none;
  }

  &__mmr {
    grid-area: mmr;
    font-size: 12px;
  }
}
</style>
