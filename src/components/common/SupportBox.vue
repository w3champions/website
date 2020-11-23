<template>
  <v-card class="support-card" tile>
    <v-card-text class="text-center text-primary" style="opacity: 0.87">
      Support us at:
    </v-card-text>

    <!-- PATREON -->
    <v-card class="support-subcard" href="https://www.patreon.com/w3champions" tile outlined style="padding-bottom: 0px">
        <v-img src="../../../src/assets/socials/Patreon_button.png" />
    </v-card>

    <!-- PAYPAL -->
    <v-card class="support-subcard" href="https://www.paypal.me/w3champions" tile outlined>
        <v-img src="../../../src/assets/socials/PayPal_button.png" />
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
.support-subcard {
  border: none !important;
  padding: 2px;
}

.support-card {
  padding: 2px;
}
</style>
