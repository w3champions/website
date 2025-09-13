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
      <v-img src="/assets/socials/Patreon_button.png" alt="Patreon" />
    </v-card>

    <!-- PAYPAL -->
    <v-card
      class="support-subcard"
      href="https://www.paypal.me/w3championsdonate"
      target="_blank"
      tile
      outlined
    >
      <v-img src="/assets/socials/PayPal_button.png" alt="Paypal" />
    </v-card>

    <!-- CRYPTOCURRENCIES -->
    <v-card
      v-for="(crypto) in cryptos"
      :key="crypto.coin"
      class="support-subcard"
      tile
      outlined
      @click.stop="crypto.dialog = true"
    >
      <v-img :src="`/assets/socials/${crypto.coin}_button.png`" :alt="crypto.name" />
      <crypto-dialog
        v-model="crypto.dialog"
        :crypto="crypto.coin"
        :cryptoName="crypto.name"
        :cryptoAddress="crypto.address"
      />
    </v-card>

    <!-- Alternates -->
    <v-card
      v-for="(alternate) in alternates"
      :key="alternate.name"
      class="support-subcard"
      tile
      outlined
      @click.stop="alternate.dialog = true"
    >
      <alternate-payments-dialog
        v-model="alternate.dialog"
        :name="alternate.name"
      />
      <v-img :src="`/assets/socials/${alternate.name}_button.png`" :alt="alternate.name" />
    </v-card>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import CryptoDialog from "@/components/common/CryptoDialog.vue";
import AlternatePaymentsDialog from "@/components/common/AlternatePaymentsDialog.vue";

export default defineComponent({
  name: "SupportBox",
  components: {
    CryptoDialog,
    AlternatePaymentsDialog,
  },
  setup() {
    const cryptos = ref<{coin: string; name: string; address: string; dialog: boolean}[]>([
      { coin: `BTC`, name: "Bitcoin", address: `bc1qcm77d3hur2n83utam3h6e479cg6qrnwy8dlv80`, dialog: false },
      { coin: `ETH`, name: "Ethereum", address: `0x284a0e918e126dF38cFc0207c00D5564CAFbe658`, dialog: false },
      { coin: `LTC`, name: "Litecoin", address: `ltc1q4aq488zph7327nczu3vl3930xu9jke0jr2svh0`, dialog: false },
    ]);
    const alternates = ref<{ name: string; dialog: boolean }[]>([
      { name: "AliPay", dialog: false },
      { name: "WeChat", dialog: false },
    ]);

    return {
      cryptos,
      alternates,
    };
  },
});
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
