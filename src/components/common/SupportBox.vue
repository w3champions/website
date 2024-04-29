<template>
  <v-card class="support-card" tile>
    <v-card-text class="text-center text-primary" style="opacity: 0.87">
      {{ $t("views_home.supportus") }}
    </v-card-text>

    <!-- PATREON -->
    <v-card
      class="support-subcard"
      href="https://www.patreon.com/w3champions"
      target="_blank"
      tile
      outlined
      style="padding-bottom: 0px"
    >
      <v-img src="/assets/socials/Patreon_button.png" alt="Patreon"/>
    </v-card>

    <!-- PAYPAL -->
    <v-card
      class="support-subcard"
      href="https://www.paypal.me/w3champions"
      target="_blank"
      tile
      outlined
    >
      <v-img src="/assets/socials/PayPal_button.png" alt="Paypal"/>
    </v-card>

    <!-- CRYPTOCURRENCIES -->
    <v-card
      v-for="(crypto, index) in cryptos"
      v-bind:key="crypto.coin"
      class="support-subcard"
      tile
      outlined
      @click.stop="updateTracker(index, cryptoDialogTracker)"
    >
      <v-img :src="`/assets/socials/${crypto.coin}_button.png`" :alt="crypto.name"></v-img>
      <crypto-dialog
        v-model="cryptoDialogTracker[index]"
        :crypto="crypto.coin"
        :cryptoName="crypto.name"
        :cryptoAddress="crypto.address"
      ></crypto-dialog>
    </v-card>

    <!-- Alternates -->
    <v-card
      v-for="(name, index) in alternates"
      v-bind:key="index"
      class="support-subcard"
      tile
      outlined
      @click.stop="updateTracker(index, alternateDialogTracker)"
    >
      <alternate-payments-dialog
        v-model="alternateDialogTracker[index]"
        :name="name"
      ></alternate-payments-dialog>
      <v-img :src="`/assets/socials/${name}_button.png`" :alt="name"></v-img>
    </v-card>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import CryptoDialog from "@/components/common/CryptoDialog.vue";
import AlternatePaymentsDialog from "@/components/common/AlternatePaymentsDialog.vue";

export default {
  name: "SupportBox",
  data() {
    return {
      cryptos: [
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
        },
      ],
      alternates: ["AliPay", "WeChat"],
      cryptoDialogTracker: [false, false, false],
      alternateDialogTracker: [false, false],
    }
  },
  mounted() {},
  methods: {
    updateTracker: function(index: number, dialogTracker: boolean[]): void {
      for (let i = 0; i < dialogTracker.length; i++) {
        Vue.set(dialogTracker, i, false);
      }
      Vue.set(dialogTracker, index, true);
    }
  },
}
</script>

<style lang="scss" scoped>
.support-subcard {
  border: none !important;
  padding: 1px;
}

.support-card {
  padding: 1px;
}
</style>
