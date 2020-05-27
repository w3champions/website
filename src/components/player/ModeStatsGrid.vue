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
          <td class="number-text text-end">
            <span class="won">{{ item.wins }}</span>
            -
            <span class="lost">{{ item.losses }}</span>
            ({{ (item.winrate * 100).toFixed(1) }}%)
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
    const gm2v2s = this.stats.filter(
      (g) => g.gameMode === EGameMode.GM_2ON2_AT
    );
    if (gm2v2s.length === 0) return this.stats;
    const combindes2v2 = gm2v2s.reduce(
      (a, b) => ({
        gameMode: EGameMode.GM_2ON2_AT,
        gateWay: b.gateWay,
        wins: b.wins + a.wins,
        losses: b.losses + a.losses,
        games: b.games + a.games,
        winrate: (b.winrate + a.winrate) / 2,
        mmr: Math.floor((b.mmr + a.mmr) / 2),
        rankingPoints: Math.floor((b.rankingPoints + a.rankingPoints) / 2),
        leagueId: 0,
        leagueOrder: 0,
        division: 0,
        rank: 0,
        season: b.season,
      }),
      {
        wins: 0,
        losses: 0,
        games: 0,
        winrate: gm2v2s[0]?.winrate ?? 0,
        mmr: gm2v2s[0]?.mmr ?? 0,
        rankingPoints: gm2v2s[0]?.rankingPoints ?? 0,
      }
    );
    const not2v2s = this.stats.filter(
      (g) => g.gameMode !== EGameMode.GM_2ON2_AT
    );

    return [...not2v2s, combindes2v2];
  }

  public headers = [
    {
      text: "Mode",
      align: "start",
      sortable: false,
    },
    {
      text: "Win/Loss",
      align: "end",
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
