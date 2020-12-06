<template>
  <div class="streamed-match-info">
    <div v-if="player.twitch" class="streamed-match-info__icon">
      <v-btn  icon :href="twitchLink" target="_blank">
        <v-icon color="purple accent-4">mdi-twitch</v-icon>
      </v-btn>
    </div>
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
  @Prop() public player!: PlayerInTeam;
  @Prop() public isRightAligned!: boolean;

  get twitchLink() {
    return `https://twitch.tv/${this.player.twitch}`;
  }
}
</script>

<style scoped lang="scss">
.streamed-match-info {
  display: grid;
  grid-template-areas: "icon name" "icon mmr";
  grid-template-columns: 36px auto;
  align-items: center;

  &__icon {
    grid-area: icon;
  }

  &__name {
    grid-area: name;
    font-size: 16px;
  }

  &__mmr {
    grid-area: mmr;
    font-size: 12px;
  }
}
</style>
