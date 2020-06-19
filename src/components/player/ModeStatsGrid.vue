<template>
  <v-data-table
    hide-default-footer
    :headers="headers"
    :items="gameModeStatsCombined"
    mobile-breakpoint="400"
  >
    <template v-slot:body="{ items }">
      <tbody>
        <tr v-for="item in items" :key="item.gameMode">
          <td>{{ $t("gameModes." + gameModeEnums[item.gameMode]) }}</td>
          <td class="number-text text-start">
            <span class="won">{{ item.wins }}</span>
            -
            <span class="lost">{{ item.losses }}</span>
            <span style="float: right">({{ (item.winrate * 100).toFixed(1) }}%)</span>
          </td>
          <td class="number-text text-end">
            <span v-if="is2v2(item) && item.rank !== 0"></span>
            {{ item.rank !== 0 ? item.mmr : "-" }}
          </td>
          <td class="number-text text-end">
            <span v-if="is2v2(item) && item.rank !== 0"></span>
            {{ item.rank !== 0 ? item.rankingPoints : "-" }}
          </td>
        </tr>
      </tbody>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { EGameMode } from "@/store/typings";
import { ModeStat } from "@/store/player/types";

@Component({})
export default class ModeStatsGrid extends Vue {
  @Prop() public stats!: ModeStat[];

  public gameModeEnums = EGameMode;

  public is2v2(stats: ModeStat) {
    return stats.gameMode === EGameMode.GM_2ON2_AT;
  }

  get gameModeStatsCombined() {
    let gm2v2s = [];

    for (var i = 0; i < this.stats.length; i++) {
      if (this.stats[i].gameMode === EGameMode.GM_2ON2_AT) {
        gm2v2s.push(this.stats[i]);
      }
    }

    if (gm2v2s.length === 0) return this.stats;

    const combindes2v2 = gm2v2s.reduce(
      (a, b) => ({
        gameMode: EGameMode.GM_2ON2_AT,
        gateWay: b.gateWay,
        wins: b.wins + a.wins,
        losses: b.losses + a.losses,
        games: b.games + a.games,
        winrate: 0,
        mmr: b.mmr + a.mmr,
        rankingPoints: b.rankingPoints + a.rankingPoints,
        leagueId: 0,
        leagueOrder: 0,
        division: 0,
        rank: b.rank + a.rank, // just so there is something in there, and it gets displayed if at least one team is ranked
        season: b.season,
      }),
      {
        wins: 0,
        losses: 0,
        games: 0,
        winrate: 0,
        mmr: 0,
        rank: 0,
        rankingPoints: 0,
      }
    );

    combindes2v2.winrate =
      combindes2v2.wins / (combindes2v2.wins + combindes2v2.losses);
    combindes2v2.mmr = Math.round(combindes2v2.mmr / gm2v2s.length);
    combindes2v2.rankingPoints = Math.round(
      combindes2v2.rankingPoints / gm2v2s.length
    );

    const gm1v1 = this.stats.find((g) => g.gameMode === EGameMode.GM_1ON1);

    const ffa = this.stats.find((g) => g.gameMode === EGameMode.GM_FFA);

    const gm2v2 = this.stats.find((g) => g.gameMode === EGameMode.GM_2ON2);

    return [gm1v1, gm2v2, combindes2v2, ffa].filter((i) => i); //filter out nulls
  }

  public headers = [
    {
      text: "Mode",
      align: "start",
      sortable: false,
    },
    {
      text: "Win/Loss",
      align: "start",
      sortable: false,
    },
    {
      text: "MMR",
      align: "end",
      sortable: false,
    },
    {
      text: "RP",
      align: "end",
      sortable: false,
    },
  ];
}
</script>
