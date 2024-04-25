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
      class="support-subcard"
      tile
      outlined
      @click.stop="setBtcDialogOpen(true)"
    >
      <v-img :src="`/assets/socials/${cryptos()[0].coin}_button.png`" :alt="cryptos()[0].name"></v-img>
      <crypto-dialog
        v-model="btcDialog"
        :crypto="cryptos()[0].coin"
        :cryptoName="cryptos()[0].name"
        :cryptoAddress="cryptos()[0].address"
      ></crypto-dialog>
    </v-card>

    <v-card
      class="support-subcard"
      tile
      outlined
      @click.stop="setEthDialogOpen(true)"
    >
      <v-img :src="`/assets/socials/${cryptos()[1].coin}_button.png`" :alt="cryptos()[1].name"></v-img>
      <crypto-dialog
        v-model="ethDialog"
        :crypto="cryptos()[1].coin"
        :cryptoName="cryptos()[1].name"
        :cryptoAddress="cryptos()[1].address"
      ></crypto-dialog>
    </v-card>

    <v-card
      class="support-subcard"
      tile
      outlined
      @click.stop="setLtcDialogOpen(true)"
    >
      <v-img :src="`/assets/socials/${cryptos()[2].coin}_button.png`" :alt="cryptos()[2].name"></v-img>
      <crypto-dialog
        v-model="ltcDialog"
        :crypto="cryptos()[2].coin"
        :cryptoName="cryptos()[2].name"
        :cryptoAddress="cryptos()[2].address"
      ></crypto-dialog>
    </v-card>

    <!-- Alipay -->
    <v-card
      class="support-subcard"
      tile
      outlined
      @click.stop="setAliPayDialogOpen(true)"
    >
      <alternate-payments-dialog
        v-model="aliPayDialog"
        name="AliPay"
      ></alternate-payments-dialog>
      <v-img src="/assets/socials/AliPay_button.png" alt="AliPay"></v-img>
    </v-card>

    <!-- WeChat -->
    <v-card
      class="support-subcard"
      tile
      outlined
      @click.stop="setWeChatDialogOpen(true)"
    >
      <alternate-payments-dialog
        v-model="weChatDialog"
        name="WeChat"
      ></alternate-payments-dialog>
      <v-img src="/assets/socials/WeChat_button.png" alt="WeChat"></v-img>
    </v-card>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import CryptoDialog from "@/components/common/CryptoDialog.vue";
import AlternatePaymentsDialog from "@/components/common/AlternatePaymentsDialog.vue";

export default defineComponent({
  name: "SupportBox",
  components: {
    CryptoDialog,
    AlternatePaymentsDialog,
  },
  props: {},
  setup(props, context) {
    const btcDialog = ref(false);
    const ethDialog = ref(false);
    const ltcDialog = ref(false);
    const aliPayDialog = ref(false);
    const weChatDialog = ref(false);

    function setBtcDialogOpen(val: boolean): void {
      btcDialog.value = val;
    }
    function setEthDialogOpen(val: boolean): void {
      ethDialog.value = val;
    }
    function setLtcDialogOpen(val: boolean): void {
      ltcDialog.value = val;
    }
    function setAliPayDialogOpen(val: boolean): void {
      aliPayDialog.value = val;
    }
    function setWeChatDialogOpen(val: boolean): void {
      weChatDialog.value = val;
    }

    function alternates(): string[] {
      return ["AliPay", "WeChat"];
    }

    function cryptos(): { coin: string; name: string; address: string }[] {
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
        },
      ];
    }

    return {
      btcDialog,
      ethDialog,
      ltcDialog,
      aliPayDialog,
      weChatDialog,
      setBtcDialogOpen,
      setEthDialogOpen,
      setLtcDialogOpen,
      setAliPayDialogOpen,
      setWeChatDialogOpen,
      alternates,
      cryptos,
    }
  },
});
</script>

<style>
.support-subcard {
  border: none !important;
  padding: 1px;
}

.support-card {
  padding: 1px;
}
</style>
