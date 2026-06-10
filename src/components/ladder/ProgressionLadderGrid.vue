<template>
  <div class="elevation-1">
    <table v-if="rankings.length > 0" class="custom-table">
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
        <tr
          v-for="item in rankings"
          :id="`listitem_${item.rankNumber}`"
          :key="item.rankNumber"
          class="w3-mid-emphasis"
        >
          <td class="number-text">{{ item.rankNumber }}.</td>
          <td class="d-md-flex">
            <ladder-player-cell
              v-for="(playerInfo, index) in item.playersInfo"
              :key="playerInfo.battleTag"
              :playerInfo="playerInfo"
              class="rank-icon-container my-1"
              :class="{ 'ml-md-3': index > 0 }"
            />
          </td>
          <td class="number-text text-center">
            <progression-rank v-if="item.progression" :progression="item.progression" />
            <span v-else>{{ $t("views_rankings.unranked") }}</span>
          </td>
          <td class="number-text text-end"><race-icon :race="item.race" /></td>
          <td class="number-text text-end">
            {{ item.playersInfo.map((p) => (p.clanId ? p.clanId : "-")).join("/") }}
          </td>
        </tr>
      </tbody>
    </table>
    <table v-else class="custom-table">
      <tbody>
        <tr>
          <td colspan="5" class="text-center">
            {{ $t("components_ladder_progressionladdergrid.noplayers") }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { Ranking } from "@/store/ranking/types";
import LadderPlayerCell from "@/components/ladder/LadderPlayerCell.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import ProgressionRank from "@/components/ladder/ProgressionRank.vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "ProgressionLadderGrid",
  components: {
    LadderPlayerCell,
    RaceIcon,
    ProgressionRank,
  },
  props: {
    rankings: {
      type: Array as PropType<Ranking[]>,
      required: true,
    },
  },
  setup() {
    const { t } = useI18n();

    const headers = [
      { name: "Position", text: t("components_ladder_progressionladdergrid.position"), width: "25px" },
      { name: "Player", text: t("components_ladder_rankingsgrid.player"), minWidth: "170px" },
      { name: "Rank", text: t("components_ladder_rankingsgrid.rank"), width: "100px" },
      { name: "Race", text: t("components_ladder_rankingsgrid.race"), width: "50px" },
      { name: "Clan", text: t("components_ladder_rankingsgrid.clan"), width: "50px" },
    ];

    return {
      headers,
    };
  },
});
</script>

<style lang="scss" scoped>
@media (max-width: 768px) {
  .rank-icon-container {
    margin-top: 5px;
    margin-left: 0 !important;
  }
}
</style>
