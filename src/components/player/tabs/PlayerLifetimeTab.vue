<template>
  <div>
    <!-- Everything below is scoped to this, so it gets standard height, an icon
         and room around it rather than reading as an afterthought. -->
    <div class="lifetime__mode">
      <v-select
        v-model="selectedGameMode"
        :items="activeGameModes()"
        item-title="name"
        item-value="id"
        label="Game mode"
        variant="outlined"
        hide-details
        class="lifetime__mode-select"
      />
    </div>

    <v-card-text v-if="loading">
      <v-progress-circular indeterminate class="ma-4" />
    </v-card-text>

    <v-card-text v-else-if="!hasData">
      {{ $t("components_player_tabs_playerstatistictab.playerhasnomatches") }}
    </v-card-text>

    <template v-else>
      <v-card-title>Activity</v-card-title>
      <v-card-text>
        <player-lifetime-activity :lifetimeTimeline="lifetimeTimeline!" />
      </v-card-text>

      <v-card-title>Lifetime MMR</v-card-title>
      <v-card-text>
        <player-lifetime-mmr-chart :lifetimeTimeline="lifetimeTimeline!" />
        <div v-if="!hasPeaks" class="text-caption mt-2 text-medium-emphasis">
          Peaks are unavailable for this player until their history has been reprocessed.
        </div>
      </v-card-text>

      <v-card-title>Level</v-card-title>
      <v-card-text>
        <player-lifetime-level-chart :lifetimeTimeline="lifetimeTimeline!" />
      </v-card-text>

      <v-card-title>Peak MMR by season</v-card-title>
      <v-card-text>
        <player-lifetime-season-bars :lifetimeTimeline="lifetimeTimeline!" metric="peak" />
      </v-card-text>

      <v-card-title>Games by season</v-card-title>
      <v-card-text>
        <player-lifetime-season-bars :lifetimeTimeline="lifetimeTimeline!" metric="games" />
      </v-card-text>

      <v-card-title>
        Lifetime record by race
        <span class="text-caption text-medium-emphasis ms-2">all game modes</span>
      </v-card-title>
      <v-card-text>
        <player-lifetime-race-stats />
      </v-card-text>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, watch } from "vue";
import { activeGameModes, loadActiveGameModes } from "@/composables/GameModesMixin";
import { EGameMode } from "@/store/types";
import { usePlayerStore } from "@/store/player/store";
import type { PlayerLifetimeTimeline } from "@/store/player/types";
import PlayerLifetimeMmrChart from "@/components/player/PlayerLifetimeMmrChart.vue";
import PlayerLifetimeLevelChart from "@/components/player/PlayerLifetimeLevelChart.vue";
import PlayerLifetimeRaceStats from "@/components/player/PlayerLifetimeRaceStats.vue";
import PlayerLifetimeSeasonBars from "@/components/player/PlayerLifetimeSeasonBars.vue";
import PlayerLifetimeActivity from "@/components/player/PlayerLifetimeActivity.vue";

export default defineComponent({
  name: "PlayerLifetimeTab",
  components: {
    PlayerLifetimeMmrChart,
    PlayerLifetimeLevelChart,
    PlayerLifetimeRaceStats,
    PlayerLifetimeSeasonBars,
    PlayerLifetimeActivity,
  },
  setup() {
    const playerStore = usePlayerStore();

    const lifetimeTimeline = computed<PlayerLifetimeTimeline | undefined>(() => playerStore.lifetimeTimeline);
    const loading = computed<boolean>(() => playerStore.loadingLifetimeTimeline);
    const hasData = computed<boolean>(() => (lifetimeTimeline.value?.series ?? []).some((s) => s.points.length > 0));

    // The backend withholds peaks for histories it can't tell placement games
    // apart in, so say so rather than silently showing none.
    const hasPeaks = computed<boolean>(() => (lifetimeTimeline.value?.series ?? []).some((s) => s.peak != null));

    // Once the mode is picked by hand, stop overriding it from the profile.
    let modeChosen = false;

    const selectedGameMode = computed<EGameMode>({
      get: () => playerStore.lifetimeGameMode,
      set: (gameMode: EGameMode) => {
        modeChosen = true;
        playerStore.setLifetimeGameMode(gameMode);
      },
    });

    onMounted(async (): Promise<void> => {
      await loadActiveGameModes();
    });

    // The profile fetch that sets battleTag can still be in flight when this
    // tab mounts, so wait for the tag rather than firing once and missing it.
    // Wait for the profile to finish, not just for the battleTag to appear:
    // profileStatisticsGameMode is only resolved to the player's most played
    // mode at the end of that load, and reading it earlier would default a
    // Direct Strike regular to an empty 1v1 view.
    watch(
      () => [playerStore.battleTag, playerStore.loadingProfile] as const,
      ([battleTag, loadingProfile]) => {
        if (!battleTag || loadingProfile) return;
        if (!modeChosen) playerStore.lifetimeGameMode = playerStore.profileStatisticsGameMode;
        playerStore.loadPlayerLifetimeTimeline();
      },
      { immediate: true },
    );

    return {
      activeGameModes,
      lifetimeTimeline,
      loading,
      hasData,
      hasPeaks,
      selectedGameMode,
    };
  },
});
</script>

<style lang="scss" scoped>
.lifetime__mode {
  padding: 28px 16px 20px;
}

.lifetime__mode-select {
  max-width: 22rem;
}
</style>
