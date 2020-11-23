<template>
  <v-card tile class="socials-card">
    <v-card-text class="text-center" style="opacity: 0.87 ">
      Find us on:
    </v-card-text>

    <!-- DISCORD -->
    <v-card class="socials-subcard" href="https://discord.gg/uJmQxG2" tile outlined style="padding-bottom: 0px">
        <v-img src="../../../src/assets/socials/Discord_button.png" />
    </v-card>

    <!-- TWITTER -->
    <v-card class="socials-subcard" href="https://twitter.com/W3ChampionsTeam" tile outlined>
        <v-img src="../../assets/socials/Twitter_button.png" />
    </v-card>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class SocialBox extends Vue {
  @Prop() title!: string;
  @Prop() text!: string;
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
