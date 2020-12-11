<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <v-img 
          :src="icon"
          :max-height="18"
          :max-width="18"
        ></v-img>
      </span>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class HostIcon extends Vue {
  @Prop({}) host!: string;

  get icon(): unknown {
    console.log(this.host)
    if (this.host == undefined) {
      return require(`@/assets/icons/hosterror.png`) 
    }
    return require(`@/assets/icons/${this.host}.png`) 
  }

  get tooltip(): string {
    if (this.host == undefined) {
      return 'Error'
    }
    
    if (this.host == 'BNET') {
      return "Battle.net"
    } else {
      return "Flo"
    }
  }
}
</script>

<style></style>
