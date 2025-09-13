<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="sortedStats"
      :items-per-page="-1"
      hide-default-footer
      :mobile-breakpoint="400"
      :hidden="stats.length === 0"
    >
      <template #:body>
        <tbody>
          <tr v-for="item in sortedStats" :key="item.mapName || item.map">
            <td>{{ item.mapName || item.map }}</td>
            <player-stats-race-versus-race-on-map-table-cell
              :stats="totalWins(item.winLosses)"
            />
            <player-stats-race-versus-race-on-map-table-cell
              v-for="(winLoss, index) in item.winLosses"
              :key="index"
              :stats="winLoss"
            />
          </tr>
        </tbody>
      </template>
    </v-data-table>
    <v-card-text :hidden="stats.length !== 0">
      {{ $t("components_overall-statistics_racetomapstat.nogamesplayed") }}
    </v-card-text>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { TranslateResult } from "vue-i18n";
import { RaceStat, WinLossesOnMap } from "@/store/player/types";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import { ERaceEnum } from "@/store/types";

interface RaceToMapStatHeader {
  text: TranslateResult;
  sortable: boolean;
  width: string;
  align?: "left" | "center" | "right";
}

export default defineComponent({
  name: "RaceToMapStat",
  components: {
    PlayerStatsRaceVersusRaceOnMapTableCell,
  },
  props: {
    stats: {
      type: Array<WinLossesOnMap>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    function totalWins(stat: RaceStat[]) {
      const totalGames = stat.map((s) => s.games).reduce((a, b) => a + b, 0);
      const totalWins = stat.map((s) => s.wins).reduce((a, b) => a + b, 0);
      const totalLosses = stat.map((s) => s.losses).reduce((a, b) => a + b, 0);
      const totalWinrate = totalLosses + totalWins != 0 ? totalWins / (totalWins + totalLosses) : 0;

      return {
        games: totalGames,
        wins: totalWins,
        losses: totalLosses,
        winrate: totalWinrate,
        race: ERaceEnum.TOTAL,
      };
    }

    const sortedStats = computed(() => {
      return [...props.stats]
        // Sort the maps by total games played, descending.
        .sort((a, b) => {
          const totalGamesA = a.winLosses.reduce((sum, current) => sum + current.games, 0);
          const totalGamesB = b.winLosses.reduce((sum, current) => sum + current.games, 0);
          return totalGamesB - totalGamesA;
        })
        .map((stat) => ({
          ...stat,
          winLosses: [...stat.winLosses]
            // Remove RANDOM race
            .filter((winLoss) => winLoss.race !== ERaceEnum.RANDOM)
            // Sort winLosses by race for consistent ordering
            .sort((a, b) => a.race - b.race),
        }));
    });

    const headers: RaceToMapStatHeader[] = [
      {
        text: t("components_overall-statistics_racetomapstat.map"),
        sortable: false,
        width: "25px",
      },
      {
        text: t("components_overall-statistics_racetomapstat.total"),
        sortable: false,
        width: "25px",
        align: "right",
      },
      {
        text: t("components_overall-statistics_racetomapstat.vshu"),
        sortable: false,
        width: "25px",
        align: "right",
      },
      {
        text: t("components_overall-statistics_racetomapstat.vsorc"),
        sortable: false,
        width: "25px",
        align: "right",
      },
      {
        text: t("components_overall-statistics_racetomapstat.vsne"),
        sortable: false,
        width: "25px",
        align: "right",
      },
      {
        text: t("components_overall-statistics_racetomapstat.vsud"),
        sortable: false,
        width: "25px",
        align: "right",
      },
    ];

    return {
      headers,
      totalWins,
      sortedStats,
    };
  },
});
</script>
