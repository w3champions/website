<template>
  <v-data-table
    hide-default-footer
    :headers="headers"
    :items="gameModeStatsCombined"
    mobile-breakpoint="400"
  >
    <template v-for="h in headers" v-slot:[`header.${h.value}`]="{ header }">
      <v-tooltip top v-bind:key="h.text">
        <template v-slot:activator="{ on }">
          <span v-on="on">{{ header.text }}</span>
        </template>
        <span style="white-space: pre-line">{{ header.tooltip }}</span>
      </v-tooltip>
    </template>
    <template v-slot:body="{ items }">
      <tbody>
        <tr v-for="item in items" :key="item.gameMode + '_' + item.race">
          <td>
            <span>{{ $t("gameModes." + gameModeEnums[item.gameMode]) }}</span>
            <race-icon
              style="display: inline; padding-left: 10px"
              :race="item.race"
            />
          </td>
          <td class="number-text text-start">
            <div class="text-center">
              <span class="won">{{ item.wins }}</span>
              -
              <span class="lost">{{ item.losses }}</span>
            </div>
            <div class="sub-value">{{ (item.winrate * 100).toFixed(1) }}%</div>
          </td>
          <td class="number-text text-end">
            <span v-if="is2v2(item) && item.rank !== 0"></span>
            <div class="text-center">
              {{ item.rank !== 0 ? item.mmr : "-" }}
            </div>
            <div v-if="item.rank !== 0" class="sub-value">
              {{ getTopPercent(item) }}
            </div>
          </td>
          <td class="number-text text-center">
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
import RaceIcon from "@/components/player/RaceIcon.vue";

@Component({
  components: { RaceIcon },
})
export default class ModeStatsGrid extends Vue {
  @Prop() public stats!: ModeStat[];

  public gameModeEnums = EGameMode;

  public is2v2(stats: ModeStat): boolean {
    return stats.gameMode === EGameMode.GM_2ON2_AT;
  }

  get gameModeStatsCombined(): ModeStat[] {
    let gm2v2s = [];

    for (var i = 0; i < this.stats.length; i++) {
      if (this.stats[i].gameMode === EGameMode.GM_2ON2_AT) {
        gm2v2s.push(this.stats[i]);
      }
    }

    if (gm2v2s.length === 0) return this.stats;

    const combindes2v2 = this.combineStats(gm2v2s);

    combindes2v2.winrate =
      combindes2v2.wins / (combindes2v2.wins + combindes2v2.losses);
    combindes2v2.mmr = Math.round(combindes2v2.mmr / gm2v2s.length);
    combindes2v2.rankingPoints = Math.round(
      combindes2v2.rankingPoints / gm2v2s.length
    );
    combindes2v2.quantile = combindes2v2.quantile / gm2v2s.length;

    const gm1v1 = this.stats.filter((g) => g.gameMode === EGameMode.GM_1ON1);

    const ffa = this.stats.find((g) => g.gameMode === EGameMode.GM_FFA);

    const gm2v2 = this.stats.find((g) => g.gameMode === EGameMode.GM_2ON2);

    const gm4v4 = this.stats.find((g) => g.gameMode === EGameMode.GM_4ON4);

    return [...gm1v1, gm2v2, combindes2v2, gm4v4, ffa].filter((i) => i); //filter out nulls
  }

  private combineStats(gm2v2s: any[]) {
    return gm2v2s.reduce(
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
        quantile: b.quantile + a.quantile,
      }),
      {
        wins: 0,
        losses: 0,
        games: 0,
        winrate: 0,
        mmr: 0,
        rank: 0,
        rankingPoints: 0,
        quantile: 0,
      }
    );
  }

  getTopPercent(modeStat: ModeStat): string {
    if (modeStat.rank <= 0) {
      return "";
    }
    const quantilePerc = modeStat.quantile * 100;
    const topPerc = 100 - quantilePerc;

    if (topPerc > 90) {
      return "";
    }

    return `${this.$t("common.top")} ${Math.max(topPerc, 0.1).toFixed(1)}%`;
  }

  public headers = [
    {
      text: this.$t("components_player_modestatsgrid.mode"),
      align: "center",
      sortable: false,
      tooltip: this.$t("components_player_modestatsgrid.mode"),
    },
    {
      text: this.$t("components_player_modestatsgrid.winloss"),
      align: "center",
      sortable: false,
      tooltip: this.$t("components_player_modestatsgrid.winloss"),
    },
    {
      text: this.$t("components_player_modestatsgrid.mmr"),
      align: "center",
      sortable: false,
      tooltip: this.$t("components_player_modestatsgrid.mmr"),
    },
    {
      text: this.$t("components_player_modestatsgrid.rp"),
      align: "center",
      sortable: false,
      tooltip: this.$t("components_player_modestatsgrid.rpdesc"),
    },
  ];
}
</script>

<style lang="scss" scoped>
.sub-value {
  font-size: 11px;
  border-top: 2px solid #122a42;
  text-align: center;
}

.theme--light {
  .sub-value {
    border-top: 2px solid rgb(205, 205, 205);
  }
}

.tooltip-inner {
  white-space: pre-line;
}
</style>
