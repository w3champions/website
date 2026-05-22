<template>
  <v-card tile class="socials-card">
    <v-card-text class="text-center w3-mid-emphasis">
      {{ $t("views_home.partners") }}
    </v-card-text>
    <v-card
      v-for="(partner, index) in partners"
      :key="'partner_card_' + index"
      class="socials-subcard"
      tile
      :href="partner.link"
      target="_blank"
      border
      flat
    >
      <v-img :src="`/assets/partners/${partner.img}.jpg`" :alt="partner.img" />
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
const partners = [
  { img: "hive", link: "https://www.hiveworkshop.com/" },
  { img: "gym", link: "https://warcraft-gym.com" },
  { img: "msfds", link: "#" },
];
</script>

<style lang="scss" scoped>
.socials-subcard {
  border: none;
  padding: 2px;
}

.socials-card {
  padding: 2px;
}
</style>
