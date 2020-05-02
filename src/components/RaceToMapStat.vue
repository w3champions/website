<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="stats"
      hide-default-footer
      :hidden="stats.length === 0"
    >
      <template v-slot:body="{ items }">
        <tbody>
          <tr v-for="item in items" :key="item.map">
            <td>{{ $t("mapNames." + item.map) }}</td>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <td v-on="on" class="number-text">
                  {{ toWinText(item.winLosses[1]) }}
                </td>
              </template>
              <div>
                {{ winAndLossText(item.winLosses[1]) }}
              </div>
            </v-tooltip>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <td v-on="on" class="number-text">
                  {{ toWinText(item.winLosses[2]) }}
                </td>
              </template>
              <div>
                {{ winAndLossText(item.winLosses[2]) }}
              </div>
            </v-tooltip>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <td v-on="on" class="number-text">
                  {{ toWinText(item.winLosses[3]) }}
                </td>
              </template>
              <div>
                {{ winAndLossText(item.winLosses[3]) }}
              </div>
            </v-tooltip>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <td v-on="on" class="number-text">
                  {{ toWinText(item.winLosses[4]) }}
                </td>
              </template>
              <div>
                {{ winAndLossText(item.winLosses[4]) }}
              </div>
            </v-tooltip>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <td v-on="on" class="number-text">
                  {{ toWinText(totalWins(item.winLosses)) }}
                </td>
              </template>
              <div>
                {{ winAndLossText(totalWins(item.winLosses)) }}
              </div>
            </v-tooltip>
          </tr>
        </tbody>
      </template>
    </v-data-table>
    <v-card-text :hidden="stats.length !== 0">
      No games played with this race yet.
    </v-card-text>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { RaceStat, WinLossesOnMap } from "@/store/player/types";

@Component({})
export default class RaceToMapStat extends Vue {
  @Prop() public stats!: WinLossesOnMap[];

  public toWinText(stat: RaceStat): string {
    return `${(stat.winrate * 100).toFixed(1)}%`;
  }

  public winAndLossText(stat: RaceStat): string {
    return `(${stat.wins}/${stat.losses})`;
  }

  public totalWins(stat: RaceStat[]) {
    const totalWins = stat.map(s => s.wins).reduce((a, b) => a + b, 0);
    const totalLosses = stat.map(s => s.losses).reduce((a, b) => a + b, 0);
    const totalWinrate =
      totalLosses + totalWins != 0 ? totalWins / (totalWins + totalLosses) : 0;

    return { wins: totalWins, losses: totalLosses, winrate: totalWinrate };
  }

  public headers = [
    {
      text: "Map",
      align: "start",
      sortable: false,
      width: "25px"
    },
    {
      text: "vs Human",
      align: "start",
      sortable: false,
      width: "25px"
    },
    {
      text: "vs Orc",
      align: "start",
      sortable: false,
      width: "25px"
    },
    {
      text: "vs Nightelf",
      align: "start",
      sortable: false,
      width: "25px"
    },
    {
      text: "vs Undead",
      align: "start",
      sortable: false,
      width: "25px"
    },
    {
      text: "Total",
      align: "start",
      sortable: false,
      width: "25px"
    }
  ];
}
</script>
