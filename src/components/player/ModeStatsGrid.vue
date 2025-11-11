<template>
  <v-data-table
    hide-default-footer
    :headers="headers"
    :items="gameModeStatsCombined"
    :mobile-breakpoint="400"
    :items-per-page="-1"
    :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
  >
    <template v-for="h in headers" :key="h.title" v-slot:[`header.${h.value}`]="{ column }">
      <v-tooltip location="top">
        <template v-slot:activator="{ props }">
          <span v-bind="props">{{ column.title }}</span>
        </template>
        <span style="white-space: pre-line">{{ h.tooltip }}</span>
      </v-tooltip>
    </template>
    <template v-slot:body="{ items }">
      <tr v-for="item in items" :key="item.id">
        <td class="d-flex justify-center align-center text-no-wrap">
          <span class="mr-2">{{ $t("gameModes." + EGameMode[item.gameMode]) }}</span>
          <race-icon :race="item.race" />
        </td>
        <td class="number-text text-start text-no-wrap">
          <div class="text-center">
            <span class="w3-won">{{ item.wins }}</span>
            -
            <span class="w3-lost">{{ item.losses }}</span>
          </div>
          <div class="sub-value">{{ (item.winrate * 100).toFixed(1) }}%</div>
        </td>
        <td class="number-text text-end text-no-wrap">
          <div class="text-center">
            {{ item.rank !== 0 ? item.mmr : "-" }}
          </div>
          <div v-if="item.rank !== 0" class="sub-value">
            <span>{{ $t("common.top") }} {{ getTopPercent(item) }}%</span>
          </div>
        </td>
        <td class="number-text text-center text-no-wrap" style="min-width: 100px">
          <level-progress v-if="item.rank !== 0" :rp="item.rankingPoints" />
          <div v-else>-</div>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { TranslateResult, useI18n } from "vue-i18n";
import { AT_modes } from "@/composables/GameModesMixin";
import { EGameMode } from "@/store/types";
import { ModeStat } from "@/store/player/types";
import RaceIcon from "@/components/player/RaceIcon.vue";
import LevelProgress from "@/components/ladder/LevelProgress.vue";
import isEmpty from "lodash/isEmpty";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "ModeStatsGrid",
  components: {
    RaceIcon,
    LevelProgress,
  },
  props: {
    stats: {
      type: Array<ModeStat>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const isAtMode = (mode: EGameMode): boolean => AT_modes().includes(mode);

    const gameModeStatsCombined = computed<ModeStat[]>(() => {
      const AT_stats = props.stats.filter((g) => isAtMode(g.gameMode));

      if (AT_stats.length === 0) return sortByName(props.stats);

      // Arrange AT stats in separate arrays for each AT mode.
      const AT_arranged = AT_modes().map((AT_mode) => AT_stats.filter((modeStat) => AT_mode == modeStat.gameMode));

      // Filter out AT modes that haven't been played, sort by ranking points and get the stat with the highest rank.
      const topAtStats = AT_arranged.filter((modeStats) => !isEmpty(modeStats))
        .map((modeStats) => modeStats.sort((modeStat) => modeStat.rankingPoints))
        .map((modeStats) => modeStats.filter((modeStat, index) => index === 0))
        .flat();

      // Filter out the old AT stats.
      const modifiedStats = props.stats.filter((g) => !isAtMode(g.gameMode));

      // Add the new AT stats.
      topAtStats.forEach((modeStat) => {
        modifiedStats.push(modeStat);
      });

      return sortByName(modifiedStats);
    });

    function sortByName(mode: ModeStat[]): ModeStat[] {
      return mode.sort((a, b) => (EGameMode[a.gameMode] < EGameMode[b.gameMode] ? -1 : 1));
    }

    function getTopPercent(modeStat: ModeStat): string {
      if (modeStat.rank <= 0) {
        return "";
      }
      const quantilePerc = modeStat.quantile * 100;
      const topPerc = 100 - quantilePerc;
      return topPerc.toFixed(1);
    }

    const headers: (DataTableHeader & {tooltip: TranslateResult})[] = [
      {
        title: t("components_player_modestatsgrid.mode"),
        align: "center",
        sortable: false,
        tooltip: t("components_player_modestatsgrid.mode"),
        value: "mode",
      },
      {
        title: t("components_player_modestatsgrid.winloss"),
        align: "center",
        sortable: false,
        tooltip: t("components_player_modestatsgrid.winloss"),
        value: "winloss",
      },
      {
        title: t("components_player_modestatsgrid.mmr"),
        align: "center",
        sortable: false,
        tooltip: t("components_player_modestatsgrid.mmr"),
        value: "mmr",
      },
      {
        title: t("components_player_modestatsgrid.level"),
        align: "center",
        sortable: false,
        tooltip: t("components_player_modestatsgrid.leveldesc"),
        value: "level",
      },
    ];

    return {
      headers,
      gameModeStatsCombined,
      EGameMode,
      getTopPercent,
    };
  },
});
</script>

<style lang="scss" scoped>
.sub-value {
  font-size: 11px;
  border-top: 2px solid #122a42;
  text-align: center;
}

.v-theme--human, .v-theme--orc {
  .sub-value {
    border-top: 2px solid rgb(205, 205, 205);
  }
}
</style>
