<template>
  <v-card class="w3-plaque partners-card">
    <h2 class="banner pt-3 px-4">{{ $t("views_home.partners") }}</h2>
    <div class="partners-list">
      <a
        v-for="(partner, index) in partners"
        :key="'partner_' + index"
        :href="partner.link"
        target="_blank"
        class="partner-logo"
      >
        <img :src="`/assets/partners/${partner.img}.jpg`" :alt="partner.img" />
      </a>
    </div>
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
.partners-card {
  padding-bottom: 16px;
}

.partners-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px 0;
}

.partner-logo {
  display: block;
  opacity: 0.8;
  transition: opacity 0.15s;

  img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 2px;
  }

  &:hover {
    opacity: 1;
  }
}
</style>
