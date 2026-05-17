<template>
  <div class="ovo-header">
    <div class="ovo-season-bar">
      <v-card-subtitle class="pa-0 text-uppercase opacity-100">
        <span v-if="isGatewayNeeded">{{ $t(`gatewayNames.${gateWay}`) }} ·
        </span>
        <span>{{ $t(`views_matchdetail.season`) }}: {{ season }}</span>
      </v-card-subtitle>
      <host-icon
        v-if="match.serverInfo && match.serverInfo.provider"
        :host="match.serverInfo"
        style="padding-right: 0px"
      />
      <div class="subicon">
        <download-replay-icon :gameId="matchId" />
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
    <div class="ovo-player-names">
      <div class="ovo-name ovo-name--left">
        <country-flag-extended
          v-if="player(0).countryCode || player(0).location"
          :countryCode="player(0).countryCode"
          :location="player(0).location"
          class="mr-2"
        />
        <a
          class="text-primary cursor-pointer"
          @click="goToPlayer(player(0).battleTag)"
        >
          {{ player(0).name }}
        </a>
      </div>
      <player-icon
        :race="player(0).race"
        :rndRace="player(0).rndRace"
        :big="true"
      />
      <div class="ovo-vs">VS</div>
      <player-icon
        :race="player(1).race"
        :rndRace="player(1).rndRace"
        :big="true"
      />
      <div class="ovo-name ovo-name--right">
        <a
          class="text-primary cursor-pointer"
          @click="goToPlayer(player(1).battleTag)"
        >
          {{ player(1).name }}
        </a>
        <country-flag-extended
          v-if="player(1).countryCode || player(1).location"
          :countryCode="player(1).countryCode"
          :location="player(1).location"
          class="ml-2"
        />
      </div>
    </div>
    <div class="ovo-league-row">
      <div class="ovo-league ovo-league--left">
        <template v-if="player(0).ranking?.leagueOrder != null">
          <router-link
            :to="rankingsUrl(player(0), player(0).ranking.leagueOrder)"
            class="ovo-league-link"
          >
            <img
              :src="`/assets/leagueIcons/${player(0).ranking.leagueOrder}.png`"
              class="ovo-league-icon"
              :class="`ovo-league-glow--${player(0).ranking.leagueOrder}`"
            />
            <span class="ovo-league-name">{{ leagueName(0) }}</span>
            <span v-if="player(0).ranking.division" class="ovo-mmr-label">
              {{ player(0).ranking.division }}
            </span>
            <span v-if="player(0).ranking.rank" class="ovo-rank-num">
              #{{ player(0).ranking.rank }}
            </span>
          </router-link>
          <span v-if="player(0).won" class="ovo-crown">👑</span>
        </template>
        <template v-else>{{ $t("views_rankings.unranked") }}</template>
      </div>
      <div></div>
      <div></div>
      <div></div>
      <div class="ovo-league ovo-league--right">
        <template v-if="player(1).ranking?.leagueOrder != null">
          <router-link
            :to="rankingsUrl(player(1), player(1).ranking.leagueOrder)"
            class="ovo-league-link"
          >
            <img
              :src="`/assets/leagueIcons/${player(1).ranking.leagueOrder}.png`"
              class="ovo-league-icon"
              :class="`ovo-league-glow--${player(1).ranking.leagueOrder}`"
            />
            <span class="ovo-league-name">{{ leagueName(1) }}</span>
            <span v-if="player(1).ranking.division" class="ovo-mmr-label">
              {{ player(1).ranking.division }}
            </span>
            <span v-if="player(1).ranking.rank" class="ovo-rank-num">
              #{{ player(1).ranking.rank }}
            </span>
          </router-link>
          <span v-if="player(1).won" class="ovo-crown">👑</span>
        </template>
        <template v-else>{{ $t("views_rankings.unranked") }}</template>
      </div>
    </div>
    <div class="ovo-mmr-row">
      <div class="ovo-mmr ovo-mmr--left">
        <template v-if="player(0).oldMmr">
          {{ Math.floor(player(0).oldMmr) }}
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
      </div>
      <div></div>
      <div></div>
      <div></div>
      <div class="ovo-mmr ovo-mmr--right">
        <template v-if="player(1).oldMmr">
          {{ Math.floor(player(1).oldMmr) }}
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
        <span class="ovo-mmr-label">Duration:</span>
        {{ gameDurationLong }}
      </div>
      <div>
        <span class="ovo-mmr-label">Start time:</span>
        {{ gameStartTime }}
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
import { mapNameFromMatch } from "@/composables/MatchMixin";
import { getProfileUrl } from "@/helpers/url-functions";
import { leagueNameFromOrder } from "@/helpers/leagues";
import { formatDuration, intervalToDuration } from "date-fns";
import { mdiChatProcessingOutline } from "@mdi/js";

export default defineComponent({
  name: "MatchDetailOneVsOne",
  components: {
    HostIcon,
    DownloadReplayIcon,
    MatchDetailHeroRow,
    CountryFlagExtended,
    PlayerIcon,
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

    const gameDurationLong = computed<string>(() => formatDuration(intervalToDuration({ start: 0, end: props.match.durationInSeconds * 1000 })));
    const gameStartTime = computed<string>(() => new Date(props.match.startTime).toLocaleString());

    return {
      player,
      mmrChange,
      leagueName,
      rankingsUrl,
      goToPlayer,
      gameDurationLong,
      gameStartTime,
      mapNameFromMatch,
      mdiChatProcessingOutline,
    };
  },
});
</script>

<style lang="scss" scoped>
.subicon {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  position: absolute;
  top: 8px;
  right: 8px;
}

.ovo-header {
  padding: 8px 16px;
  position: relative;
}

.ovo-season-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .subicon {
    position: static;
    margin-left: auto;
    flex-direction: row;
  }
}

.ovo-player-names {
  display: grid;
  grid-template-columns: 1fr auto auto auto 1fr;
  align-items: center;
  grid-column-gap: 10px;
  margin-bottom: 4px;
}

.ovo-name {
  font-weight: bold;
  font-size: 1.5em;

  @media (max-width: 850px) {
    font-size: 1.1em;
  }
  overflow: hidden;

  :deep(.flag) {
    transform: scale(0.5);
    margin: -8px -6px;
  }

  a {
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    &:hover {
      text-decoration: underline;
    }
  }
}

.ovo-name--left {
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.ovo-name--right {
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.ovo-vs {
  font-size: 1.2em;
  font-weight: bold;
  padding: 0 8px;
}

.ovo-league-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto 1fr;
  align-items: center;
  grid-column-gap: 10px;
  margin-top: 16px;
}

.ovo-league {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ovo-league--left {
  justify-content: flex-end;
}

.ovo-league--right {
  justify-content: flex-start;
  padding-left: 12px;
}

.ovo-league-icon {
  width: 32px;
  height: 32px;

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

.ovo-league-name {
  @media (max-width: 850px) {
    display: none;
  }
}

@media (max-width: 850px) {
  .ovo-league-icon {
    width: 40px;
    height: 40px;
  }
}

.ovo-rank-num {
  opacity: 1;
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

.ovo-mmr-row {
  display: grid;
  grid-template-columns: 1fr 10px 141px 10px 1fr;
  align-items: center;
  margin-top: 15px;
  margin-bottom: 1px;
}

.ovo-mmr--left {
  text-align: right;
  font-size: 0.85em;
  opacity: 0.8;
}

.ovo-mmr--right {
  text-align: left;
  font-size: 0.85em;
  opacity: 0.8;
}

.ovo-mmr-label {
  opacity: 0.6;
}

.ovo-crown {
  font-size: 1.5em;
  padding-right: 13px;
}

.ovo-map-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 0 8px;
}
</style>
