<template>
  <v-data-table
    hide-default-footer
    :headers="headers"
    :items="stats"
  >
    <template v-slot:body="{ items }">
      <tbody>
        <tr v-for="item in items" :key="item.map">
          <td>{{ $t("mapNames." + item.map) }}</td>
          <td class="text-end">{{ toWinText(item.winLosses[1]) }}</td>
          <td class="text-end">{{ toWinText(item.winLosses[2]) }}</td>
          <td class="text-end">{{ toWinText(item.winLosses[3]) }}</td>
          <td class="text-end">{{ toWinText(item.winLosses[4]) }}</td>
          <td class="text-end">{{ totalWins(item.winLosses) }}</td>
        </tr>
      </tbody>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { RaceStat, WinLossesOnMap } from "@/store/player/types";

@Component({})
export default class RaceToMapStat extends Vue {
  @Prop() public stats!: WinLossesOnMap[];

  public toWinText(stat: RaceStat): string {
    return `${(stat.winrate * 100).toFixed(1)}% (${stat.wins}/${stat.losses})`;
  }

  public totalWins(stat: RaceStat[]): string {
    const totalWins = stat.map(s => s.wins).reduce((a, b) => a + b, 0);
    const totalLosses = stat.map(s => s.losses).reduce((a, b) => a + b, 0);
    const totalWinrate =
      totalLosses + totalWins != 0 ? totalWins / (totalWins + totalLosses) : 0;

    return `${(totalWinrate * 100).toFixed(1)}% (${totalWins}/${totalLosses})`;
  }

  public headers = [
    {
      text: "Map",
      align: "start",
      sortable: false,
      value: "type",
      width: "25px"
    },
    {
      text: "vs HU",
      align: "end",
      sortable: false,
      value: "wins",
      width: "25px"
    },
    {
      text: "vs OC",
      align: "end",
      sortable: false,
      value: "losses",
      width: "25px"
    },
    {
      text: "vs NE",
      align: "end",
      sortable: false,
      value: "total",
      width: "25px"
    },
    {
      text: "vs UD",
      align: "end",
      sortable: false,
      value: "percentage",
      width: "25px"
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
      value: "level",
      width: "25px"
    }
  ];
}
</script>
