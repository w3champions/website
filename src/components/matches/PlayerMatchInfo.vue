<template>
  <div class="player-info" :class="textClass">
    <player-icon
      v-if="!left"
      :race="race"
      :rndRace="rndRace"
      :big="bigRaceIcon"
    />
    <div class="details-column" :class="{ 'mr-2': left, 'ml-2': !left }">
      <span>
        <span v-if="!left && (player.countryCode || player.location)" class="mr-1">
          <country-flag-extended
            :countryCode="player.countryCode"
            :location="player.location"
          />
        </span>
        <v-tooltip location="top" transition="none" content-class="w3-tooltip elevation-1">
          <template v-slot:activator="{ props }">
            <a
              class="truncated-text text-primary cursor-pointer"
              :class="[playerColorClass, $props.highlighted ? 'font-weight-bold' : '']"
              v-bind="props"
              @click="notClickable ? null : goToPlayer()"
              @click.middle="openProfileInNewTab()"
              @click.right="openProfileInNewTab()"
            >
              {{ nameWithoutBtag }}<span v-if="displayRating !== null" :class="{ 'spoiler-mask': hideWinnerSpoilers }"> ({{ displayRating }})<span v-if="displayMmrChange !== 0" class="number-text rating-text" :class="playerColorClass">
                <span v-if="displayMmrChange > 0">+</span>{{ displayMmrChange }}
              </span></span>
            </a>
          </template>
          <div>
            <div v-if="displayRating !== null">MMR: <span :class="{ 'spoiler-mask': hideWinnerSpoilers }">{{ displayRating }}<span v-if="displayMmrChange !== 0" class="number-text rating-text" :class="playerColorClass">
              <span v-if="displayMmrChange > 0">+</span>{{ displayMmrChange }}
            </span></span></div>
            <div v-else>MMR: {{ $t("components_matches_playermatchinfo.calibrating") }}</div>
            <div v-if="topPercentage !== null">Top: {{ topPercentage }}%</div>
            <div class="d-flex align-center">
              <img v-if="leagueName !== null" :src="`/assets/leagueIcons/${player.ranking?.leagueOrder}.png`" style="width: 16px; height: 16px; margin-right: 4px;" />
              <span>{{ leagueName !== null ? leagueName + ' ' + (leagueDivision !== null ? leagueDivision : '#' + leagueRank) : $t('views_rankings.unranked') }}</span>
            </div>
          </div>
        </v-tooltip>
        <span v-if="left && (player.countryCode || player.location)" class="ml-1">
          <country-flag-extended
            :countryCode="player.countryCode"
            :location="player.location"
          />
        </span>
      </span>
      <hero-icon-row :heroes="player.heroes" :left="left" :show="showHeroes" :selectedHeroes="selectedHeroes" :size="24" />
    </div>
    <player-icon
      v-if="left"
      :race="race"
      :rndRace="rndRace"
      :big="bigRaceIcon"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { useRouter } from "vue-router";
import isNil from "lodash/isNil";
import { ERaceEnum, PlayerInTeam } from "@/store/types";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { getProfileUrl } from "@/helpers/url-functions";
import HeroIconRow from "@/components/matches/HeroIconRow.vue";
import { useSpoilerFreeStore } from "@/store/spoilerFree/store";

export default defineComponent({
  name: "PlayerMatchInfo",
  components: {
    HeroIconRow,
    PlayerIcon,
    CountryFlagExtended,
  },
  props: {
    player: {
      type: Object as PropType<PlayerInTeam>,
      required: true,
    },
    left: {
      type: Boolean,
      required: false,
      default: false,
    },
    bigRaceIcon: {
      type: Boolean,
      required: false,
      default: false,
    },
    notClickable: {
      type: Boolean,
      required: true,
    },
    unfinishedMatch: {
      type: Boolean,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      required: false,
      undefined,
    },
    highlighted: {
      type: Boolean,
      required: false,
      default: false,
    },
    spoilerFreeWinner: {
      type: Boolean,
      required: false,
      default: false,
    },
    showHeroes: {
      type: Boolean,
      required: false,
      default: false,
    },
    selectedHeroes: {
      type: Array as PropType<number[]>,
      required: false,
      default: () => [],
    },
  },
  setup(props) {
    const router = useRouter();
    const spoilerFreeStore = useSpoilerFreeStore();
    const fakeMmrValue = 2000;

    const won = computed<string>(() => {
      if (props.unfinishedMatch) return "";

      if (Object.prototype.hasOwnProperty.call(props.player, "won")) {
        return props.player.won ? "w3-won" : "w3-lost";
      }

      return "";
    });

    const race = ref<ERaceEnum>(props.player.race);
    const rndRace = ref<ERaceEnum>(props.player.rndRace);
    const currentRating = ref<number | null>(props.player.oldMmr != null ? Math.floor(props.player.oldMmr) : null);
    const textClass = ref<string>(props.left ? "player-info__right" : "player-info__left");
    const nameWithoutBtag = ref<string>(props.player.name);
    const showPlayerInfo = ref<boolean>(!(props.unfinishedMatch && props.isAnonymous));
    const leagueDivision = ref<number | null>(props.player.ranking?.division || null);
    const leagueRank = ref<number | null>(props.player.ranking?.rank || null);

    const mmrChange = computed<number>(() => {
      if (props.player.oldMmr && props.player.currentMmr) {
        return Math.floor(props.player.currentMmr - props.player.oldMmr);
      }

      return 0;
    });

    const hideWinnerSpoilers = computed<boolean>(() => props.spoilerFreeWinner && spoilerFreeStore.hideWinner && !props.unfinishedMatch);

    const playerColorClass = computed<string>(() => {
      if (hideWinnerSpoilers.value) {
        return "w3-gray-gold-text";
      }

      return won.value;
    });

    const displayRating = computed<number | null>(() => {
      if (currentRating.value === null) {
        return null;
      }

      if (hideWinnerSpoilers.value) {
        return fakeMmrValue;
      }

      return currentRating.value;
    });

    const displayMmrChange = computed<number>(() => {
      if (hideWinnerSpoilers.value) {
        return 0;
      }

      return mmrChange.value;
    });

    const topPercentage = computed<string | null>(() => {
      if (!isNil(props.player.oldMmrQuantile)) {
        const percentage = 100 - Math.round(props.player.oldMmrQuantile * 1000) / 10;
        return percentage.toFixed(1);
      }
      return null;
    });

    const leagueName = computed<string | null>(() => {
      switch (props.player.ranking?.leagueOrder) {
        case 0:
          return "Grand Master";
        case 1:
          return "Master";
        case 2:
          return "Adept";
        case 3:
          return "Diamond";
        case 4:
          return "Platinum";
        case 5:
          return "Gold";
        case 6:
          return "Silver";
        case 7:
          return "Bronze";
        case 8:
          return "Grass";
        default:
          return null;
      }
    });

    function openProfileInNewTab() {
      if (!showPlayerInfo.value) return;

      const path = getProfileUrl(props.player.battleTag);
      window.open(path, "_blank");
    }

    function goToPlayer() {
      if (!showPlayerInfo.value) return;

      router
        .push({
          path: getProfileUrl(props.player.battleTag),
        })
        .catch((err) => {
          return err;
        });
    }

    return {
      won,
      race,
      rndRace,
      currentRating,
      displayRating,
      displayMmrChange,
      textClass,
      nameWithoutBtag,
      mmrChange,
      hideWinnerSpoilers,
      playerColorClass,
      topPercentage,
      leagueName,
      leagueDivision,
      leagueRank,
      openProfileInNewTab,
      goToPlayer,
    };
  },
});
</script>

<style lang="scss" scoped>
.player-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
}

.details-column {
  display: flex;
  flex-direction: column;
}

.player-info__right {
  justify-content: flex-end;
  text-align: right;
  z-index: 2;

  .details-column {
    align-items: flex-end;
  }
}

.player-info__left {
  justify-content: flex-start;
  text-align: left;
  z-index: 2;

  .details-column {
    align-items: flex-start;
  }

}

.truncated-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

@media (min-width: 960px) {
  .truncated-text {
    max-width: 100%;
  }
}

.ranking-text {
  font-size: 0.925em;
}

.secondary-line {
  margin-top: -3px
}

.spoiler-mask {
  filter: blur(6px);
}

@media (max-width: 959px) {
  .top-percentage-text {
    display: none;
  }
}

</style>
