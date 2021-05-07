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
        :experience="getDescription(scoresOfWinner.expGained)"
        :hero-kills="getDescription(scoresOfWinner.heroesKilled)"
        :items-collected="getDescription(scoresOfWinner.itemsObtained)"
        :hero-kills-opponent="getDescription(scoresOfLooser.heroesKilled)"
        :experience-opponent="getDescription(scoresOfLooser.expGained)"
        :items-collected-opponent="getDescription(scoresOfLooser.itemsObtained)"
      />
    </v-col>
    <v-col cols="2">
      <match-higlights
        :not-color-winner="notColorWinner"
        :experience="getDescription(scoresOfLooser.expGained)"
        :hero-kills="getDescription(scoresOfLooser.heroesKilled)"
        :items-collected="getDescription(scoresOfLooser.itemsObtained)"
        :hero-kills-opponent="getDescription(scoresOfWinner.heroesKilled)"
        :experience-opponent="getDescription(scoresOfWinner.expGained)"
        :items-collected-opponent="getDescription(scoresOfWinner.itemsObtained)"
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

  public getDescription = (value?:number) => !!value || value === 0 ? value : "N/A"
}
</script>
