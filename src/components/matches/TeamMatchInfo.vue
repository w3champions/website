<template>
  <div v-if="team" class="team-match-info">
    <div v-if="!isNil(team.matchRanking)" class="team-ranking">
      {{ formatRanking(team.matchRanking) }}
    </div>
    <div class="team-content">
      <div v-for="(player, index) in team.players" :key="index" class="player-row d-flex align-center w-100" :class="{ 'justify-end': left, 'justify-start': !left }">
        <v-chip v-if="player.atTeamId" size="x-small" :color="partyColorMap.get(player.atTeamId)" variant="tonal" class="mr-1" title="Arranged Team Party">
          AT
        </v-chip>
        <div v-if="isNil(team.matchRanking) && !isNil(player.matchRanking)" class="player-ranking">
          {{ formatRanking(player.matchRanking) }}
        </div>
        <player-match-info
          :unfinishedMatch="unfinishedMatch"
          :player="player"
          :left="left"
          :big-race-icon="bigRaceIcon"
          :not-clickable="notClickable"
          :is-anonymous="isAnonymous"
          :highlighted="highlightedPlayer === player.battleTag"
          :spoiler-free-winner="spoilerFreeWinner"
          :show-heroes="showHeroes"
          :selectedHeroes="selectedHeroes"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { Team } from "@/store/types";
import PlayerMatchInfo from "@/components/matches/PlayerMatchInfo.vue";
import { useSpoilerFreeStore } from "@/store/spoilerFree/store";
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
    spoilerFreeWinner: {
      type: Boolean,
      required: false,
      default: false,
    },
    showHeroes: {
      type: Boolean,
      required: false,
      default: false,
    },
    selectedHeroes: {
      type: Array as PropType<number[]>,
      required: false,
      default: () => [],
    },
  },
  setup(props) {
    const spoilerFreeStore = useSpoilerFreeStore();

    // Placement is the result in Survival Chaos, where #1 won. The value is substituted rather
    // than blurred: a blur is cosmetic and leaves the real number readable in the DOM. This
    // mirrors the stand-in MMR in PlayerMatchInfo, where the true rating never reaches the page.
    const hideRanking = computed<boolean>(() =>
      props.spoilerFreeWinner && spoilerFreeStore.hideWinner && !props.unfinishedMatch
    );
    const formatRanking = (ranking: number): string => hideRanking.value ? "#?" : `#${ranking + 1}`;

    const partyColorMap = computed(() => {
      const map = new Map<string, string>();
      if (!props.team) return map;
      
      const colors = ["primary", "success", "warning", "info", "error"];
      let colorIndex = 0;
      
      for (const player of props.team.players) {
        if (player.atTeamId) {
          if (!map.has(player.atTeamId)) {
            map.set(player.atTeamId, colors[colorIndex % colors.length]);
            colorIndex++;
          }
        }
      }
      return map;
    });

    return {
      isNil,
      formatRanking,
      partyColorMap,
    };
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
