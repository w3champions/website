<template>
  <v-card class="support-card" tile>
    <v-card-text class="text-center w3-mid-emphasis">
      {{ $t("views_home.supportus") }}
    </v-card-text>

    <v-card
      v-for="link in SUPPORT_LINKS"
      :key="link.name"
      class="support-subcard"
      :href="link.url"
      target="_blank"
      rel="noopener"
      tile
      border
      flat
    >
      <v-img :src="`/assets/socials/${link.image}_button.png`" :alt="link.name" />
    </v-card>

    <!-- Alternates -->
    <v-card
      v-for="(alternate) in alternates"
      :key="alternate.name"
      class="support-subcard"
      tile
      border
      flat
      @click.stop="alternate.dialog = true"
    >
      <alternate-payments-dialog
        v-model="alternate.dialog"
        :name="alternate.name"
        @hide="alternate.dialog = false"
      />
      <v-img :src="`/assets/socials/${alternate.name}_button.png`" :alt="alternate.name" />
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AlternatePaymentsDialog from "@/components/common/AlternatePaymentsDialog.vue";

const SUPPORT_LINKS: { name: string; image: string; url: string }[] = [
  { name: "Patreon", image: "Patreon", url: "https://www.patreon.com/w3champions" },
  { name: "Ko-fi", image: "KoFi", url: "https://ko-fi.com/w3champions" },
  { name: "PayPal", image: "PayPal", url: "https://www.paypal.com/ncp/payment/5JW946QYQ6MHJ" },
  // The button image carries a Russian flag: Boosty is the option that works for supporters in Russia
  { name: "Boosty (Russia)", image: "Boosty", url: "https://boosty.to/w3champions" },
];

const alternates = ref<{ name: string; dialog: boolean }[]>([
  { name: "AliPay", dialog: false },
  { name: "WeChat", dialog: false },
]);
</script>

<style lang="scss" scoped>
.support-subcard {
  border: none;
  padding: 1px 2px;
}

.support-card {
  padding: 2px;
}
</style>
