<template>
  <v-card tile class="socials-card">
    <v-card-text class="text-center" style="opacity: 0.87">
      {{ $t("views_home.partners") }}
    </v-card-text>
    <v-card
      v-for="(partner, index) in partners"
      v-bind:key="'partner_card_' + index"
      class="socials-subcard"
      tile
      :href="partner.link"
      target="_blank"
      outlined
    >
      <v-img :src="imgSource(partner.img)" :alt="partner.img"></v-img>
    </v-card>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class PartnerBox extends Vue {
  get partners() {
    return [
      {
        img: "back2warcraft",
        link: "https://www.back2warcraft.com/",
      },
      {
        img: "hive",
        link: "https://www.hiveworkshop.com/",
      },
      {
        img: "gym",
        link: "https://warcraft-gym.com",
      },
    ];
  }
  imgSource(name: string): string {
    return require(`@/assets/partners/${name}.jpg`);
  }
}
</script>

<style>
.socials-subcard {
  border: none !important;
  padding: 2px;
}

.socials-card {
  padding: 2px;
}
</style>
