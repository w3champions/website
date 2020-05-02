<template>
  <v-data-table hide-default-footer :headers="headers" :items="stats" mobile-breakpoint="400">
    <template v-slot:body="{ items }">
      <tbody>
        <tr v-for="item in items" :key="item.mode">
          <td>{{ $t("gameModes." + gameModeEnums[item.mode]) }}</td>
          <td class="number-text text-end won">{{ item.wins }}</td>
          <td class="number-text text-end lost">{{ item.losses }}</td>
          <td class="number-text text-end">{{ item.wins + item.losses }}</td>
          <td class="number-text text-end">{{ (item.winrate * 100).toFixed(1) }}%</td>
          <td class="number-text text-end">{{ item.mmr }}</td>
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
      value: "type",
    },
    {
      text: "Wins",
      align: "end",
      sortable: false,
      value: "wins",
    },
    {
      text: "Losses",
      align: "end",
      sortable: false,
      value: "losses",
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
      value: "total",
    },
    {
      text: "Winrate",
      align: "end",
      sortable: false,
      value: "percentage",
    },
    {
      text: "Rating",
      align: "end",
      sortable: false,
      value: "level",
    }
  ];
}
</script>
