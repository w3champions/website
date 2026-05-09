<template>
  <v-card-text>
    <v-card-title>Winrates of hero matchups</v-card-title>
    <v-row no-gutters class="hero-matchup-row">
      <v-col cols="12" sm="5">
        <v-row no-gutters>
          <v-col cols="4">
            <hero-picture-select :hero-index="0" />
          </v-col>
          <v-col cols="4">
            <hero-picture-select :hero-index="1" />
          </v-col>
          <v-col cols="4">
            <hero-picture-select :hero-index="2" />
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" sm="2" class="hero-matchup-center-col">
        <div class="hero-matchup-vs">VS</div>
        <div class="hero-matchup-stats">
          <div class="hero-matchup-values" :class="{ 'is-loading': loadingHeroWinrates }">
            <template v-if="hasSelectedHero">
              <div class="hero-matchup-winrate" :class="winrateClass">
                {{ winrateDisplay }}
              </div>
              <div class="hero-matchup-record">
                <span class="w3-won">{{ formattedWins }}</span>
                -
                <span class="w3-lost">{{ formattedLosses }}</span>
              </div>
            </template>
            <div v-else class="hero-matchup-empty">Choose a Hero</div>
          </div>
          <div v-if="loadingHeroWinrates" class="hero-matchup-loader-overlay">
            <v-progress-circular indeterminate :size="32" :width="3" />
          </div>
        </div>
      </v-col>
      <v-col cols="12" sm="5">
        <v-row no-gutters>
          <v-col cols="4">
            <hero-picture-select :hero-index="3" />
          </v-col>
          <v-col cols="4">
            <hero-picture-select :hero-index="4" />
          </v-col>
          <v-col cols="4">
            <hero-picture-select :hero-index="5" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import HeroPictureSelect from "@/components/overall-statistics/HeroPictureSelect.vue";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { HeroPick } from "@/store/overallStats/types";

export default defineComponent({
  name: "HeroWinrate",
  components: {
    HeroPictureSelect,
  },
  props: {},
  setup() {
    const overallStatsStore = useOverallStatsStore();
    const numberFormatter = new Intl.NumberFormat();

    const winrateClass = computed<string>(() => {
      if (winrate.value > 0.55) return "w3-won";
      if (winrate.value < 0.45) return "w3-lost";
      return "";
    });

    const winrate = computed<number>(() => overallStatsStore.heroWinrate.winrate ?? 0);
    const wins = computed<number>(() => overallStatsStore.heroWinrate.wins ?? 0);
    const losses = computed<number>(() => overallStatsStore.heroWinrate.losses ?? 0);
    const loadingHeroWinrates = computed<boolean>(() => overallStatsStore.loadingHeroWinrates);
    const heroPicks = computed<HeroPick[]>(() => overallStatsStore.heroPicks);
    const hasSelectedHero = computed<boolean>(() =>
      heroPicks.value.some((heroPick) => heroPick.heroId !== "all"),
    );
    const winrateDisplay = computed<string>(() => {
      if (wins.value === 0 && losses.value === 0) return "-";
      return `${(winrate.value * 100).toFixed(2)}%`;
    });
    const formattedWins = computed<string>(() => numberFormatter.format(wins.value));
    const formattedLosses = computed<string>(() => numberFormatter.format(losses.value));

    onMounted(() => overallStatsStore.loadHeroWinrates());

    return {
      winrateClass,
      winrate,
      wins,
      losses,
      winrateDisplay,
      formattedWins,
      formattedLosses,
      loadingHeroWinrates,
      hasSelectedHero,
    };
  },
});
</script>

<style lang="scss" scoped>
.hero-matchup-row {
  align-items: center;
}

.hero-matchup-center-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hero-matchup-vs {
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.hero-matchup-stats {
  margin-top: 8px;
  min-height: 74px;
  min-width: 150px;
  position: relative;
  text-align: center;
}

.hero-matchup-values {
  line-height: 1.2;
}

.hero-matchup-values.is-loading {
  visibility: hidden;
}

.hero-matchup-winrate {
  font-size: 1.5rem;
  font-weight: 700;
}

.hero-matchup-record {
  font-size: 1.1rem;
  margin-top: 4px;
}

.hero-matchup-empty {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 16px;
}

.hero-matchup-loader-overlay {
  align-items: center;
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}
</style>
