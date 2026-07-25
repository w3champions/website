<template>
  <div class="text-body-2">
    <div v-if="gameMap.description" class="mb-3">
      {{ gameMap.description }}
    </div>

    <v-row dense>
      <v-col v-for="field in fields" :key="field.label" cols="12" sm="6">
        <div class="d-flex ga-2">
          <span class="text-medium-emphasis" style="min-width: 120px;">{{ field.label }}</span>
          <span class="text-break">{{ field.value }}</span>
        </div>
      </v-col>
    </v-row>

    <div v-if="forces.length" class="mt-3">
      <div class="text-medium-emphasis mb-1">Forces</div>
      <div class="d-flex flex-wrap ga-2">
        <v-chip v-for="force in forces" :key="force.name" size="small" variant="tonal">
          {{ force.name }} &middot; {{ force.slots }} slot{{ force.slots === 1 ? "" : "s" }}
        </v-chip>
      </div>
    </div>

    <div v-if="playerNames.length" class="mt-3">
      <div class="text-medium-emphasis mb-1">Players</div>
      <div class="d-flex flex-wrap ga-2">
        <v-chip v-for="(name, index) in playerNames" :key="`${name}-${index}`" size="small" variant="tonal">
          {{ name }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import type { GameMap } from "@/store/admin/mapsManagement/types";

interface Field {
  label: string;
  value: string;
}

export default defineComponent({
  name: "MapFileDetailsTable",
  props: {
    gameMap: {
      type: Object as PropType<GameMap>,
      required: true,
    },
    forces: {
      type: Array as PropType<{ name: string; slots: number }[]>,
      default: () => [],
    },
  },
  setup(props) {
    const playerNames = computed<string[]>(() =>
      (props.gameMap.players ?? []).map((player, index) => player.name || `Player ${index + 1}`)
    );

    const fields = computed<Field[]>(() => {
      const gameMap = props.gameMap;
      const entries: Field[] = [
        { label: "Author", value: gameMap.author || "—" },
        { label: "Size", value: gameMap.width && gameMap.height ? `${gameMap.width} × ${gameMap.height}` : "—" },
        { label: "Player slots", value: String(gameMap.num_players ?? "—") },
        { label: "Suggested players", value: gameMap.suggested_players || "—" },
        { label: "12 player map", value: gameMap.twelve_p ? "Yes" : "No" },
        { label: "Path", value: gameMap.path || "—" },
        { label: "SHA1", value: gameMap.sha1 || "—" },
        { label: "CRC32", value: gameMap.crc32 !== undefined ? String(gameMap.crc32) : "—" },
      ];

      if (gameMap.checksum !== undefined) {
        entries.push({ label: "Checksum", value: String(gameMap.checksum) });
      }

      return entries;
    });

    return {
      fields,
      playerNames,
    };
  },
});
</script>
