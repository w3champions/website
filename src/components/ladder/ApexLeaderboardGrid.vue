<template>
  <div class="elevation-1">
    <table v-if="apexLeaderboard.players.length > 0" class="custom-table">
      <thead>
        <tr class="w3-mid-emphasis">
          <td
            v-for="header in headers"
            :key="header.name"
            :style="{ width: header.width, 'min-width': header.minWidth }"
          >
            {{ header.text }}
          </td>
        </tr>
      </thead>
      <tbody>
        <template v-for="(entry, index) in apexLeaderboard.players" :key="entry.rankNumber">
          <tr class="w3-mid-emphasis">
            <td class="number-text">{{ entry.rankNumber }}.</td>
            <td>
              <league-icon :league="entry.league" />
            </td>
            <td>
              <div
                v-for="(playerInfo, pIndex) in entry.playersInfo"
                :key="playerInfo.battleTag"
                class="d-inline-block rank-icon-container"
                :class="{ 'ml-3': pIndex > 0 }"
              >
                <div
                  class="player-avatar mr-1 pa-0 race-icon"
                  :title="getAvatarTitle(playerInfo)"
                  :style="{ 'background-image': `url(${getPlayerIcon(playerInfo)})` }"
                ></div>
                <player-rank-info
                  :player-id="{ name: playerInfo.battleTag.split('#')[0], battleTag: playerInfo.battleTag }"
                  :alias="playerInfo.playerAkaData?.name ?? ''"
                />
                <div
                  v-if="playerInfo.countryCode || playerInfo.location"
                  class="d-inline-block ml-1"
                >
                  <country-flag-extended
                    :countryCode="playerInfo.countryCode"
                    :location="playerInfo.location"
                    size="small"
                  />
                </div>
              </div>
            </td>
            <td class="number-text text-end apex-points">
              {{ entry.apexPoints }}
            </td>
          </tr>
          <tr
            v-if="showCutoffAfter(index)"
            :key="`cutoff-${index}`"
            class="apex-cutoff-row"
          >
            <td colspan="4" class="apex-cutoff-cell">
              <div class="apex-cutoff-line">
                <span class="apex-cutoff-label">
                  {{ $t("components_ladder_apexleaderboardgrid.cutoff") }}
                  <span v-if="apexLeaderboard.cutoffApexPoints != null" class="apex-cutoff-points">
                    {{ apexLeaderboard.cutoffApexPoints }}
                  </span>
                </span>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <table v-else class="custom-table">
      <tbody>
        <tr>
          <td colspan="4" class="text-center">
            {{ $t("components_ladder_apexleaderboardgrid.noplayers") }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ApexLeaderboard, PlayerInfo } from "@/store/ranking/types";
import { EAvatarCategory, ERaceEnum } from "@/store/types";
import { getAsset, getAvatarUrl } from "@/helpers/url-functions";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import PlayerRankInfo from "@/components/ladder/PlayerRankInfo.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "ApexLeaderboardGrid",
  components: {
    LeagueIcon,
    PlayerRankInfo,
    CountryFlagExtended,
  },
  props: {
    apexLeaderboard: {
      type: Object as PropType<ApexLeaderboard>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const headers = [
      {
        name: "Rank",
        text: t("components_ladder_rankingsgrid.rank"),
        width: "25px",
      },
      {
        name: "League",
        text: t("components_ladder_apexleaderboardgrid.league"),
        width: "30px",
      },
      {
        name: "Player",
        text: t("components_ladder_rankingsgrid.player"),
        minWidth: "170px",
      },
      {
        name: "ApexPoints",
        text: t("components_ladder_apexleaderboardgrid.apexpoints"),
        width: "80px",
      },
    ];

    function showCutoffAfter(index: number): boolean {
      return index === props.apexLeaderboard.gmCount - 1 &&
        index < props.apexLeaderboard.players.length - 1;
    }

    function getPlayerIcon(playerInfo: PlayerInfo): string {
      if (hasSelectedIcon(playerInfo)) {
        return getAvatarUrl(
          playerInfo.selectedRace,
          playerInfo.pictureId,
          playerInfo.isClassicPicture,
        );
      }
      return getRaceIcon(playerInfo.calculatedRace);
    }

    function getAvatarTitle(playerInfo: PlayerInfo): string {
      if (hasSelectedIcon(playerInfo) && playerInfo.selectedRace <= ERaceEnum.UNDEAD) {
        return ERaceEnum[playerInfo.selectedRace] ?? "";
      }
      return ERaceEnum[playerInfo.calculatedRace] ?? "";
    }

    function hasSelectedIcon(playerInfo: PlayerInfo): boolean {
      return (
        playerInfo.selectedRace !== undefined &&
        playerInfo.selectedRace != null &&
        playerInfo.pictureId !== undefined &&
        playerInfo.pictureId != null &&
        playerInfo.selectedRace !== EAvatarCategory.TOTAL
      );
    }

    function getRaceIcon(race: ERaceEnum): string {
      return getAsset(`raceIcons/${ERaceEnum[race]}.jpg`);
    }

    return {
      headers,
      showCutoffAfter,
      getPlayerIcon,
      getAvatarTitle,
    };
  },
});
</script>

<style lang="scss" scoped>
.rank-icon-container {
  vertical-align: middle;
}

.apex-points {
  font-weight: 700;
  min-width: 60px;
}

.apex-cutoff-row {
  pointer-events: none;
}

.apex-cutoff-cell {
  padding: 0 !important;
}

.apex-cutoff-line {
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    background: linear-gradient(
      to right,
      transparent 0%,
      rgb(var(--v-theme-warning)) 15%,
      rgb(var(--v-theme-warning)) 85%,
      transparent 100%
    );
    opacity: 0.75;
  }
}

.apex-cutoff-label {
  position: relative;
  z-index: 1;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 10px;
  border-radius: 3px;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-warning));
  border: 1px solid rgba(var(--v-theme-warning), 0.4);
  white-space: nowrap;
}

.apex-cutoff-points {
  margin-left: 4px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .rank-icon-container {
    margin-top: 5px;
    margin-left: 0 !important;
  }
}
</style>
