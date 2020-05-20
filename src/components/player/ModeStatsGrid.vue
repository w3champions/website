<template>
  <v-data-table
    hide-default-footer
    :headers="headers"
    :items="stats"
    mobile-breakpoint="400"
  >
    <template v-slot:body="{ items }">
      <tbody>
        <tr v-for="item in items" :key="item.gameMode">
          <td>{{ $t("gameModes." + gameModeEnums[item.gameMode]) }}</td>
          <td class="number-text text-end won">{{ item.wins }}</td>
          <td class="number-text text-end lost">{{ item.losses }}</td>
          <td class="number-text text-end">{{ item.wins + item.losses }}</td>
          <td class="number-text text-end">
            {{ (item.winrate * 100).toFixed(1) }}%
          </td>
          <td class="number-text text-end">{{ item.mmr }}</td>
          <td class="number-text text-end">{{ item.rankingPoints }}</td>
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

  public headers = [
    {
      text: "Mode",
      align: "start",
      sortable: false,
    },
    {
      text: "Wins",
      align: "end",
      sortable: false,
    },
    {
      text: "Losses",
      align: "end",
      sortable: false,
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
    },
    {
      text: "Winrate",
      align: "end",
      sortable: false,
      value: "percentage",
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
