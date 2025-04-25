<template>
  <v-card-text>
    <v-card-title>Winrates of hero matchups</v-card-title>
    <v-row no-gutters>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="0"></hero-picture-select>
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="1"></hero-picture-select>
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="2"></hero-picture-select>
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="3"></hero-picture-select>
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="4"></hero-picture-select>
      </v-col>
      <v-col :cols="4" :sm="2">
        <hero-picture-select :hero-index="5"></hero-picture-select>
      </v-col>
    </v-row>
    <h2 class="justify-center text-center mt-4">
      <span :class="winrateClass" v-if="wins !== 0 && losses !== 0">
        {{ wins === 0 && losses === 0 ? "-" : (winrate * 100).toFixed(2) + "%" }}
      </span>
      <br />
      <span class="won">{{ wins }}</span>
      -
      <span class="lost">{{ losses }}</span>
    </h2>
    <br />
  </v-card-text>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import HeroPictureSelect from "@/components/overall-statistics/HeroPictureSelect.vue";
import { useOverallStatsStore } from "@/store/overallStats/store";

export default defineComponent({
  name: "HeroWinrate",
  components: {},
  props: {
    HeroPictureSelect,
  },
  setup() {
    const overallStatsStore = useOverallStatsStore();

    const winrateClass = computed<string>(() => {
      if (winrate.value > 0.55) return "won";
      if (winrate.value < 0.45) return "lost";
      return "";
    });

    const winrate = computed<number>(() => overallStatsStore.heroWinrate.winrate);
    const wins = computed<number>(() => overallStatsStore.heroWinrate.wins);
    const losses = computed<number>(() => overallStatsStore.heroWinrate.losses);

    onMounted(() => overallStatsStore.loadHeroWinrates());

    return {
      winrateClass,
      winrate,
      wins,
      losses,
    };
  },
});
</script>
