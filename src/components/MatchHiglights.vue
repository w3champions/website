<template>
  <div>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon class="mr-2" v-on="on">mdi-skull</v-icon>
          </template>
          <div>
            Herokills
          </div>
        </v-tooltip>
      </v-col>
      <v-col class="text-no-wrap" :align="left ? 'left' : 'right'">
        {{ heroKills }}
      </v-col>
    </v-row>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon class="mr-2" v-on="on">mdi-chevron-triple-up</v-icon>
          </template>
          <div>
            Experience gained
          </div>
        </v-tooltip>
      </v-col>
      <v-col class="text-no-wrap" :align="left ? 'left' : 'right'">
        {{ experience }}
      </v-col>
    </v-row>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon class="mr-2" v-on="on">mdi-treasure-chest</v-icon>
          </template>
          <div>
            Items collected
          </div>
        </v-tooltip>
      </v-col>
      <v-col class="text-no-wrap" :align="left ? 'left' : 'right'">
        {{ itemsCollected }}
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class MatchHiglight extends Vue {
  @Prop() experience!: number;
  @Prop() left!: boolean;
  @Prop() heroKills!: number;
  @Prop() itemsCollected!: number;
}
</script>
