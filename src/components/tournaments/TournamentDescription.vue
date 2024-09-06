<template>
  <div>
    <div>
      <b>Start Time:</b>
      {{ formattedDate }}
    </div>
    <div>
      <b>Game Mode:</b>
      {{ gameMode }}
    </div>
    <div>
      <b>Format:</b>
      {{ format }}
    </div>
    <div>
      <b>Player Count:</b>
      {{ playerCount }}
    </div>
    <div>
      <b>Map Pool:</b>
      {{ mapPool }}
    </div>
    <div v-if="maxPlayers">
      <b>Max Players:</b>
      {{ maxPlayers }}
    </div>
    <div v-if="floNode">
      <div>Players must have a ping of <b>{{ floNodeMaxPing }}</b> or less to <b>{{ floNode.name }}</b>.</div>
    </div>
    <div v-if="matcherinoUrl">
      <a v-bind:href="matcherinoUrl">Donate to the prize pool</a>
    </div>
    <div class="mt-2" v-if="statusInit || statusRegistration || statusMatchGeneration || statusCanceled">
      <div v-if="statusInit">Registration didn't start yet.</div>
      <div v-else-if="statusRegistration">Registration is open.</div>
      <div v-else-if="statusMatchGeneration">Generating bracket.</div>
      <div v-else-if="statusCanceled">The tournament was canceled.</div>
      <div class="mt-2" v-if="tournament.players.length > 0">Registered players list: {{ registeredPlayers }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, PropType } from "vue";
import { useI18n } from "vue-i18n-bridge";
import { ETournamentState, ITournament, ITournamentFloNode } from "@/store/tournaments/types";
import { ETournamentFormatLabel, EGameModeLabel } from "@/helpers/tournaments";
import { Map } from "@/store/admin/mapsManagement/types";
import { ERaceEnum } from "@/store/types";
import { formatDateToDateWeekday } from "@/helpers/date-functions";

export default defineComponent({
  name: "TournamentDescription",
  components: {},
  props: {
    tournament: {
      type: Object as PropType<ITournament>,
      required: true,
    },
    maps: {
      type: Array<Map>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const formattedDate: ComputedRef<string> = computed((): string => formatDateToDateWeekday(props.tournament.startDateTime));
    const gameMode: ComputedRef<string> = computed((): string => EGameModeLabel[props.tournament.mode]);
    const format: ComputedRef<string> = computed((): string => ETournamentFormatLabel[props.tournament.format]);
    const playerCount: ComputedRef<number> = computed((): number => props.tournament.players.length);
    const mapPool: ComputedRef<string> = computed((): string => props.tournament.mapPool.map((mapId) => props.maps.find((map) => map.id === mapId)?.name).sort().join(", "));
    const statusInit: ComputedRef<boolean> = computed((): boolean => props.tournament.state === ETournamentState.INIT);
    const statusRegistration: ComputedRef<boolean> = computed((): boolean => props.tournament.state === ETournamentState.REGISTRATION);
    const statusMatchGeneration: ComputedRef<boolean> = computed((): boolean => props.tournament.state === ETournamentState.MATCH_GENERATION);
    const statusCanceled: ComputedRef<boolean> = computed((): boolean => props.tournament.state === ETournamentState.CANCELED);
    const matcherinoUrl: ComputedRef<string | undefined> = computed((): string | undefined => props.tournament.matcherinoUrl);
    const maxPlayers: ComputedRef<number> = computed((): number => props.tournament.maxPlayers);
    const floNode: ComputedRef<ITournamentFloNode> = computed((): ITournamentFloNode => props.tournament.floNode);
    const floNodeMaxPing: ComputedRef<number> = computed((): number => props.tournament.floNodeMaxPing);

    const registeredPlayers: ComputedRef<string> = computed((): string => {
      return props.tournament.players.map((player) => (
        `${player.battleTag}(${t(`racesShort.${ERaceEnum[player.race]}`)})`
      )).join(", ");
    });

    return {
      formattedDate,
      gameMode,
      format,
      playerCount,
      mapPool,
      statusInit,
      statusRegistration,
      statusMatchGeneration,
      statusCanceled,
      matcherinoUrl,
      maxPlayers,
      floNode,
      floNodeMaxPing,
      registeredPlayers,
    };
  },
});
</script>
