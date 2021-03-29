<template>
  <v-card class="support-card" tile>
    <v-card-text class="text-center text-primary" style="opacity: 0.87">
      Support us:
    </v-card-text>

    <!-- PATREON -->
    <v-card class="support-subcard" href="https://www.patreon.com/w3champions" tile outlined style="padding-bottom: 0px">
        <v-img src="../../../src/assets/socials/Patreon_button.png" />
    </v-card>

    <!-- PAYPAL -->
    <v-card class="support-subcard" href="https://www.paypal.me/w3champions" tile outlined>
        <v-img src="../../../src/assets/socials/PayPal_button.png" />
    </v-card>

    <!-- BTC -->
    <v-card class="support-subcard" tile outlined>
      <template>
        <div @click.stop="openCryptoDialog = true">
          <v-img src="../../../src/assets/socials/Bitcoin_button.png" />
          <crypto-dialog :Crypto="`BTC`"></crypto-dialog>
        </div>
      </template>
    </v-card>

    <!-- ETH -->
    <v-card class="support-subcard" href="https://www.paypal.me/w3champions" tile outlined>
        <v-img src="../../../src/assets/socials/Ethereum_button.png" />
    </v-card>

    <!-- LTC -->
    <v-card class="support-subcard" href="https://www.paypal.me/w3champions" tile outlined>
        <v-img src="../../../src/assets/socials/Litecoin_button.png" />
    </v-card>

    <!-- MATCHERINO - TBD -->
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import CryptoDialog from "@/components/common/CryptoDialog.vue"

// In the long term, I want the current matcherino link for the
// latest end-of-season tournament to be auto-updated here.

// this would require adding the link to the state management
// then checking the latest season.

@Component({ components: { CryptoDialog } })
export default class SupportBox extends Vue {
  @Prop() title!: string;
  @Prop() text!: string;

  SupportBox() : void {
    this.openCryptoDialog = false;
  }

  set openCryptoDialog(value : boolean) {
    this.openCryptoDialog = value;
  };

  get openCryptoDialog() : boolean {
    return this.openCryptoDialog;
  }

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
