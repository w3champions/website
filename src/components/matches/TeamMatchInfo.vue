<template>
  <div v-if="team" class="team-match-info">
    <div v-if="hasTeamRanking" class="team-ranking">
      #{{ team.matchRanking! + 1 }}
    </div>
    <div class="team-content">
      <div v-for="(player, index) in team.players" :key="index" class="player-row">
        <div v-if="!hasTeamRanking && hasPlayerRanking(player)" class="player-ranking">
          #{{ player.matchRanking! + 1 }}
        </div>
        <player-match-info
          :unfinishedMatch="unfinishedMatch"
          :player="player"
          :left="left"
          :big-race-icon="bigRaceIcon"
          :not-clickable="notClickable"
          :is-anonymous="isAnonymous"
          :highlighted="highlightedPlayer === player.battleTag"
          :show-heroes="showHeroes"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { PlayerInTeam, Team } from "@/store/types";
import PlayerMatchInfo from "@/components/matches/PlayerMatchInfo.vue";
import isNil from "lodash/isNil";

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
    showHeroes: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    hasTeamRanking(): boolean {
      return !isNil(this.team?.matchRanking);
    },
  },
  methods: {
    hasPlayerRanking(player: PlayerInTeam): boolean {
      return !isNil(player.matchRanking);
    },
  },
});
</script>

<style lang="scss" scoped>
.team-match-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.team-ranking {
  font-weight: bold;
  font-size: 14px;
  min-width: 24px;
}

.team-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.player-ranking {
  font-weight: bold;
  font-size: 14px;
  min-width: 24px;
}
</style>
