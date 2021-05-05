<template>
  <v-row justify="center">
    <v-col v-if="heroesOfWinner.length !== 3" :cols="heroesOfWinner.length === 1 ? 2 : 1" />
    <v-col cols="1" v-if="heroesOfWinner.length === 3">
      <hero-icon :hero="this.heroesOfWinner[2]" />
    </v-col>
    <v-col cols="1" v-if="heroesOfWinner.length >= 2">
      <hero-icon :hero="this.heroesOfWinner[1]" />
    </v-col>
    <v-col cols="1">
      <hero-icon
        :first-hero="true"
        :hero="this.heroesOfWinner[0]"
        v-if="heroesOfWinner.length >= 1"
      />
    </v-col>
    <v-col cols="2">
      <match-higlights
        :left="true"
        :not-color-winner="notColorWinner"
        :experience="scoresOfWinner.expGained || 'N/A'"
        :hero-kills="scoresOfWinner.heroesKilled || 'N/A'"
        :items-collected="scoresOfWinner.itemsObtained || 'N/A'"
        :hero-kills-opponent="scoresOfLooser.heroesKilled || 'N/A'"
        :experience-opponent="scoresOfLooser.expGained || 'N/A'"
        :items-collected-opponent="scoresOfLooser.itemsObtained || 'N/A'"
      />
    </v-col>
    <v-col cols="2">
      <match-higlights
        :not-color-winner="notColorWinner"
        :experience="scoresOfLooser.expGained || 'N/A'"
        :hero-kills="scoresOfLooser.heroesKilled || 'N/A'"
        :items-collected="scoresOfLooser.itemsObtained || 'N/A'"
        :hero-kills-opponent="scoresOfWinner.heroesKilled || 'N/A'"
        :experience-opponent="scoresOfWinner.expGained || 'N/A'"
        :items-collected-opponent="scoresOfWinner.itemsObtained || 'N/A'"
      />
    </v-col>
    <v-col cols="1">
      <hero-icon :first-hero="true" :hero="heroesOfLooser[0]" />
    </v-col>
    <v-col cols="1" v-if="heroesOfLooser.length >= 2">
      <hero-icon :hero="heroesOfLooser[1]" />
    </v-col>
    <v-col cols="1" v-if="heroesOfLooser.length === 3">
      <hero-icon :hero="heroesOfLooser[2]" />
    </v-col>
    <v-col v-if="heroesOfLooser.length !== 3" :cols="heroesOfLooser.length <= 1 ? 2 : 1" />
  </v-row>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Hero, HeroScore } from "@/store/typings";
import HeroIcon from "@/components/match-details/HeroIcon.vue";
import MatchHiglights from "@/components/match-details/MatchHiglights.vue";

@Component({
  components: { MatchHiglights, HeroIcon },
})
export default class MatchDetailHeroRow extends Vue {
  @Prop() public notColorWinner!: boolean;
  @Prop() public heroesOfWinner!: Hero[];
  @Prop() public heroesOfLooser!: Hero[];
  @Prop() public scoresOfWinner!: HeroScore;
  @Prop() public scoresOfLooser!: HeroScore;
}
</script>
