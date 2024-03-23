<template>
  <v-container class="pa-0">
    <v-row class="pa-0" align="center" justify="center">
      <v-col>
        <img :src="flag()" width="22px" height="22px" />
      </v-col>
      <v-col v-if="showTwoLetterCode">{{ locale.toUpperCase() }}</v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";

@Component({})
export default class LocaleIcon extends Vue {
  @Prop() locale!: string;
  @Prop({ default: true }) showTwoLetterCode!: boolean;

  flag(): string {
    return `/assets/localeFlags/${this.locale}.svg`;
  }
}
</script>
