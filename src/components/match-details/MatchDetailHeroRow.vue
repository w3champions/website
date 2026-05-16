<template>
  <v-row justify="center" class="match-hero-row flex-nowrap">
    <v-col
      v-if="heroesOfWinner.length !== 3"
      :cols="heroesOfWinner.length <= 1 ? 2 : 1"
      class="hero-row-spacer"
    />
    <v-col v-if="heroesOfWinner.length === 3" cols="2" md="1" class="hero-col">
      <hero-icon :hero="heroesOfWinner[2]" />
    </v-col>
    <v-col v-if="heroesOfWinner.length >= 2" cols="2" md="1" class="hero-col">
      <hero-icon :hero="heroesOfWinner[1]" />
    </v-col>
    <v-col cols="2" md="1" class="hero-col">
      <hero-icon
        v-if="heroesOfWinner.length >= 1"
        :first-hero="true"
        :hero="heroesOfWinner[0]"
      />
    </v-col>
    <v-col cols="auto" class="stat-icon-col pl-0 pl-sm-4 pl-md-10 pr-0">
      <div v-for="stat in stats" :key="stat.key" class="stat-icon-row">
        <v-tooltip location="top" content-class="w3-tooltip elevation-1">
          <template v-slot:activator="{ props }">
            <v-icon class="stat-icon" v-bind="props">{{ stat.icon }}</v-icon>
          </template>
          <div>{{ stat.tooltip }}</div>
        </v-tooltip>
      </div>
    </v-col>
    <v-col cols="auto" class="stat-value-col pl-0 pr-2 pr-sm-2 pr-md-16">
      <div
        v-for="stat in stats"
        :key="stat.key"
        class="stat-value-row text-left"
        :class="stat.winnerClass"
      >
        {{ stat.winnerValue ?? "N/A" }}
      </div>
    </v-col>
    <v-col cols="auto" class="stat-value-col pl-2 pr-0 pl-sm-4 pl-md-16">
      <div
        v-for="stat in stats"
        :key="stat.key"
        class="stat-value-row justify-end"
        :class="stat.loserClass"
      >
        {{ stat.loserValue ?? "N/A" }}
      </div>
    </v-col>
    <v-col cols="auto" class="stat-icon-col pl-0 pr-0 pr-sm-4 pr-md-10">
      <div v-for="stat in stats" :key="stat.key" class="stat-icon-row">
        <v-tooltip location="top" content-class="w3-tooltip elevation-1">
          <template v-slot:activator="{ props }">
            <v-icon class="stat-icon" v-bind="props">{{ stat.icon }}</v-icon>
          </template>
          <div>{{ stat.tooltip }}</div>
        </v-tooltip>
      </div>
    </v-col>
    <v-col cols="2" md="1" class="hero-col">
      <hero-icon :first-hero="true" :hero="heroesOfLoser[0]" />
    </v-col>
    <v-col v-if="heroesOfLoser.length >= 2" cols="2" md="1" class="hero-col">
      <hero-icon :hero="heroesOfLoser[1]" />
    </v-col>
    <v-col v-if="heroesOfLoser.length === 3" cols="2" md="1" class="hero-col">
      <hero-icon :hero="heroesOfLoser[2]" />
    </v-col>
    <v-col
      v-if="heroesOfLoser.length !== 3"
      :cols="heroesOfLoser.length <= 1 ? 2 : 1"
      class="hero-row-spacer"
    />
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useI18n } from "vue-i18n";
import { Hero, HeroScore } from "@/store/types";
import HeroIcon from "@/components/match-details/HeroIcon.vue";
import { mdiChevronTripleUp, mdiSkull, mdiTreasureChest } from "@mdi/js";

export default defineComponent({
  name: "MatchDetailHeroRow",
  components: {
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
      required: false,
      default: [],
    },
    heroesOfLoser: {
      type: Array<Hero>,
      required: false,
      default: [],
    },
    scoresOfWinner: {
      type: Object as PropType<HeroScore>,
      required: false,
      default: undefined,
    },
    scoresOfLoser: {
      type: Object as PropType<HeroScore>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const { t } = useI18n();

    function compare(a: number, b: number): { winner: string; loser: string } {
      if (props.notColorWinner) return { winner: "", loser: "" };
      if (isNaN(a) || isNaN(b)) return { winner: "", loser: "" };
      const sum = a + b;
      if (sum === 0) return { winner: "", loser: "" };
      const diff = Math.abs(a - b) / (sum / 2);
      if (diff < 0.25) return { winner: "", loser: "" };
      return a > b
        ? { winner: "w3-won", loser: "w3-lost" }
        : { winner: "w3-lost", loser: "w3-won" };
    }

    const stats = computed(() => {
      const w = props.scoresOfWinner;
      const l = props.scoresOfLoser;

      const kills = compare(w?.heroesKilled ?? 0, l?.heroesKilled ?? 0);
      const xp = compare(w?.expGained ?? 0, l?.expGained ?? 0);
      const items = compare(w?.itemsObtained ?? 0, l?.itemsObtained ?? 0);

      return [
        {
          key: "kills",
          icon: mdiSkull,
          tooltip: t("components_match-details_matchhighlights.heroeskilled"),
          winnerValue: w?.heroesKilled,
          loserValue: l?.heroesKilled,
          winnerClass: kills.winner,
          loserClass: kills.loser,
        },
        {
          key: "xp",
          icon: mdiChevronTripleUp,
          tooltip: t("components_match-details_matchhighlights.xpgained"),
          winnerValue: w?.expGained,
          loserValue: l?.expGained,
          winnerClass: xp.winner,
          loserClass: xp.loser,
        },
        {
          key: "items",
          icon: mdiTreasureChest,
          tooltip: t("components_match-details_matchhighlights.itemscollected"),
          winnerValue: w?.itemsObtained,
          loserValue: l?.itemsObtained,
          winnerClass: items.winner,
          loserClass: items.loser,
        },
      ];
    });

    return { stats };
  },
});
</script>

<style lang="scss" scoped>
.hero-col {
  max-width: 100px !important;
  flex-shrink: 1 !important;

  :deep(.v-img) {
    max-width: 100% !important;
    width: auto !important;
  }
}

.stat-icon-col {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto !important;
}

.stat-value-col {
  display: flex;
  flex-direction: column;
}

.stat-icon-row {
  display: flex;
  align-items: center;
  min-height: 2em;
}

.stat-value-row {
  min-height: 2em;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.stat-icon {
  margin-left: 20px;
  margin-right: 20px;
}

@media (min-width: 960px) {
  .stat-value-col {
    min-width: 60px;
  }
}

@media (max-width: 959px) {
  .stat-icon {
    margin-left: 4px;
    margin-right: 4px;
  }

  .hero-row-spacer {
    display: none !important;
  }
}
</style>
