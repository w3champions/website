<template>
  <div class="streamed-match-player-info">
    <div
      class="streamed-match-player-info__twitch"
      :style="{ order: alignRight ? 3 : 1 }"
    >
      <v-btn v-if="player.twitch" start icon :href="twitchLink" target="_blank" variant="flat" class="bg-transparent" height="13">
        <v-icon color="purple-accent-4">{{ mdiTwitch }}</v-icon>
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
      <span class="streamed-match-player-info__mmr">({{ player.oldMmr ?? $t("components_matches_playermatchinfo.calibrating") }})</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { PlayerInTeam } from "@/store/types";
import { mdiTwitch } from "@mdi/js";
import PlayerIcon from "./PlayerIcon.vue";

export default defineComponent({
  name: "StreamedMatchPlayerInfo",
  components: {
    PlayerIcon,
  },
  props: {
    player: {
      type: Object as PropType<PlayerInTeam>,
      required: true,
    },
    alignRight: {
      type: Boolean,
      required: false,
      default: false,
    }
  },
  setup(props) {
    const twitchLink = ref<string>(`https://twitch.tv/${props.player.twitch}`);
    const playerProfilePage = ref<string>(`/player/${encodeURIComponent(props.player.battleTag)}`);

    return {
      mdiTwitch,
      twitchLink,
      playerProfilePage,
    };
  },
});
</script>

<style lang="scss" scoped>
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
