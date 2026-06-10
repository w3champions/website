<template>
  <div class="ladder-player-cell">
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
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { PlayerInfo } from "@/store/ranking/types";
import PlayerRankInfo from "@/components/ladder/PlayerRankInfo.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { usePlayerAvatar } from "@/composables/usePlayerAvatar";

// A single ladder player cell: race/avatar icon + name (with profile link) + country flag.
// Renders from a PlayerInfo (used by the apex + progression ladders, where the per-player
// overview is absent and rows are built from playersInfo).
export default defineComponent({
  name: "LadderPlayerCell",
  components: {
    PlayerRankInfo,
    CountryFlagExtended,
  },
  props: {
    playerInfo: {
      type: Object as PropType<PlayerInfo>,
      required: true,
    },
  },
  setup() {
    const { getPlayerIcon, getAvatarTitle } = usePlayerAvatar();
    return { getPlayerIcon, getAvatarTitle };
  },
});
</script>

<style lang="scss" scoped>
.ladder-player-cell {
  display: inline-flex;
  align-items: center;
}
</style>
