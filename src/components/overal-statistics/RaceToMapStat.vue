<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="stats"
      :items-per-page="Number.POSITIVE_INFINITY"
      hide-default-footer
      :mobile-breakpoint="400"
      :hidden="stats.length === 0"
    >
      <template v-slot:body="{ items }">
        <tbody>
          <tr v-for="item in items" :key="item.map">
            <td>{{ $t("mapNames." + item.map) }}</td>
            <player-stats-race-versus-race-on-map-table-cell
              :stats="item.winLosses[1]"
            />
            <player-stats-race-versus-race-on-map-table-cell
              :stats="item.winLosses[2]"
            />
            <player-stats-race-versus-race-on-map-table-cell
              :stats="item.winLosses[4]"
            />
            <player-stats-race-versus-race-on-map-table-cell
              :stats="item.winLosses[3]"
            />
            <player-stats-race-versus-race-on-map-table-cell
              :stats="totalWins(item.winLosses)"
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
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { RaceStat, WinLossesOnMap } from "@/store/player/types";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";

@Component({
  components: { PlayerStatsRaceVersusRaceOnMapTableCell },
})
export default class RaceToMapStat extends Vue {
  @Prop() public stats!: WinLossesOnMap[];

  public totalWins(stat: RaceStat[]) {
    const totalWins = stat.map((s) => s.wins).reduce((a, b) => a + b, 0);
    const totalLosses = stat.map((s) => s.losses).reduce((a, b) => a + b, 0);
    const totalWinrate =
      totalLosses + totalWins != 0 ? totalWins / (totalWins + totalLosses) : 0;

    return { wins: totalWins, losses: totalLosses, winrate: totalWinrate };
  }

  public headers = [
    {
      text: this.$t("components_overall-statistics_racetomapstat.map"),
      align: "start",
      sortable: false,
      width: "25px",
    },
    {
      text: this.$t("components_overall-statistics_racetomapstat.vshu"),
      align: "start",
      sortable: false,
      width: "25px",
    },
    {
      text: this.$t("components_overall-statistics_racetomapstat.vsorc"),
      align: "start",
      sortable: false,
      width: "25px",
    },
    {
      text: this.$t("components_overall-statistics_racetomapstat.vsne"),
      align: "start",
      sortable: false,
      width: "25px",
    },
    {
      text: this.$t("components_overall-statistics_racetomapstat.vsud"),
      align: "start",
      sortable: false,
      width: "25px",
    },
    {
      text: this.$t("components_overall-statistics_racetomapstat.total"),
      align: "start",
      sortable: false,
      width: "25px",
    },
  ];
}
</script>
