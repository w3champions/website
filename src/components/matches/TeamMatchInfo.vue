<template>
  <div v-if="team">
    <div
      v-for="(player, index) in team.players"
      :key="index"
      :class="{ mt2: index > 0 }"
    >
      <player-match-info
        :unfinishedMatch="unfinishedMatch"
        :player="team.players[index]"
        :left="left"
        :big-race-icon="bigRaceIcon"
        :not-clickable="notClickable"
        :is-anonymous="isAnonymous"
        :highlighted="highlightedPlayer === team.players[index].battleTag"
      ></player-match-info>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Team } from "@/store/types";
import PlayerMatchInfo from "@/components/matches/PlayerMatchInfo.vue";

export default defineComponent({
  name: "TeamMatchInfo",
  components: {
    PlayerMatchInfo,
  },
  props: {
    team: {
      type: Object as PropType<Team>,
      required: false,
      default: undefined,
    },
    left: {
      type: Boolean,
      required: false,
      default: false,
    },
    bigRaceIcon: {
      type: Boolean,
      required: false,
      default: false,
    },
    notClickable: {
      type: Boolean,
      required: false,
      default: false,
    },
    unfinishedMatch: {
      type: Boolean,
      required: false,
      default: false,
    },
    isAnonymous: {
      type: Boolean,
      required: false,
      default: false,
    },
    highlightedPlayer: {
      type: String,
      required: false,
      default: "",
    },
  },
});
</script>
