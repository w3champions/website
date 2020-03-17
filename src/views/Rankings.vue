<template>
  <v-container>
    <v-row>
      <v-col cols="9">
        <v-card>
          <v-card-title>Rankings</v-card-title>
          <v-card-text>
            <v-data-table :items="data" :headers="headers"></v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="3">
        <v-card>
          <v-card-title>Stats</v-card-title>
          <v-list class="transparent">
            <v-list-item v-for="(stat, index) in stats" :key="index">
              <v-list-item-title>{{stat.name}}</v-list-item-title>
              <v-list-item-subtitle class="text-right">{{stat.value}}</v-list-item-subtitle>
            </v-list-item>
             
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class RankingsView extends Vue {
  public headers = [
    {
      text: "Rank",
      align: "start",
      sortable: true,
      value: "rank",
      width: "25px"
    },
    {
      text: "Player",
      align: "start",
      sortable: true,
      value: "name"
    },
    {
      text: "Wins",
      align: "end",
      sortable: true,
      value: "wins",
      width: "50px"
    },
    {
      text: "Losses",
      align: "end",
      sortable: true,
      value: "losses",
      width: "50px"
    },
    {
      text: "Matches",
      align: "end",
      sortable: true,
      value: "matches",
      width: "50px"
    }
  ];

  public data: any[] = [];
  public stats: any[] = [
      { name: 'Total matches', value: 10000 },
      { name: 'highest streak', value: 100},
      { name: 'best winrate', value: 'Player 1' },
  ];

  created() {
    for (let i = 0; i < 100; i++) {
      this.data.push({
        rank: i + 1,
        name: `Player ${i}`,
        race: "human",
        wins: 100 - i,
        losses: i,
        matches: 100
      });
    }
  }
}
</script>