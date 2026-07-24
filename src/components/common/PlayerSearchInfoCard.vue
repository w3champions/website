<template>
  <v-card class="player-search-info-card" width="330">
    <v-card-text class="pa-3">
      <div class="d-flex align-center">
        <v-avatar rounded="lg" size="56" class="mr-3">
          <v-img :src="avatarUrl" />
        </v-avatar>
        <div class="overflow-hidden">
          <div class="d-flex align-center">
            <span class="text-subtitle-1 font-weight-bold mr-2 text-truncate">{{ name }}</span>
            <country-flag-extended
              :countryCode="enrichment?.countryCode"
              :location="enrichment?.location"
              :clickable="false"
            />
          </div>
          <div class="text-caption text-medium-emphasis text-truncate">{{ battleTag }}</div>
        </div>
      </div>
      <v-divider class="my-2" />
      <div v-if="!enrichment?.modeStats" class="d-flex justify-center py-2">
        <v-progress-circular indeterminate size="20" width="2" color="primary" />
      </div>
      <template v-else-if="topModes.length > 0">
        <table class="player-search-mode-table">
          <tr v-for="stat in topModes" :key="stat.id">
            <td class="text-no-wrap">
              <img
                v-if="getRaceIcon(stat.race)"
                class="mode-race-icon"
                :src="getRaceIcon(stat.race)"
                :alt="ERaceEnum[stat.race]"
              />
              <span class="ml-1">{{ $t("gameModes." + EGameMode[stat.gameMode]) }}</span>
            </td>
            <td class="text-center text-no-wrap">
              <span class="w3-won">{{ stat.wins }}</span>
              -
              <span class="w3-lost">{{ stat.losses }}</span>
              <span class="text-caption text-medium-emphasis ml-1">({{ (stat.winrate * 100).toFixed(0) }}%)</span>
            </td>
            <td class="text-end text-no-wrap number-text">
              {{ stat.mmr > 0 ? stat.mmr : "-" }}
              <span class="text-caption text-medium-emphasis">MMR</span>
            </td>
          </tr>
        </table>
      </template>
      <div v-else class="text-caption text-medium-emphasis text-center py-1">
        No ranked games this season
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { EGameMode, ERaceEnum } from "@/store/types";
import { ModeStat } from "@/store/player/types";
import { PlayerSearchEnrichment, getSearchPlayerAvatarUrl } from "@/components/common/playerSearchEnrichment";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { getAsset } from "@/helpers/url-functions";

export default defineComponent({
  name: "PlayerSearchInfoCard",
  components: {
    CountryFlagExtended,
  },
  props: {
    battleTag: {
      type: String,
      required: true,
    },
    enrichment: {
      type: Object as PropType<PlayerSearchEnrichment | undefined>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const name = computed<string>(() => props.battleTag.split("#")[0]);
    const avatarUrl = computed<string>(() => getSearchPlayerAvatarUrl(props.battleTag, props.enrichment));

    const topModes = computed<ModeStat[]>(() =>
      (props.enrichment?.modeStats ?? []).filter((stat) => stat.games > 0).slice(0, 3));

    function getRaceIcon(race: ERaceEnum | undefined | null): string {
      if (race == null || !ERaceEnum[race]) return "";
      return getAsset(`raceIcons/${ERaceEnum[race]}.png`);
    }

    return {
      EGameMode,
      ERaceEnum,
      name,
      avatarUrl,
      topModes,
      getRaceIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.player-search-mode-table {
  width: 100%;
  border-collapse: collapse;

  td {
    padding: 2px 4px;
  }
}

.mode-race-icon {
  height: 18px;
  width: auto;
  vertical-align: middle;
}
</style>
