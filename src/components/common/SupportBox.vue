<template>
  <v-card class="support-card" tile>
    <v-card-text class="text-center text-primary" style="opacity: 0.87">
      Support us:
    </v-card-text>

    <!-- PATREON -->
    <v-card class="support-subcard" href="https://www.patreon.com/w3champions" tile outlined style="padding-bottom: 0px">
        <v-img src="@/assets/socials/Patreon_button.png" />
    </v-card>

    <!-- PAYPAL -->
    <v-card class="support-subcard" href="https://www.paypal.me/w3champions" tile outlined>
        <v-img src="@/assets/socials/PayPal_button.png" />
    </v-card>

    <!-- CRYPTOCURRENCIES -->

    <v-card 
      v-for="crypto in cryptos"
      v-bind:key="crypto.coin" 
      class="support-subcard" 
      tile 
      outlined
      @click.stop="openCryptoDialog = true">
        <v-img
          :src="button(crypto.coin)">
        </v-img>
        <crypto-dialog
          v-model="openCryptoDialog" 
          :crypto="crypto.coin" 
          :cryptoName="crypto.name"></crypto-dialog>
    </v-card>

  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import CryptoDialog from "@/components/common/CryptoDialog.vue";

@Component({ components: { CryptoDialog } })
export default class SupportBox extends Vue {
  @Prop() title!: string;
  @Prop() text!: string;

  openCryptoDialog = false;
  
  set clickedCoin(value : number) {
    this.clickedCoin = value;
  }

  get clickedCoin() : number {
    return this.clickedCoin;
  }

  private button(coin : string) : NodeRequire {
    return require(`@/assets/socials/${coin}_button.png`);
  }

  get cryptos() : unknown {
        return [
            {
                coin: `BTC`,
                name: "Bitcoin",
                address: `bc1qcm77d3hur2n83utam3h6e479cg6qrnwy8dlv80`,
            },
            {
                coin: `ETH`,
                name: "Ethereum",
                address: `0x284a0e918e126dF38cFc0207c00D5564CAFbe658`,
            },
            {
                coin: `LTC`,
                name: "Litecoin",
                address: `ltc1q4aq488zph7327nczu3vl3930xu9jke0jr2svh0`,
            }
        ];
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
