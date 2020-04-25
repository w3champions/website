<template>
  <div>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-icon class="mr-2">mdi-skull</v-icon>
      </v-col>
      <v-col :align="left ? 'left' : 'right'">
        {{ heroKills }}
      </v-col>
    </v-row>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-icon class="mr-2">mdi-chevron-triple-up</v-icon>
      </v-col>
      <v-col :align="left ? 'left' : 'right'">
        {{ experience }}
      </v-col>
    </v-row>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-icon class="mr-2">mdi-treasure-chest</v-icon>
      </v-col>
      <v-col :align="left ? 'left' : 'right'">
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
