<template>
  <div class="elevation-1">
    <table v-if="rankings.length > 0" class="custom-table">
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
        <tr
          v-for="item in rankings"
          :id="`listitem_${item.rankNumber}`"
          :key="item.rankNumber"
          class="w3-mid-emphasis"
        >
          <td class="number-text">{{ item.rankNumber }}.</td>
          <td class="d-md-flex">
            <div
              v-for="(playerInfo, index) in item.playersInfo"
              :key="playerInfo.battleTag"
              class="rank-icon-container my-1"
              :class="{ 'ml-md-3': index > 0 }"
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
                class="ml-1"
              >
                <country-flag-extended
                  :countryCode="playerInfo.countryCode"
                  :location="playerInfo.location"
                  size="small"
                />
              </div>
            </div>
          </td>
          <td class="number-text text-center">
            <progression-rank v-if="item.progression" :progression="item.progression" />
            <span v-else>{{ $t("views_rankings.unranked") }}</span>
          </td>
          <td class="number-text text-end"><race-icon :race="item.race" /></td>
          <td class="number-text text-end">
            {{ item.playersInfo.map((p) => (p.clanId ? p.clanId : "-")).join("/") }}
          </td>
        </tr>
      </tbody>
    </table>
    <table v-else class="custom-table">
      <tbody>
        <tr>
          <td colspan="5" class="text-center">
            {{ $t("components_ladder_progressionladdergrid.noplayers") }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { PlayerInfo, Ranking } from "@/store/ranking/types";
import { EAvatarCategory, ERaceEnum } from "@/store/types";
import { getAsset, getAvatarUrl } from "@/helpers/url-functions";
import PlayerRankInfo from "@/components/ladder/PlayerRankInfo.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import ProgressionRank from "@/components/ladder/ProgressionRank.vue";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "ProgressionLadderGrid",
  components: {
    PlayerRankInfo,
    CountryFlagExtended,
    RaceIcon,
    ProgressionRank,
  },
  props: {
    rankings: {
      type: Array as PropType<Ranking[]>,
      required: true,
    },
  },
  setup() {
    const { t } = useI18n();

    const headers = [
      { name: "Position", text: t("components_ladder_progressionladdergrid.position"), width: "25px" },
      { name: "Player", text: t("components_ladder_rankingsgrid.player"), minWidth: "170px" },
      { name: "Rank", text: t("components_ladder_rankingsgrid.rank"), width: "100px" },
      { name: "Race", text: t("components_ladder_rankingsgrid.race"), width: "50px" },
      { name: "Clan", text: t("components_ladder_rankingsgrid.clan"), width: "50px" },
    ];

    function getPlayerIcon(playerInfo: PlayerInfo): string {
      if (hasSelectedIcon(playerInfo)) {
        return getAvatarUrl(playerInfo.selectedRace, playerInfo.pictureId, playerInfo.isClassicPicture);
      }
      return getRaceIcon(playerInfo.calculatedRace);
    }

    function getAvatarTitle(playerInfo: PlayerInfo): string {
      if (hasSelectedIcon(playerInfo) && playerInfo.selectedRace <= ERaceEnum.UNDEAD) {
        return t(`races.${ERaceEnum[playerInfo.selectedRace]}`);
      }
      return t(`races.${ERaceEnum[playerInfo.calculatedRace]}`);
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
      getPlayerIcon,
      getAvatarTitle,
    };
  },
});
</script>

<style lang="scss" scoped>
@media (max-width: 768px) {
  .rank-icon-container {
    margin-top: 5px;
    margin-left: 0 !important;
  }
}
</style>
