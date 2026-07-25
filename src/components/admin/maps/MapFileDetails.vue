<template>
  <div v-if="gameMap">
    <!-- One line of the things you actually check before selecting a file. -->
    <div class="d-flex flex-wrap align-center ga-3 text-body-2">
      <span class="font-weight-medium">{{ gameMap.name || "Unnamed map" }}</span>
      <span v-if="gameMap.author" class="text-medium-emphasis">by {{ gameMap.author }}</span>
      <span v-if="gameMap.width && gameMap.height">{{ gameMap.width }}&times;{{ gameMap.height }}</span>
      <span>{{ gameMap.num_players }} player slots</span>
      <span v-if="forceCount">{{ forceCount }} force{{ forceCount === 1 ? "" : "s" }}</span>
      <span v-if="gameMap.suggested_players" class="text-medium-emphasis">
        suggested: {{ gameMap.suggested_players }}
      </span>
    </div>

    <!-- Mismatches are informational: changing a map's layout is a valid reason
         for the file and the configuration to disagree. -->
    <v-alert
      v-for="(warning, index) in warnings"
      :key="index"
      type="warning"
      variant="tonal"
      density="compact"
      class="mt-2 text-body-2"
    >
      {{ warning }}
    </v-alert>

    <v-expansion-panels v-if="collapsible" variant="accordion" class="mt-2">
      <v-expansion-panel :title="detailsTitle">
        <v-expansion-panel-text>
          <map-file-details-table :game-map="gameMap" :forces="forceRows" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <map-file-details-table v-else class="mt-2" :game-map="gameMap" :forces="forceRows" />
  </div>
  <div v-else class="text-medium-emphasis text-body-2">
    No file metadata available.
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import type { GameMap, Map } from "@/store/admin/mapsManagement/types";
import MapFileDetailsTable from "./MapFileDetailsTable.vue";

export interface ForceRow {
  name: string;
  slots: number;
}

// player_set is a bitmask of the lobby slots that belong to the force.
function countSlots(playerSet: number): number {
  let remaining = playerSet >>> 0;
  let count = 0;
  while (remaining) {
    count += remaining & 1;
    remaining >>>= 1;
  }
  return count;
}

export default defineComponent({
  name: "MapFileDetails",
  components: { MapFileDetailsTable },
  props: {
    gameMap: {
      type: Object as PropType<GameMap | undefined>,
      default: undefined,
    },
    // Supplying the map turns on the consistency warnings.
    map: {
      type: Object as PropType<Map | undefined>,
      default: undefined,
    },
    collapsible: {
      type: Boolean,
      default: true,
    },
    detailsTitle: {
      type: String,
      default: "File details",
    },
  },
  setup(props) {
    const forceCount = computed<number>(() => props.gameMap?.forces?.length ?? 0);

    const forceRows = computed<ForceRow[]>(() =>
      (props.gameMap?.forces ?? []).map((force, index) => ({
        name: force.name || `Force ${index + 1}`,
        slots: countSlots(force.player_set),
      }))
    );

    const warnings = computed<string[]>(() => {
      const gameMap = props.gameMap;
      const map = props.map;
      if (!gameMap || !map) return [];

      const messages: string[] = [];

      if (forceCount.value > 0 && map.maxTeams && forceCount.value !== map.maxTeams) {
        messages.push(
          `The file defines ${forceCount.value} force${forceCount.value === 1 ? "" : "s"}, `
            + `but the map is configured for ${map.maxTeams} team${map.maxTeams === 1 ? "" : "s"}.`
        );
      }

      const mappedSlots = (map.mappedForces ?? []).reduce(
        (total, force) => total + (force.slots?.length ?? 0),
        0
      );
      if (mappedSlots > 0 && gameMap.num_players && mappedSlots !== gameMap.num_players) {
        messages.push(
          `The mapped forces cover ${mappedSlots} slot${mappedSlots === 1 ? "" : "s"}, `
            + `but the file has ${gameMap.num_players} player slots.`
        );
      }

      return messages;
    });

    return {
      forceCount,
      forceRows,
      warnings,
    };
  },
});
</script>
