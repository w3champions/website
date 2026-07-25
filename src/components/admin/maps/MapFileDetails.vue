<template>
  <div v-if="gameMap">
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
      const totalSlots = gameMap.num_players;
      if (!totalSlots) return messages;

      // A file's forces are not W3C teams - a melee map keeps every player in one
      // force and lets the lobby decide - so the only mismatches worth reporting are
      // mapped forces that cannot fit the file at all.
      const mappedSlots = (map.mappedForces ?? []).reduce(
        (total, force) => total + (force.slots?.length ?? 0),
        0
      );
      if (mappedSlots > totalSlots) {
        messages.push(
          `The mapped forces cover ${mappedSlots} slots, `
            + `but the file only has ${totalSlots} player slot${totalSlots === 1 ? "" : "s"}.`
        );
      }

      const highestMappedSlot = (map.mappedForces ?? []).reduce(
        (highest, force) =>
          (force.slots ?? []).reduce((max, slot) => Math.max(max, slot.index), highest),
        -1
      );
      if (highestMappedSlot >= totalSlots) {
        messages.push(
          `The mapped forces use slot index ${highestMappedSlot}, `
            + `but the file only has ${totalSlots} slot${totalSlots === 1 ? "" : "s"} (0-${totalSlots - 1}).`
        );
      }

      return messages;
    });

    return {
      forceRows,
      warnings,
    };
  },
});
</script>
