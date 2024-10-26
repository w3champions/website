<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="stats"
      :items-per-page="-1"
      hide-default-footer
      :mobile-breakpoint="400"
      :hidden="stats.length === 0"
    >
      <template v-slot:body>
        <tbody>
          <tr v-for="item in stats" :key="item.map">
            <td>{{ item.map }}</td>
            <player-stats-race-versus-race-on-map-table-cell :stats="item.winLosses[1]" />
            <player-stats-race-versus-race-on-map-table-cell :stats="item.winLosses[2]" />
            <player-stats-race-versus-race-on-map-table-cell :stats="item.winLosses[4]" />
            <player-stats-race-versus-race-on-map-table-cell :stats="item.winLosses[3]" />
            <player-stats-race-versus-race-on-map-table-cell :stats="totalWins(item.winLosses)" />
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
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { TranslateResult } from "vue-i18n";
import { RaceStat, WinLossesOnMap } from "@/store/player/types";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import { ERaceEnum } from "@/store/types";

interface RaceToMapStatHeader {
  text: TranslateResult;
  sortable: boolean;
  width: string;
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
  setup() {
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

    const headers: RaceToMapStatHeader[] = [
      {
        text: t("components_overall-statistics_racetomapstat.map"),
        sortable: false,
        width: "25px",
      },
      {
        text: t("components_overall-statistics_racetomapstat.vshu"),
        sortable: false,
        width: "25px",
      },
      {
        text: t("components_overall-statistics_racetomapstat.vsorc"),
        sortable: false,
        width: "25px",
      },
      {
        text: t("components_overall-statistics_racetomapstat.vsne"),
        sortable: false,
        width: "25px",
      },
      {
        text: t("components_overall-statistics_racetomapstat.vsud"),
        sortable: false,
        width: "25px",
      },
      {
        text: t("components_overall-statistics_racetomapstat.total"),
        sortable: false,
        width: "25px",
      },
    ];

    return {
      headers,
      totalWins,
    };
  },
});
</script>
