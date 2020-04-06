<template>
  <v-data-table hide-default-footer :headers="headers" :items="stats">
    <template v-slot:body="{ items }">
      <tbody>
        <tr
          @click="openPlayerProfile(item.battleTag)"
          v-for="item in items"
          :key="item.mode"
        >
          <td>{{ $t("gameModes." + gameModeEnums[item.mode]) }}</td>
          <td class="text-end won">{{ item.wins }}</td>
          <td class="text-end lost">{{ item.losses }}</td>
          <td class="text-end">{{ item.wins + item.losses }}</td>
          <td class="text-end">{{ (item.winrate * 100).toFixed(1) }}%</td>
          <td class="text-end">{{ Math.floor(item.mmr.rating) }}</td>
        </tr>
      </tbody>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { EGameMode } from "../store/typings";
import { ModeStat } from "../store/player/types";
import { Ranking } from "../store/ranking/types";

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
      width: "25px"
    },
    {
      text: "Wins",
      align: "end",
      sortable: false,
      value: "wins",
      width: "25px"
    },
    {
      text: "Losses",
      align: "end",
      sortable: false,
      value: "losses",
      width: "25px"
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
      value: "total",
      width: "25px"
    },
    {
      text: "Winrate",
      align: "end",
      sortable: false,
      value: "percentage",
      width: "25px"
    },
    {
      text: "Rating",
      align: "end",
      sortable: false,
      value: "level",
      width: "25px"
    }
  ];
}
</script>
