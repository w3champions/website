<template>
  <v-row justify="space-between">
    <v-col cols="1"> </v-col>
    <v-col cols="1">
      <hero-icon :hero="heroesOfWinner[2]" />
    </v-col>
    <v-col cols="1">
      <hero-icon :hero="heroesOfWinner[1]" />
    </v-col>
    <v-col cols="1">
      <hero-icon :first-hero="true" :hero="heroesOfWinner[0]" />
    </v-col>
    <v-col cols="2">
      <match-higlights
        :left="true"
        :experience="scoresOfWinner.expGained"
        :hero-kills="scoresOfWinner.heroesKilled"
        :items-collected="scoresOfWinner.itemsObtained"
        :hero-kills-opponent="scoresOfLooser.heroesKilled"
        :experience-opponent="scoresOfLooser.expGained"
        :items-collected-opponent="scoresOfLooser.itemsObtained"
      />
    </v-col>
    <v-col cols="2">
      <match-higlights
        :experience="scoresOfLooser.expGained"
        :hero-kills="scoresOfLooser.heroesKilled"
        :items-collected="scoresOfLooser.itemsObtained"
        :hero-kills-opponent="scoresOfWinner.heroesKilled"
        :experience-opponent="scoresOfWinner.expGained"
        :items-collected-opponent="scoresOfWinner.itemsObtained"
      />
    </v-col>
    <v-col cols="1">
      <hero-icon :first-hero="true" :hero="heroesOfLooser[0]" />
    </v-col>
    <v-col cols="1">
      <hero-icon :hero="heroesOfLooser[1]" />
    </v-col>
    <v-col cols="1">
      <hero-icon :hero="heroesOfLooser[2]" />
    </v-col>
    <v-col cols="1"> </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Hero, HeroScore } from "@/store/typings";
import HeroIcon from "@/components/match-details/HeroIcon.vue";
import MatchHiglights from "@/components/match-details/MatchHiglights.vue";

@Component({
  components: { MatchHiglights, HeroIcon }
})
export default class MatchDetailHeroRow extends Vue {
  @Prop() public heroesOfWinner!: Hero[];
  @Prop() public heroesOfLooser!: Hero[];
  @Prop() public scoresOfWinner!: HeroScore;
  @Prop() public scoresOfLooser!: HeroScore;
}
</script>
