<template>
  <div class="match-stats-layout">
    <div v-if="heroesOfWinner.length || heroesOfLoser.length" class="mobile-heroes-row">
      <div class="heroes-icons heroes-icons--left">
        <div
          v-for="(hero, i) of winnersReversed"
          :key="'mw-'+hero.name+'-'+i"
          class="hero-icon-wrapper"
        >
          <hero-icon
            :hero="hero"
            :first-hero="i === winnersReversed.length - 1"
            :show-level="true"
          />
        </div>
      </div>
      <div class="heroes-icons heroes-icons--right">
        <div
          v-for="(hero, i) in heroesOfLoser"
          :key="'ml-'+hero.name+'-'+i"
          class="hero-icon-wrapper"
        >
          <hero-icon
            :hero="hero"
            :first-hero="i === 0"
            :show-level="true"
          />
        </div>
      </div>
    </div>
    <div class="match-stats-grid">
      <div class="heroes-side heroes-side--left">
        <div class="heroes-icons heroes-icons--left">
          <div
            v-for="(hero, i) of winnersReversed"
            :key="'dw-'+hero.name+'-'+i"
            class="hero-icon-wrapper"
          >
            <hero-icon
              :hero="hero"
              :first-hero="i === winnersReversed.length - 1"
              :show-level="true"
            />
          </div>
        </div>
        <div v-if="durationMinutes > 0" class="resource-rates resource-rates--left">
          <div class="resource-rate-line">
            <span :style="resourceRates.xp.winnerStyle">{{ resourceRates.xp.winner }}</span>
            <img src="/assets/icons/stat-plus-icon.png" width="16" height="16" alt="XP" />
            <span class="rate-label">XP/min</span>
          </div>
          <div class="resource-rate-line">
            <span :style="resourceRates.gold.winnerStyle">{{ resourceRates.gold.winner }}</span>
            <img src="/assets/icons/stat-gold-icon.png" width="16" height="16" alt="Gold" />
            <span class="rate-label">Gold/min</span>
          </div>
          <div class="resource-rate-line">
            <span :style="resourceRates.lumber.winnerStyle">{{ resourceRates.lumber.winner }}</span>
            <img src="/assets/icons/stat-lumber-icon.png" width="16" height="16" alt="Lumber" />
            <span class="rate-label">Lumber/min</span>
          </div>
        </div>
      </div>

      <div class="game-stats">
        <div class="game-stats-section">
          <score-stat
            :title="$t('components_match-details_matchhighlights.heroeskilled')"
            icon="kills"
            :stat1="scoresOfWinner?.heroesKilled ?? 0"
            :stat2="scoresOfLoser?.heroesKilled ?? 0"
          />
          <score-stat
            :title="$t('components_match-details_matchhighlights.xpgained')"
            icon="plus"
            :stat1="scoresOfWinner?.expGained ?? 0"
            :stat2="scoresOfLoser?.expGained ?? 0"
          />
          <score-stat
            :title="$t('components_match-details_matchhighlights.itemscollected')"
            icon="items"
            :stat1="scoresOfWinner?.itemsObtained ?? 0"
            :stat2="scoresOfLoser?.itemsObtained ?? 0"
          />
        </div>
        <div v-if="unitScoreWinner && unitScoreLoser" class="game-stats-section">
          <score-stat
            :title="$t('components_match-details_playerperformanceonmatch.unitskilled')"
            icon="kills"
            :stat1="unitScoreWinner.unitsKilled"
            :stat2="unitScoreLoser.unitsKilled"
          />
          <score-stat
            :title="$t('components_match-details_playerperformanceonmatch.unitsproduced')"
            icon="supply"
            :stat1="unitScoreWinner.unitsProduced"
            :stat2="unitScoreLoser.unitsProduced"
          />
          <score-stat
            :title="$t('components_match-details_playerperformanceonmatch.largestarmy')"
            icon="supply"
            :stat1="unitScoreWinner.largestArmy"
            :stat2="unitScoreLoser.largestArmy"
          />
        </div>
        <div v-if="resourceScoreWinner && resourceScoreLoser" class="game-stats-section">
          <score-stat
            :title="$t('components_match-details_playerperformanceonmatch.goldmined')"
            icon="gold"
            :stat1="resourceScoreWinner.goldCollected"
            :stat2="resourceScoreLoser.goldCollected"
          />
          <score-stat
            :title="$t('components_match-details_playerperformanceonmatch.lumbermined')"
            icon="lumber"
            :stat1="resourceScoreWinner.lumberCollected"
            :stat2="resourceScoreLoser.lumberCollected"
          />
          <score-stat
            :title="$t('components_match-details_playerperformanceonmatch.upkeeplost')"
            icon="gold"
            :stat1="resourceScoreWinner.goldUpkeepLost"
            :stat2="resourceScoreLoser.goldUpkeepLost"
          />
        </div>
        <div v-if="durationMinutes > 0" class="game-stats-section mobile-rates-section">
          <score-stat
            title="XP/min"
            icon="plus"
            :stat1="resourceRates.xp.winner"
            :stat2="resourceRates.xp.loser"
          />
          <score-stat
            title="Gold/min"
            icon="gold"
            :stat1="resourceRates.gold.winner"
            :stat2="resourceRates.gold.loser"
          />
          <score-stat
            title="Lumber/min"
            icon="lumber"
            :stat1="resourceRates.lumber.winner"
            :stat2="resourceRates.lumber.loser"
          />
        </div>
      </div>

      <div class="heroes-side heroes-side--right">
        <div class="heroes-icons heroes-icons--right">
          <div
            v-for="(hero, i) in heroesOfLoser"
            :key="'dl-'+hero.name+'-'+i"
            class="hero-icon-wrapper"
          >
            <hero-icon
              :hero="hero"
              :first-hero="i === 0"
              :show-level="true"
            />
          </div>
        </div>
        <div v-if="durationMinutes > 0" class="resource-rates resource-rates--right">
          <div class="resource-rate-line">
            <span class="rate-label">XP/min</span>
            <img src="/assets/icons/stat-plus-icon.png" width="16" height="16" alt="XP" />
            <span :style="resourceRates.xp.loserStyle">{{ resourceRates.xp.loser }}</span>
          </div>
          <div class="resource-rate-line">
            <span class="rate-label">Gold/min</span>
            <img src="/assets/icons/stat-gold-icon.png" width="16" height="16" alt="Gold" />
            <span :style="resourceRates.gold.loserStyle">{{ resourceRates.gold.loser }}</span>
          </div>
          <div class="resource-rate-line">
            <span class="rate-label">Lumber/min</span>
            <img src="/assets/icons/stat-lumber-icon.png" width="16" height="16" alt="Lumber" />
            <span :style="resourceRates.lumber.loserStyle">{{ resourceRates.lumber.loser }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { Hero, HeroScore, UnitScore, ResourceScore } from "@/store/types";
import HeroIcon from "@/components/match-details/HeroIcon.vue";
import ScoreStat from "@/components/match-details/ScoreStat.vue";

export default defineComponent({
  name: "MatchDetailHeroRow",
  components: {
    HeroIcon,
    ScoreStat,
  },
  props: {
    notColorWinner: {
      type: Boolean,
      required: false,
      default: false,
    },
    heroesOfWinner: {
      type: Array as PropType<Hero[]>,
      required: false,
      default: () => [],
    },
    heroesOfLoser: {
      type: Array as PropType<Hero[]>,
      required: false,
      default: () => [],
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
    unitScoreWinner: {
      type: Object as PropType<UnitScore>,
      required: false,
      default: undefined,
    },
    unitScoreLoser: {
      type: Object as PropType<UnitScore>,
      required: false,
      default: undefined,
    },
    resourceScoreWinner: {
      type: Object as PropType<ResourceScore>,
      required: false,
      default: undefined,
    },
    resourceScoreLoser: {
      type: Object as PropType<ResourceScore>,
      required: false,
      default: undefined,
    },
    durationMinutes: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  setup(props) {
    const winnersReversed = computed(() =>
      [...(props.heroesOfWinner || [])].reverse(),
    );

    function compareColor(a: number, b: number): string {
      if (props.notColorWinner || a === b) return "";
      return a > b ? "var(--w3-won-color, #4caf50)" : "var(--w3-lost-color, #ff5252)";
    }

    const resourceRates = computed(() => {
      const mins = props.durationMinutes || 1;
      const wHero = props.scoresOfWinner;
      const lHero = props.scoresOfLoser;
      const wRes = props.resourceScoreWinner;
      const lRes = props.resourceScoreLoser;

      const wXp = wHero?.expGained ?? 0;
      const lXp = lHero?.expGained ?? 0;
      const wGold = wRes?.goldCollected ?? 0;
      const lGold = lRes?.goldCollected ?? 0;
      const wLumber = wRes?.lumberCollected ?? 0;
      const lLumber = lRes?.lumberCollected ?? 0;

      return {
        xp: {
          winner: Math.round(wXp / mins),
          loser: Math.round(lXp / mins),
          winnerStyle: { color: compareColor(wXp, lXp) },
          loserStyle: { color: compareColor(lXp, wXp) },
        },
        gold: {
          winner: Math.round(wGold / mins),
          loser: Math.round(lGold / mins),
          winnerStyle: { color: compareColor(wGold, lGold) },
          loserStyle: { color: compareColor(lGold, wGold) },
        },
        lumber: {
          winner: Math.round(wLumber / mins),
          loser: Math.round(lLumber / mins),
          winnerStyle: { color: compareColor(wLumber, lLumber) },
          loserStyle: { color: compareColor(lLumber, wLumber) },
        },
      };
    });

    return {
      winnersReversed,
      resourceRates,
    };
  },
});
</script>

<style lang="scss" scoped>
.match-stats-layout {
  --hero-icon-size: 64px;
}

.mobile-heroes-row {
  display: none;
}

.game-stats-section.mobile-rates-section {
  display: none;
}

.match-stats-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  column-gap: 12px;
  padding: 8px 16px;
}

.heroes-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.heroes-side--left {
  align-items: flex-end;
}

.heroes-side--right {
  align-items: flex-start;
}

.heroes-icons {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: var(--hero-icon-size);
  grid-auto-columns: var(--hero-icon-size);
  column-gap: 16px;
  padding-bottom: 30px;
}

.heroes-icons--left {
  justify-content: flex-end;
  margin-right: 30px;
}

.heroes-icons--right {
  justify-content: flex-start;
  margin-left: 30px;
}

.resource-rates {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resource-rates--left {
  text-align: right;
  margin-right: 30px;

  img {
    margin: 0 5px;
    vertical-align: sub;
  }
}

.resource-rates--right {
  text-align: left;
  margin-left: 30px;

  img {
    margin: 0 5px;
    vertical-align: sub;
  }
}

.resource-rate-line {
  height: 16px;
  line-height: 1;
}

.rate-label {
  opacity: 0.7;
}

.game-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
  justify-content: center;
}

.game-stats-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (max-width: 750px) {
  .match-stats-layout {
    --hero-icon-size: 40px;
  }

  .mobile-heroes-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 0 16px 16px;
  }

  .mobile-heroes-row .heroes-icons {
    column-gap: 6px;
    padding-bottom: 20px;
  }

  .mobile-heroes-row :deep(.hero-level-flag-first-hero) {
    font-size: 0.9em;
  }

  .mobile-heroes-row :deep(.hero-level-flag-second-hero) {
    font-size: 0.75em;
  }

  .game-stats-section.mobile-rates-section {
    display: flex;
  }

  .heroes-side {
    display: none;
  }

  .match-stats-grid {
    grid-template-columns: 1fr;
    padding: 8px 16px;
  }
}
</style>
