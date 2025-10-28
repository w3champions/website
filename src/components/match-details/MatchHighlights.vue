<template>
  <v-col>
    <v-row>
      <v-col :order="left ? 0 : 1" :style="{ 'text-align': left ? 'right' : 'left' }" class="pa-1">
        <v-tooltip location="top" content-class="w3-tooltip elevation-1">
          <template v-slot:activator="{ props }">
            <v-icon class="mr-4 ml-4" v-bind="props">{{ mdiSkull }}</v-icon>
          </template>
          <div>{{ $t("components_match-details_matchhighlights.heroeskilled") }}</div>
        </v-tooltip>
      </v-col>
      <v-col :style="{ 'text-align': left ? 'left' : 'right' }" :class="heroKillsComparison" class="pa-1">
        {{ getText(heroKills) }}
      </v-col>
    </v-row>
    <v-row>
      <v-col :order="left ? 0 : 1" :style="{ 'text-align': left ? 'right' : 'left' }" class="pa-1">
        <v-tooltip location="top" content-class="w3-tooltip elevation-1">
          <template v-slot:activator="{ props }">
            <v-icon class="mr-4 ml-4" v-bind="props">{{ mdiChevronTripleUp }}</v-icon>
          </template>
          <div>{{ $t("components_match-details_matchhighlights.xpgained") }}</div>
        </v-tooltip>
      </v-col>
      <v-col :class="experienceComparison" :style="{ 'text-align': left ? 'left' : 'right' }" class="pa-1">
        {{ getText(experience) }}
      </v-col>
    </v-row>
    <v-row>
      <v-col :order="left ? 0 : 1" :style="{ 'text-align': left ? 'right' : 'left' }" class="pa-1">
        <v-tooltip location="top" content-class="w3-tooltip elevation-1">
          <template v-slot:activator="{ props }">
            <v-icon class="mr-4 ml-4" v-bind="props">{{ mdiTreasureChest }}</v-icon>
          </template>
          <div>{{ $t("components_match-details_matchhighlights.itemscollected") }}</div>
        </v-tooltip>
      </v-col>
      <v-col :class="itemsCollectedComparison" :style="{ 'text-align': left ? 'left' : 'right' }" class="pa-1">
        {{ getText(itemsCollected) }}
      </v-col>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { mdiChevronTripleUp, mdiSkull, mdiTreasureChest } from "@mdi/js";

export default defineComponent({
  name: "MatchHighlights",
  components: {},
  props: {
    notColorWinner: {
      type: Boolean,
      required: false,
      default: false,
    },
    experience: {
      type: Number,
      required: true,
    },
    experienceOpponent: {
      type: Number,
      required: true,
    },
    left: {
      type: Boolean,
      required: false,
      default: false,
    },
    heroKills: {
      type: Number,
      required: true,
    },
    heroKillsOpponent: {
      type: Number,
      required: true,
    },
    itemsCollected: {
      type: Number,
      required: true,
    },
    itemsCollectedOpponent: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const heroKillsComparison = ref<string>(comparison(props.heroKillsOpponent, props.heroKills));
    const itemsCollectedComparison = ref<string>(comparison(props.itemsCollectedOpponent, props.itemsCollected));
    const experienceComparison = ref<string>(comparison(props.experienceOpponent, props.experience));

    function comparison(opponent: number, me: number) {
      if (props.notColorWinner || hasFaultyData(opponent, me)) return "";
      const percentageDiff = Math.abs(opponent - me) / ((opponent + me) / 2);
      if (!percentageDiff || percentageDiff < 0.25) return "";
      return opponent > me ? "w3-lost" : "w3-won";
    }

    function hasFaultyData(opponent: number, me: number): boolean {
      return isNaN(Number(opponent)) || isNaN(Number(me));
    }

    const getText = (value?: number): number | string => value ?? "N/A";

    return {
      mdiSkull,
      mdiChevronTripleUp,
      mdiTreasureChest,
      heroKillsComparison,
      itemsCollectedComparison,
      experienceComparison,
      getText,
    };
  },
});
</script>
