<template>
  <v-card tile>
    <v-card-title>
      Support us at:
    </v-card-title>

    <!-- PATREON -->
    <v-card class="socials-card" href="https://www.patreon.com/w3champions" tile outlined>
      <v-card-title>
        Patreon
        <v-spacer></v-spacer>
        <img src="../../../src/assets/patreon.png" height="24" />
      </v-card-title>
    </v-card>

    <!-- PAYPAL -->
    <v-card class="socials-card" href="https://www.paypal.me/w3champions" tile outlined>
      <v-card-title>
        Paypal
        <v-spacer></v-spacer>
        <img src="../../../src/assets/paypal.png" height="24" />
      </v-card-title>
    </v-card>

    <!-- MATCHERINO - TBD -->
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

// In the long term, I want the current matcherino link for the
// latest end-of-season tournament to be auto-updated here.

// this would require adding the link to the state management
// then checking the latest season.

@Component({})
export default class SupportBox extends Vue {
  @Prop() title!: string;
  @Prop() text!: string;

  get patreon(): string {
    return "https://www.patreon.com/w3champions";
  }
}
</script>

<style>
.socials-card {
  border: none !important;
}
</style>
