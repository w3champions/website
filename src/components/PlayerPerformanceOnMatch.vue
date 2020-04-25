<template>
  <div>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Units Killed
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col :order="left ? 2 : 0" cols="2" :align="left ? 'left' : 'right'">
        {{ unitScore.unitsKilled }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Units Produced
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col :order="left ? 2 : 0" cols="2" :align="left ? 'left' : 'right'">
        {{ unitScore.unitsProduced }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Gold Mined
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col :order="left ? 2 : 0" cols="2" :align="left ? 'left' : 'right'">
        {{ resourceScoure.goldCollected }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Lumber Harversted
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col :order="left ? 2 : 0" cols="2" :align="left ? 'left' : 'right'">
        {{ resourceScoure.lumberCollected }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Upkeep lost
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col :order="left ? 2 : 0" cols="2" :align="left ? 'left' : 'right'">
        {{ resourceScoure.goldUpkeepLost }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Largest army
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col class="text-smaller" :order="left ? 2 : 0" cols="2" :align="left ? 'left' : 'right'">
        {{ unitScore.largestArmy }}
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ResourceScore, UnitScore } from "@/store/typings";

@Component({})
export default class PlayerPerformanceOnMatch extends Vue {
  @Prop() left!: boolean;

  @Prop() unitScore!: UnitScore;
  @Prop() resourceScoure!: ResourceScore;
}
</script>
