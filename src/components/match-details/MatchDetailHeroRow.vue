<template>
  <v-row justify="center">
    <v-col
      v-if="heroesOfWinner.length !== 3"
      :cols="heroesOfWinner.length === 1 ? 2 : 1"
    />
    <v-col cols="1" v-if="heroesOfWinner.length === 3">
      <hero-icon :hero="heroesOfWinner[2]" />
    </v-col>
    <v-col cols="1" v-if="heroesOfWinner.length >= 2">
      <hero-icon :hero="heroesOfWinner[1]" />
    </v-col>
    <v-col cols="1">
      <hero-icon
        :first-hero="true"
        :hero="heroesOfWinner[0]"
        v-if="heroesOfWinner.length >= 1"
      />
    </v-col>
    <v-col cols="2">
      <match-highlights
        :left="true"
        :not-color-winner="notColorWinner"
        :experience="getDescription(scoresOfWinner.expGained)"
        :hero-kills="getDescription(scoresOfWinner.heroesKilled)"
        :items-collected="getDescription(scoresOfWinner.itemsObtained)"
        :hero-kills-opponent="getDescription(scoresOfLoser.heroesKilled)"
        :experience-opponent="getDescription(scoresOfLoser.expGained)"
        :items-collected-opponent="getDescription(scoresOfLoser.itemsObtained)"
      />
    </v-col>
    <v-col cols="2">
      <match-highlights
        :not-color-winner="notColorWinner"
        :experience="getDescription(scoresOfLoser.expGained)"
        :hero-kills="getDescription(scoresOfLoser.heroesKilled)"
        :items-collected="getDescription(scoresOfLoser.itemsObtained)"
        :hero-kills-opponent="getDescription(scoresOfWinner.heroesKilled)"
        :experience-opponent="getDescription(scoresOfWinner.expGained)"
        :items-collected-opponent="getDescription(scoresOfWinner.itemsObtained)"
      />
    </v-col>
    <v-col cols="1">
      <hero-icon :first-hero="true" :hero="heroesOfLoser[0]" />
    </v-col>
    <v-col cols="1" v-if="heroesOfLoser.length >= 2">
      <hero-icon :hero="heroesOfLoser[1]" />
    </v-col>
    <v-col cols="1" v-if="heroesOfLoser.length === 3">
      <hero-icon :hero="heroesOfLoser[2]" />
    </v-col>
    <v-col
      v-if="heroesOfLoser.length !== 3"
      :cols="heroesOfLoser.length <= 1 ? 2 : 1"
    />
  </v-row>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
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
      required: true,
    },
    heroesOfWinner: {
      type: Array<Hero>,
      false: true,
      default: undefined,
    },
    heroesOfLoser: {
      type: Array<Hero>,
      false: true,
      default: undefined,
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
  setup() {
    const getDescription = (value?: number) => value ?? "N/A";

    return {
      getDescription
    };
  },
});
</script>
