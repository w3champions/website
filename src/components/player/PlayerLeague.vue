<template>
  <div
    class="LadderSummaryShowcase-card mt-1 cursor-pointer"
    :title="isRanked && !smallMode ? 'Go to League Rankings' : undefined"
    :class="`${leagueName} ${isRanked && !smallMode ? 'pointer' : ''}`"
    @click="isRanked && !smallMode ? navigateToLeague() : null"
  >
    <h2 class="LadderSummaryShowcase-title">
      {{ leagueMode }} {{ leagueName }}
      {{ modeStat.division !== 0 ? modeStat.division : null }}
    </h2>
    <div class="LadderSummaryShowcase-subtitle">
      <div v-if="showAtPartner">
        <span v-for="(partner, index) in atPartners" :key="partner.battleTag" class="text-center" @click="navigateToPartner(partner)">
          {{ partner.name }}<span v-if="index < atPartners.length - 1">, </span>
        </span>
        <br v-if="showAtPartner" />
      </div>
      <span v-if="isRanked">
        <span v-if="!smallMode">Rank</span>
        <span v-if="!smallMode" class="number-text">{{ modeStat.rank }} |</span>
        <span class="won">{{ modeStat.wins }}</span>
        -
        <span class="lost">{{ modeStat.losses }}</span>
      </span>
      <span v-else>
        <span class="number-text">{{ modeStat.games }} / 5</span>
      </span>
    </div>
    <div>
      <img class="LadderSummaryShowcase-divider" src="/assets/profiles/profile-ladders-divider.png" />
      <div v-if="isRanked && !smallMode" class="text-center">
        <span>
          MMR:
          <span class="number-text">{{ modeStat.mmr }}</span>
        </span>
        <span class="ml-2" style="font-size: 13px">
          <v-col>
            <level-progress :rp="modeStat.rankingPoints" />
          </v-col>
        </span>
      </div>
      <div v-if="!isRanked && !smallMode" class="text-center">
        <span>{{ $t("components_player_playerleague.placementsplayed") }}</span>
      </div>
    </div>
    <recent-performance v-if="isRecentPerformanceVisible" :last-ten-matches-performance="lastTenMatchesPerformance" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { TranslateResult } from "vue-i18n";
import { EGameMode, ERaceEnum, Match } from "@/store/types";
import { ModeStat } from "@/store/player/types";
import RecentPerformance from "@/components/player/RecentPerformance.vue";
import { getProfileUrl } from "@/helpers/url-functions";
import LevelProgress from "@/components/ladder/LevelProgress.vue";
import MatchService from "@/services/MatchService";
import { usePlayerStore } from "@/store/player/store";
import { useRootStateStore } from "@/store/rootState/store";
import { Gateways, PlayerId, Season } from "@/store/ranking/types";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "PlayerLeague",
  components: {
    RecentPerformance,
    LevelProgress,
  },
  props: {
    modeStat: {
      type: Object as PropType<ModeStat>,
      required: true,
    },
    showAtPartner: {
      type: Boolean,
      required: false,
      default: false,
    },
    smallMode: {
      type: Boolean,
      required: false,
      default: false,
    },
    showPerformance: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const router = useRouter();
    const playerStore = usePlayerStore();
    const rootStateStore = useRootStateStore();

    const matches = ref<Match[]>([]);
    const playerId = computed<string>(() => props.modeStat.id);
    const leagueMode = computed<TranslateResult>(() => t(`gameModes.${EGameMode[props.modeStat.gameMode]}`));
    const gameMode = computed<EGameMode>(() => props.modeStat.gameMode);
    const league = computed<number>(() => props.modeStat.leagueId);
    const isRanked = computed<boolean>(() => props.modeStat.rank > 0);

    const gateWay = computed<Gateways>(() => rootStateStore.gateway);
    const selectedSeason = computed<Season>(() => playerStore.selectedSeason);
    const battleTag = computed<string>(() => playerStore.battleTag);
    const seasonAndGameModeAndGateway = computed<string>(() => `${selectedSeason.value.id}${gameMode.value}${gateWay.value}`);

    const atPartners = computed<PlayerId[]>(() => props.modeStat.playerIds.filter((id) => battleTag.value !== id.battleTag));

    watch(seasonAndGameModeAndGateway, init, { immediate: true });

    async function init(): Promise<void> {
      if (!props.showPerformance) return;

      const playerMatches = await MatchService.retrievePlayerMatches(
        0,
        battleTag.value,
        "",
        gameMode.value,
        ERaceEnum.TOTAL,
        ERaceEnum.TOTAL,
        gateWay.value,
        selectedSeason.value.id
      );

      matches.value = playerMatches.matches;
    }

    function navigateToPartner(partner: PlayerId): void {
      router.push({
        path: getProfileUrl(partner.battleTag),
      });
    }

    function navigateToLeague(): void {
      router.push({
        path: "/rankings",
        query: {
          season: selectedSeason.value.id,
          gateway: gateWay.value,
          gamemode: gameMode.value,
          league: league.value,
          playerId: playerId.value,
        }
      });
    }

    const leagueName = computed<string>(() => {
      if (!props.modeStat) return "";
      if (!isRanked.value) return "unranked";

      switch (props.modeStat.leagueOrder) {
        case 0:
          return "grandmaster";
        case 1:
          return "master";
        case 2:
          return "adept";
        case 3:
          return "diamond";
        case 4:
          return "platinum";
        case 5:
          return "gold";
        case 6:
          return "silver";
        case 7:
          return "bronze";
        case 8:
          return "grass";
        default:
          return "";
      }
    });

    const lastTenMatchesPerformance = computed<("W" | "L")[]>(() => {
      return matches.value
        .slice(0, 10)
        .map((match) => match.teams.find((team) => team.players.find((player) => player.battleTag === battleTag.value)))
        .filter(Boolean)
        .map((team) => (team?.won ? "W" : "L"));
    });

    const isRecentPerformanceVisible = computed<boolean>(() =>
      props.showPerformance
      && gameMode.value !== EGameMode.GM_2ON2_AT
      && lastTenMatchesPerformance.value.length > 0
    );

    return {
      isRanked,
      navigateToLeague,
      leagueMode,
      leagueName,
      navigateToPartner,
      atPartners,
      isRecentPerformanceVisible,
      lastTenMatchesPerformance,
    };
  },
});
</script>

<style lang="scss" scoped>
// grandmaster
.grandmaster:after {
  background-image: url(/assets/leagueFlags/grandmaster.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.grandmaster:before {
  border-top: 2px solid #593ba8 !important;
}

// master
.master:after {
  background-image: url(/assets/leagueFlags/master.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.master:before {
  border-top: 2px solid #593ba8 !important;
}

// adept
.adept:after {
  background-image: url(/assets/leagueFlags/adept.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.adept:before {
  border-top: 2px solid #593ba8 !important;
}

// diamond
.diamond:after {
  background-image: url(/assets/leagueFlags/diamond.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.diamond:before {
  border-top: 2px solid #2c33ff !important;
}

// platinum
.platinum:after {
  background-image: url(/assets/leagueFlags/platinum.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.platinum:before {
  border-top: 2px solid #a0b3c2 !important;
}

// gold
.gold:after {
  background-image: url(/assets/leagueFlags/gold.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.gold:before {
  border-top: 2px solid #eebf01 !important;
}

// silver
.silver:after {
  background-image: url(/assets/leagueFlags/silver.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.silver:before {
  border-top: 2px solid #97a1a8 !important;
}

// bronze
.bronze:after {
  background-image: url(/assets/leagueFlags/bronze.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.bronze:before {
  border-top: 2px solid #955941 !important;
}

// grass
.grass:after {
  background-image: url(/assets/leagueFlags/grass.png);
  background-repeat: no-repeat;
  background-size: contain;
}

.LadderSummaryShowcase-card.grass:before {
  border-top: 2px solid #593ba8 !important;
}

// unranked
.unranked:after {
  background-image: url(/assets/leagueFlags/unranked.png);
  background-repeat: no-repeat;
  background-position: 0 -315px;
}

// common

.LadderSummaryShowcase-card:after {
  -ms-flex: 0 0 100px;
  flex: 0 0 100px;
  width: 250px;
  height: 105px;
  content: "";
  position: absolute;
  top: -50px;
  margin-left: 49%;
  left: 75px;
  transform: translateX(-50%);
}

.LadderSummaryShowcase-card {
  position: relative;
  padding: 1em;
  background-color: rgba(9, 28, 46, 0.31);
  padding-bottom: 30px;
  min-height: 181px;
}

.LadderSummaryShowcase-card:before {
  border: 2px solid #122a42;
  background: none;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.467);
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  pointer-events: none;
  right: 0;
  top: 0;
  margin: initial;
}

.v-theme--orc, .v-theme--human {
  .LadderSummaryShowcase-card:before {
    border: 2px solid rgb(205, 205, 205);
  }

  .LadderSummaryShowcase-card {
    background-color: transparent;
  }

  .LadderSummaryShowcase-title:first-child {
    color: black;
  }

  .LadderSummaryShowcase-subtitle {
    color: black;
  }
}

.LadderSummaryShowcase-title:first-child {
  margin-top: 40px;
  margin-bottom: 0;
  text-align: center;
  font-family: Eurostile;
  font-weight: 700;
  font-size: 1.1em;
  text-transform: uppercase;
  color: #fff;
  letter-spacing: normal;
}

.LadderSummaryShowcase-subtitle {
  color: #7aa3cc;
  margin-top: 0.4em;
  font: 400 0.8em Eurostile;
  text-align: center;
  text-transform: uppercase;
  font-size: 20px;
}

.LadderSummaryShowcase-divider {
  width: 100%;
  height: auto;
}
</style>
