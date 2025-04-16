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
        <a
          class="name-link"
          :class="[won, $props.highlighted ? 'font-weight-bold' : '']"
          @click="notClickable ? null : goToPlayer()"
          @click.middle="openProfileInNewTab()"
          @click.right="openProfileInNewTab()"
        >
          {{ nameWithoutBtag }}
          <span class="number-text">({{ currentRating }})</span>
          <span class="number-text" v-if="mmrChange !== 0" :class="won">
            <span v-if="mmrChange > 0">+{{ mmrChange }}</span>
            <span v-else>{{ mmrChange }}</span>
          </span>
        </a>
        <country-flag-extended
          :countryCode="player.countryCode"
          :location="player.location"
          size="small"
          class="ml-1"
        />
      </span>
      <hero-icon-row
        :heroes="player.heroes"
        :left="left"
        :show="showHeroes"
      />
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
import { useRouter } from "vue-router/composables";
import { ERaceEnum, PlayerInTeam } from "@/store/types";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { getProfileUrl } from "@/helpers/url-functions";

export default defineComponent({
  name: "PlayerMatchInfo",
  components: {
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
    showHeroes: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const router = useRouter();

    const won = computed<string>(() => {
      if (props.unfinishedMatch) return "";

      if (Object.prototype.hasOwnProperty.call(props.player, "won")) {
        return props.player.won ? "won" : "lost";
      }

      return "";
    });

    const race = ref<ERaceEnum>(props.player.race);
    const rndRace = ref<ERaceEnum>(props.player.rndRace);
    const currentRating = ref<number>(Math.floor(props.player.oldMmr));
    const textClass = ref<string>(props.left ? "player-info__right" : "player-info__left");
    const nameWithoutBtag = ref<string>(props.player.name);
    const showPlayerInfo = ref<boolean>(!(props.unfinishedMatch && props.isAnonymous));

    const mmrChange = computed<number>(() => {
      if (props.player.oldMmr && props.player.currentMmr) {
        return Math.floor(props.player.currentMmr - props.player.oldMmr);
      }

      return 0;
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
      textClass,
      nameWithoutBtag,
      mmrChange,
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

span > a {
  display: inline-block;
}

span > .flag-container {
  display: inline-block;
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

.name-link {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 150px;
}

@media (min-width: 960px) {
  .name-link {
    max-width: 100%;
  }
}
</style>
