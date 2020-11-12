<template>
  <v-card tile>
    <v-card-title>
      Find us on:
    </v-card-title>

    <!-- DISCORD -->
    <v-card href="https://discord.gg/uJmQxG2" tile outlined>
      <v-card-title>
        Discord
        <v-spacer></v-spacer>
        <img src="..\..\..\src\assets\discord-small.png" height="24px" />
      </v-card-title>
    </v-card>

    <!-- TWITTER -->
    <v-card href="https://twitter.com/W3ChampionsTeam" tile outlined>
      <v-card-title>
        Twitter
        <v-spacer></v-spacer>
        <img src="../../assets/twitter.svg" height="24" />
      </v-card-title>
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
.v-card {
  border: none !important;
}
</style>
