<template>
  <v-card tile class="socials-card">
    <v-card-text class="text-center w3-gray-text" style="opacity: 0.87">
      {{ $t("views_home.joinus") }}
    </v-card-text>

    <!-- DISCORD -->
    <v-card
      class="socials-subcard"
      href="https://discord.gg/uJmQxG2"
      target="_blank"
      tile
      border
      style="padding-bottom: 0px"
    >
      <v-img src="/assets/socials/Discord_button.png" alt="Discord" />
    </v-card>

    <v-card-text class="text-center w3-gray-text" style="opacity: 0.87">
      {{ $t("views_home.socialmedia") }}
    </v-card-text>

    <!-- TWITTER -->
    <v-card
      class="socials-subcard"
      href="https://twitter.com/W3ChampionsTeam"
      target="_blank"
      tile
      border
    >
      <v-img src="/assets/socials/Twitter_button.png" alt="Twitter" />
    </v-card>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SocialBox",
  components: {},
});
</script>

<style lang="scss" scoped>
.socials-subcard {
  border: none !important;
  padding: 2px;
}

.socials-card {
  padding: 2px;
}
</style>
