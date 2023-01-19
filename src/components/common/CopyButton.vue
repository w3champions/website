<template>
  <v-tooltip top>
    <template v-slot:activator="{ on, attrs }">
      <v-btn small v-bind="attrs" v-on="on" @click="copy">
        <v-icon>mdi-content-copy</v-icon>
      </v-btn>
    </template>
    <span>{{ $t(`components_common_copybutton.${tooltipText}`) }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class CopyButton extends Vue {
  @Prop() copyText!: string;
  @Prop({ default: "tooltip" }) tooltipText!: string;

  public copy() {
    navigator.clipboard.writeText(this.copyText);
  }
}
</script>
