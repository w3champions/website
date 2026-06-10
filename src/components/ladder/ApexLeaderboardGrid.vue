<template>
  <div class="elevation-1">
    <table v-if="apexLeaderboard.players.length > 0" class="custom-table">
      <thead>
        <tr class="w3-mid-emphasis">
          <td
            v-for="header in headers"
            :key="header.name"
            :style="{ width: header.width, 'min-width': header.minWidth }"
          >
            {{ header.text }}
          </td>
        </tr>
      </thead>
      <tbody>
        <template v-for="(entry, index) in apexLeaderboard.players" :key="entry.rankNumber">
          <tr class="w3-mid-emphasis">
            <td class="number-text">{{ entry.rankNumber }}.</td>
            <td>
              <league-icon :league="entry.league" />
            </td>
            <td>
              <ladder-player-cell
                v-for="(playerInfo, pIndex) in entry.playersInfo"
                :key="playerInfo.battleTag"
                :playerInfo="playerInfo"
                class="rank-icon-container"
                :class="{ 'ml-3': pIndex > 0 }"
              />
            </td>
            <td class="number-text text-end apex-points">
              {{ entry.apexPoints }}
            </td>
          </tr>
          <tr
            v-if="showCutoffAfter(index)"
            :key="`cutoff-${index}`"
            class="apex-cutoff-row"
          >
            <td colspan="4" class="apex-cutoff-cell">
              <div class="apex-cutoff-line">
                <span class="apex-cutoff-label">
                  {{ $t("components_ladder_apexleaderboardgrid.cutoff") }}
                  <span v-if="apexLeaderboard.cutoffApexPoints != null" class="apex-cutoff-points">
                    {{ apexLeaderboard.cutoffApexPoints }}
                  </span>
                </span>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <table v-else class="custom-table">
      <tbody>
        <tr>
          <td colspan="4" class="text-center">
            {{ $t("components_ladder_apexleaderboardgrid.noplayers") }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ApexLeaderboard } from "@/store/ranking/types";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import LadderPlayerCell from "@/components/ladder/LadderPlayerCell.vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "ApexLeaderboardGrid",
  components: {
    LeagueIcon,
    LadderPlayerCell,
  },
  props: {
    apexLeaderboard: {
      type: Object as PropType<ApexLeaderboard>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const headers = [
      {
        name: "Rank",
        text: t("components_ladder_rankingsgrid.rank"),
        width: "25px",
      },
      {
        name: "League",
        text: t("components_ladder_apexleaderboardgrid.league"),
        width: "30px",
      },
      {
        name: "Player",
        text: t("components_ladder_rankingsgrid.player"),
        minWidth: "170px",
      },
      {
        name: "ApexPoints",
        text: t("components_ladder_apexleaderboardgrid.apexpoints"),
        width: "80px",
      },
    ];

    function showCutoffAfter(index: number): boolean {
      return index === props.apexLeaderboard.gmCount - 1 &&
        index < props.apexLeaderboard.players.length - 1;
    }

    return {
      headers,
      showCutoffAfter,
    };
  },
});
</script>

<style lang="scss" scoped>
.rank-icon-container {
  vertical-align: middle;
}

.apex-points {
  font-weight: 700;
  min-width: 60px;
}

.apex-cutoff-row {
  pointer-events: none;
}

.apex-cutoff-cell {
  padding: 0 !important;
}

.apex-cutoff-line {
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    background: linear-gradient(
      to right,
      transparent 0%,
      rgb(var(--v-theme-warning)) 15%,
      rgb(var(--v-theme-warning)) 85%,
      transparent 100%
    );
    opacity: 0.75;
  }
}

.apex-cutoff-label {
  position: relative;
  z-index: 1;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 10px;
  border-radius: 3px;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-warning));
  border: 1px solid rgba(var(--v-theme-warning), 0.4);
  white-space: nowrap;
}

.apex-cutoff-points {
  margin-left: 4px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .rank-icon-container {
    margin-top: 5px;
    margin-left: 0 !important;
  }
}
</style>
