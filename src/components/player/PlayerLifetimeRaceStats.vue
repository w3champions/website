<template>
  <div class="lifetime-races">
    <div class="lifetime-races__row lifetime-races__row--head">
      <span></span>
      <span>Race</span>
      <span class="lifetime-races__num">Games</span>
      <span class="lifetime-races__num">Record</span>
      <span class="lifetime-races__bar-head">Win rate</span>
      <span class="lifetime-races__num">%</span>
    </div>

    <div v-for="row in rows" :key="row.race" class="lifetime-races__row">
      <race-icon :race="row.race" />
      <span class="lifetime-races__label">{{ row.label }}</span>
      <span class="lifetime-races__num">{{ row.games }}</span>
      <span class="lifetime-races__num lifetime-races__record">
        <!-- The site's own win/loss classes, which each theme darkens as needed. -->
        <span class="w3-won">{{ row.wins }}W</span>
        <span class="w3-lost">{{ row.losses }}L</span>
      </span>
      <div class="lifetime-races__bar">
        <div class="lifetime-races__fill" :style="{ width: `${row.winrate * 100}%`, backgroundColor: row.color }"></div>
        <!-- Even ground, so a bar reads as better or worse than an even split
             rather than just as a length. -->
        <span class="lifetime-races__even"></span>
      </div>
      <span class="lifetime-races__num lifetime-races__winrate">{{ (row.winrate * 100).toFixed(1) }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { usePlayerStore } from "@/store/player/store";
import type { RaceStat } from "@/store/player/types";
import { raceColor } from "@/helpers/raceColors";
import { RACE_LABELS } from "@/components/player/lifetime";
import RaceIcon from "@/components/player/RaceIcon.vue";

export default defineComponent({
  name: "PlayerLifetimeRaceStats",
  components: { RaceIcon },
  setup() {
    const playerStore = usePlayerStore();

    // winLosses on the profile is already every season combined, so this needs
    // nothing from the lifetime endpoint.
    const rows = computed(() =>
      (playerStore.playerProfile?.winLosses ?? [])
        .filter((r: RaceStat) => r.games > 0)
        .map((r: RaceStat) => ({
          race: r.race,
          label: RACE_LABELS[r.race] ?? String(r.race),
          color: raceColor(r.race),
          games: r.games,
          wins: r.wins,
          losses: r.losses,
          winrate: r.winrate,
        }))
        .sort((a, b) => b.games - a.games),
    );

    return { rows };
  },
});
</script>

<style lang="scss" scoped>
.lifetime-races__row {
  display: grid;
  grid-template-columns: 26px 5.5rem 4rem 7rem 1fr 3rem;
  align-items: center;
  gap: 12px;
  padding: 3px 0;
  font-size: 0.9rem;
}

.lifetime-races__row--head {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.55;
  padding-bottom: 4px;
}

.lifetime-races__num {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.lifetime-races__bar-head {
  padding-left: 2px;
}

.lifetime-races__record {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.lifetime-races__bar {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background-color: rgba(150, 150, 150, 0.22);
  overflow: hidden;
}

.lifetime-races__fill {
  height: 100%;
}

.lifetime-races__even {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.45);
}

.lifetime-races__winrate {
  font-weight: 600;
}
</style>
