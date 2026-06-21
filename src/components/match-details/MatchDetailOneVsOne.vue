<template>
  <div class="ovo-header">
    <div class="ovo-season-bar">
      <v-card-subtitle class="pa-0 text-uppercase opacity-100 d-flex align-center ga-2">
        <span v-if="isGatewayNeeded">{{ $t(`gatewayNames.${gateWay}`) }} · </span>
        <div class="ml-2 d-inline-flex align-center ga-1 vertical-middle">
          <span class="ovo-season-label">Season</span>
          <season-badge :season="seasonObject" />
        </div>
      </v-card-subtitle>
      <div class="ml-2">
        <host-icon
          v-if="match.serverInfo && match.serverInfo.provider"
          :host="match.serverInfo"
        />
      </div>
      <div class="subicon">
        <span class="mr-2">
          <download-replay-icon :gameId="matchId" />
        </span>
        <v-tooltip
          v-if="showChatLogShortcut"
          location="left"
          content-class="w3-tooltip elevation-1"
        >
          <template v-slot:activator="{ props: activatorProps }">
            <span v-bind="activatorProps">
              <v-btn
                class="ma-2 w3-gray-gold-text"
                icon
                variant="outlined"
                size="small"
                @click="$emit('open-chat-log')"
              >
                <v-icon size="x-large">{{ mdiChatProcessingOutline }}</v-icon>
              </v-btn>
            </span>
          </template>
          <span>View Chat Log</span>
        </v-tooltip>
      </div>
    </div>
    <div class="ovo-name-league-grid">
      <div class="ovo-name ovo-name--left">
        <country-flag-extended
          v-if="player(0).countryCode || player(0).location"
          :countryCode="player(0).countryCode"
          :location="player(0).location"
          class="ovo-flag"
        />
        <a
          class="cursor-pointer ovo-name-link text-primary"
          @click="goToPlayer(player(0).battleTag)"
        >
          {{ player(0).name }}
        </a>
        <player-icon
          :race="player(0).race"
          :rndRace="player(0).rndRace"
          :big="true"
        />
      </div>
      <div class="ovo-vs">VS</div>
      <div class="ovo-name ovo-name--right">
        <player-icon
          :race="player(1).race"
          :rndRace="player(1).rndRace"
          :big="true"
        />
        <a
          class="cursor-pointer ovo-name-link text-primary"
          @click="goToPlayer(player(1).battleTag)"
        >
          {{ player(1).name }}
        </a>
        <country-flag-extended
          v-if="player(1).countryCode || player(1).location"
          :countryCode="player(1).countryCode"
          :location="player(1).location"
          class="ovo-flag"
        />
      </div>
      <div class="ovo-league ovo-league--left">
        <template v-if="player(0).ranking?.leagueOrder != null">
          <router-link
            :to="rankingsUrl(player(0), player(0).ranking?.leagueOrder)"
            class="ovo-league-link"
          >
            <img
              :src="`/assets/leagueIcons/${player(0).ranking?.leagueOrder}.png`"
              class="ovo-league-icon"
              :class="`ovo-league-glow--${player(0).ranking?.leagueOrder}`"
            />
            <span class="ovo-league-name">{{ leagueName(0) }}</span>
            <span v-if="player(0).ranking?.division" class="ovo-mmr-label">
              {{ player(0).ranking?.division }}
            </span>
            <span v-if="player(0).ranking?.rank" class="ovo-rank-num">
              #{{ player(0).ranking?.rank }}
            </span>
          </router-link>
        </template>
        <template v-else>{{ $t("views_rankings.unranked") }}</template>
        <div class="ovo-fist-slot">
          <v-tooltip
            v-if="player(0).won"
            location="top"
            content-class="w3-tooltip elevation-1"
          >
            <template v-slot:activator="{ props: activatorProps }">
              <img
                v-bind="activatorProps"
                src="/assets/icons/winner-fist.png"
                class="ovo-winner-fist"
                alt="winner"
              />
            </template>
            <span>Winner</span>
          </v-tooltip>
        </div>
      </div>
      <div class="ovo-league ovo-league--right">
        <div class="ovo-fist-slot">
          <v-tooltip
            v-if="player(1).won"
            location="top"
            content-class="w3-tooltip elevation-1"
          >
            <template v-slot:activator="{ props: activatorProps }">
              <img
                v-bind="activatorProps"
                src="/assets/icons/winner-fist.png"
                class="ovo-winner-fist"
                alt="winner"
              />
            </template>
            <span>Winner</span>
          </v-tooltip>
        </div>
        <template v-if="player(1).ranking?.leagueOrder != null">
          <router-link
            :to="rankingsUrl(player(1), player(1).ranking?.leagueOrder)"
            class="ovo-league-link"
          >
            <span class="ovo-league-name">{{ leagueName(1) }}</span>
            <span v-if="player(1).ranking?.division" class="ovo-mmr-label">
              {{ player(1).ranking?.division }}
            </span>
            <span v-if="player(1).ranking?.rank" class="ovo-rank-num">
              #{{ player(1).ranking?.rank }}
            </span>
            <img
              :src="`/assets/leagueIcons/${player(1).ranking?.leagueOrder}.png`"
              class="ovo-league-icon"
              :class="`ovo-league-glow--${player(1).ranking?.leagueOrder}`"
            />
          </router-link>
        </template>
        <template v-else>{{ $t("views_rankings.unranked") }}</template>
      </div>
      <div class="ovo-mmr ovo-mmr--left">
        <span class="ovo-mmr-text">
          <template v-if="player(0).oldMmr">
            {{ Math.floor(player(0).oldMmr!) }}
            <span class="ovo-mmr-label">MMR</span>
            <span
              v-if="mmrChange(0) !== 0"
              class="number-text"
              :class="player(0).won ? 'w3-won' : 'w3-lost'"
            >
              ({{ mmrChange(0) > 0 ? "+" : "" }}{{ mmrChange(0) }})
            </span>
          </template>
          <template v-else>
            {{ $t("components_matches_playermatchinfo.calibrating") }}
          </template>
        </span>
        <div class="ovo-fist-slot"></div>
      </div>
      <div class="ovo-mmr ovo-mmr--right">
        <div class="ovo-fist-slot"></div>
        <span class="ovo-mmr-text">
          <template v-if="player(1).oldMmr">
            {{ Math.floor(player(1).oldMmr!) }}
            <span class="ovo-mmr-label">MMR</span>
            <span
              v-if="mmrChange(1) !== 0"
              class="number-text"
              :class="player(1).won ? 'w3-won' : 'w3-lost'"
            >
              ({{ mmrChange(1) > 0 ? "+" : "" }}{{ mmrChange(1) }})
            </span>
          </template>
          <template v-else>
            {{ $t("components_matches_playermatchinfo.calibrating") }}
          </template>
        </span>
      </div>
    </div>
  </div>
  <div v-if="isCompleteGame">
    <match-detail-hero-row
      :heroes-of-winner="scoresOfWinners[0]?.heroes"
      :heroes-of-loser="scoresOfLosers[0]?.heroes"
      :scores-of-winner="scoresOfWinners[0]?.heroScore"
      :scores-of-loser="scoresOfLosers[0]?.heroScore"
      :unit-score-winner="scoresOfWinners[0]?.unitScore"
      :unit-score-loser="scoresOfLosers[0]?.unitScore"
      :resource-score-winner="scoresOfWinners[0]?.resourceScore"
      :resource-score-loser="scoresOfLosers[0]?.resourceScore"
      :duration-minutes="match.durationInSeconds / 60"
    />
    <div class="ovo-map-stats">
      <div>
        <span class="ovo-mmr-label">Map:</span>
        {{ mapNameFromMatch(match) }}
      </div>
      <div>
        <span class="ovo-mmr-label">Start:</span>
        {{ gameStartTime }}
      </div>
      <div>
        <span class="ovo-mmr-label">Duration:</span>
        {{ gameDurationLong }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { useRouter } from "vue-router";
import { Match, PlayerInTeam, PlayerScore } from "@/store/types";
import HostIcon from "@/components/matches/HostIcon.vue";
import DownloadReplayIcon from "@/components/matches/DownloadReplayIcon.vue";
import MatchDetailHeroRow from "@/components/match-details/MatchDetailHeroRow.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import SeasonBadge from "@/components/player/SeasonBadge.vue";
import { mapNameFromMatch } from "@/composables/MatchMixin";
import { getProfileUrl } from "@/helpers/url-functions";
import { leagueNameFromOrder } from "@/helpers/leagues";
import { formatSecondsToDuration, formatTimestampStringToDateTime } from "@/helpers/date-functions";
import { mdiChatProcessingOutline } from "@mdi/js";

export default defineComponent({
  name: "MatchDetailOneVsOne",
  components: {
    HostIcon,
    DownloadReplayIcon,
    MatchDetailHeroRow,
    CountryFlagExtended,
    PlayerIcon,
    SeasonBadge,
  },
  props: {
    match: { type: Object as PropType<Match>, required: true },
    matchId: { type: String, required: true },
    season: { type: Number, required: true },
    gateWay: { type: String, required: true },
    isGatewayNeeded: { type: Boolean, required: true },
    isCompleteGame: { type: Boolean, required: true },
    scoresOfWinners: { type: Array as PropType<PlayerScore[]>, required: true },
    scoresOfLosers: { type: Array as PropType<PlayerScore[]>, required: true },
    showChatLogShortcut: { type: Boolean, required: true },
  },
  emits: ["open-chat-log"],
  setup(props) {
    const router = useRouter();

    function player(teamIndex: number): PlayerInTeam {
      return props.match.teams[teamIndex].players[0];
    }

    function mmrChange(teamIndex: number): number {
      const p = player(teamIndex);
      if (p?.oldMmr && p?.currentMmr) return Math.floor(p.currentMmr - p.oldMmr);
      return 0;
    }

    function leagueName(teamIndex: number): string {
      return leagueNameFromOrder(player(teamIndex).ranking?.leagueOrder);
    }

    function rankingsUrl(p: PlayerInTeam, league?: number) {
      const query: Record<string, string> = {
        season: String(props.season),
        gateway: String(props.match.gateWay),
        gamemode: String(props.match.gameMode),
        playerId: p.battleTag,
      };
      if (league != null) query.league = String(league);
      return { path: "/rankings", query };
    }

    function goToPlayer(battleTag: string) {
      router.push({ path: getProfileUrl(battleTag) });
    }

    const gameDurationLong = computed<string>(() => formatSecondsToDuration(props.match.durationInSeconds));
    const gameStartTime = computed<string>(() => formatTimestampStringToDateTime(props.match.startTime));
    const seasonObject = computed(() => ({ id: props.season }));

    return {
      player,
      mmrChange,
      leagueName,
      rankingsUrl,
      goToPlayer,
      gameDurationLong,
      gameStartTime,
      seasonObject,
      mapNameFromMatch,
      mdiChatProcessingOutline,
    };
  },
});
</script>

<style lang="scss" scoped>
.ovo-header {
  --ovo-icon-size: 36px;
  padding: 8px 16px;
}

.ovo-season-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .subicon {
    display: flex;
    align-items: flex-end;
    flex-direction: row;
    margin-left: auto;
  }
}

.ovo-name-league-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  grid-column-gap: 10px;
  grid-row-gap: 16px;
  margin-bottom: 4px;
}

.ovo-name {
  font-weight: bold;
  font-size: 1.5em;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;

  :deep(.flag) {
    transform: scale(0.32);
    margin: -3px -10px;
  }

  .ovo-name-link {
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;

    &:hover {
      text-decoration: underline;
    }
  }
}

.ovo-name--left {
  grid-column: 1;
  grid-row: 1;
  text-align: right;
  justify-content: flex-end;
}

.ovo-name--right {
  grid-column: 3;
  grid-row: 1;
  text-align: left;
  justify-content: flex-start;
}

.ovo-vs {
  grid-column: 2;
  grid-row: 1;
  font-size: 1.2em;
  font-weight: bold;
  padding: 0 8px;
  align-self: center;
  line-height: 1;
}

.ovo-season-label {
  color: rgb(var(--v-theme-w3-gold));
  font-family: "Friz Quadrata Std Medium";
}

.ovo-league {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ovo-league--left {
  grid-column: 1;
  grid-row: 2;
  justify-content: flex-end;
}

.ovo-league--right {
  grid-column: 3;
  grid-row: 2;
  justify-content: flex-start;
}

.ovo-fist-slot {
  flex: 0 0 auto;
  width: var(--ovo-icon-size);
  display: flex;
  justify-content: center;
  align-items: center;
}

.ovo-league-icon,
.ovo-winner-fist,
:deep(.race-icon-big) {
  width: var(--ovo-icon-size);
  height: var(--ovo-icon-size);
}

.ovo-league-icon {
  &.ovo-league-glow--0 { filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5)); }
  &.ovo-league-glow--1 { filter: drop-shadow(0 0 5px rgba(180, 130, 255, 0.5)); }
  &.ovo-league-glow--2 { filter: drop-shadow(0 0 5px rgba(0, 200, 200, 0.5)); }
  &.ovo-league-glow--3 { filter: drop-shadow(0 0 5px rgba(100, 180, 255, 0.5)); }
  &.ovo-league-glow--4 { filter: drop-shadow(0 0 5px rgba(180, 220, 255, 0.5)); }
  &.ovo-league-glow--5 { filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5)); }
  &.ovo-league-glow--6 { filter: drop-shadow(0 0 5px rgba(192, 192, 192, 0.5)); }
  &.ovo-league-glow--7 { filter: drop-shadow(0 0 5px rgba(205, 127, 50, 0.5)); }
  &.ovo-league-glow--8 { filter: drop-shadow(0 0 5px rgba(100, 200, 100, 0.5)); }
}

.ovo-league-link {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: box-shadow 0.15s;

  &:hover {
    box-shadow: 0 0 10px rgba(var(--v-theme-on-surface), 0.3);
  }
}

.ovo-mmr {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85em;
  opacity: 0.8;
}

.ovo-mmr--left {
  grid-column: 1;
  grid-row: 3;
  justify-content: flex-end;
  text-align: right;
}

.ovo-mmr--right {
  grid-column: 3;
  grid-row: 3;
  justify-content: flex-start;
  text-align: left;
}

.ovo-mmr-label {
  opacity: 0.6;
}

.ovo-winner-fist {
  vertical-align: middle;
}

.ovo-map-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 0 8px;
}

@media (max-width: 750px) {
  .ovo-header {
    --ovo-icon-size: 28px;
    padding: 8px 4px;
  }

  .ovo-name-league-grid {
    grid-row-gap: 8px;
  }

  .ovo-name {
    font-size: 1em;
    flex-wrap: wrap;
    row-gap: 2px;

    .ovo-name-link {
      order: -1;
      flex-basis: 100%;
    }
  }

  .ovo-vs {
    font-size: 0.95em;
    padding: 0 4px;
  }

  .ovo-league {
    font-size: 0.75em;
    gap: 4px;
  }

  .ovo-league-link {
    gap: 4px;
  }

  .ovo-mmr--left,
  .ovo-mmr--right {
    font-size: 0.75em;
  }
}
</style>
