<template>
  <v-row justify="center">
    <v-col
      v-if="heroesOfWinner.length !== 3"
      :cols="heroesOfWinner.length <= 1 ? 2 : 1"
    />
    <v-col v-if="heroesOfWinner.length === 3" cols="1">
      <hero-icon :hero="heroesOfWinner[2]" />
    </v-col>
    <v-col v-if="heroesOfWinner.length >= 2" cols="1">
      <hero-icon :hero="heroesOfWinner[1]" />
    </v-col>
    <v-col cols="1">
      <hero-icon
        v-if="heroesOfWinner.length >= 1"
        :first-hero="true"
        :hero="heroesOfWinner[0]"
      />
    </v-col>
    <v-col cols="2">
      <match-highlights
        :left="true"
        :not-color-winner="notColorWinner"
        :experience="scoresOfWinner.expGained"
        :hero-kills="scoresOfWinner.heroesKilled"
        :items-collected="scoresOfWinner.itemsObtained"
        :hero-kills-opponent="scoresOfLoser.heroesKilled"
        :experience-opponent="scoresOfLoser.expGained"
        :items-collected-opponent="scoresOfLoser.itemsObtained"
      />
    </v-col>
    <v-col cols="2">
      <match-highlights
        :not-color-winner="notColorWinner"
        :experience="scoresOfLoser.expGained"
        :hero-kills="scoresOfLoser.heroesKilled"
        :items-collected="scoresOfLoser.itemsObtained"
        :hero-kills-opponent="scoresOfWinner.heroesKilled"
        :experience-opponent="scoresOfWinner.expGained"
        :items-collected-opponent="scoresOfWinner.itemsObtained"
      />
    </v-col>
    <v-col cols="1">
      <hero-icon :first-hero="true" :hero="heroesOfLoser[0]" />
    </v-col>
    <v-col v-if="heroesOfLoser.length >= 2" cols="1">
      <hero-icon :hero="heroesOfLoser[1]" />
    </v-col>
    <v-col v-if="heroesOfLoser.length === 3" cols="1">
      <hero-icon :hero="heroesOfLoser[2]" />
    </v-col>
    <v-col
      v-if="heroesOfLoser.length !== 3"
      :cols="heroesOfLoser.length <= 1 ? 2 : 1"
    />
  </v-row>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Hero, HeroScore } from "@/store/types";
import HeroIcon from "@/components/match-details/HeroIcon.vue";
import MatchHighlights from "@/components/match-details/MatchHighlights.vue";

export default defineComponent({
  name: "MatchDetailHeroRow",
  components: {
    MatchHighlights,
    HeroIcon,
  },
  props: {
    notColorWinner: {
      type: Boolean,
      required: false,
      default: false,
    },
    heroesOfWinner: {
      type: Array<Hero>,
      false: true,
      default: [],
    },
    heroesOfLoser: {
      type: Array<Hero>,
      false: true,
      default: [],
    },
    scoresOfWinner: {
      type: Object as PropType<HeroScore>,
      false: true,
      default: undefined,
    },
    scoresOfLoser: {
      type: Object as PropType<HeroScore>,
      false: true,
      default: undefined,
    },
  },
});
</script>
