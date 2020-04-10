<template>
  <v-tabs>
    <v-tabs-slider></v-tabs-slider>
    <v-tab class="profileTab" :href="`#tab-1`">Humans</v-tab>
    <v-tab class="profileTab" :href="`#tab-2`">Orcs</v-tab>
    <v-tab class="profileTab" :href="`#tab-3`">Nightelf</v-tab>
    <v-tab class="profileTab" :href="`#tab-4`">Undead</v-tab>
    <v-tab-item :value="'tab-1'">
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <race-to-map-stat :stats="stats[1]" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
    <v-tab-item :value="'tab-2'">
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <race-to-map-stat :stats="stats[2]" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
    <v-tab-item :value="'tab-3'">
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <race-to-map-stat :stats="stats[3]" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
    <v-tab-item :value="'tab-4'">
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <race-to-map-stat :stats="stats[4]" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { RaceWinsOnMap } from "@/store/player/types";
import RaceToMapStat from "@/components/RaceToMapStat.vue";

@Component({
  components: { RaceToMapStat }
})
export default class PlayerStatsRaceVersusRaceOnMap extends Vue {
  @Prop() public stats!: RaceWinsOnMap[];
}
</script>
