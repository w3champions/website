<template>
  <div class="text-body-2">
    <div v-if="gameMap.description" class="mb-3">
      <wc3-text :text="gameMap.description" />
    </div>

    <v-row dense>
      <v-col v-for="field in fields" :key="field.label" cols="12" sm="6">
        <div class="d-flex ga-2">
          <span class="text-medium-emphasis" style="min-width: 120px;">{{ field.label }}</span>
          <span class="text-break">
            <wc3-text v-if="field.colored" :text="field.value" />
            <template v-else>{{ field.value }}</template>
          </span>
        </div>
      </v-col>
    </v-row>

    <div v-if="forces.length" class="mt-3">
      <div class="text-medium-emphasis mb-1">Forces</div>
      <div class="d-flex flex-wrap ga-2">
        <v-chip v-for="force in forces" :key="force.name" size="small" variant="tonal">
          <wc3-text :text="force.name" /><template v-if="force.slots > 0">
            &middot; {{ force.slots }} slot{{ force.slots === 1 ? "" : "s" }}
          </template>
        </v-chip>
      </div>
    </div>

    <div v-if="slots.length" class="mt-3">
      <div class="text-medium-emphasis mb-1">Slots</div>
      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="(player, index) in slots"
          :key="`${player.name}-${index}`"
          size="small"
          variant="tonal"
          :color="player.isPlayerSlot ? undefined : 'medium-emphasis'"
        >
          <wc3-text :text="player.name" /><template v-if="player.typeLabel">&nbsp;&middot; {{ player.typeLabel }}</template>
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import type { GameMap } from "@/store/admin/mapsManagement/types";
import Wc3Text from "./Wc3Text.vue";

interface Field {
  label: string;
  value: string;
  // Author-written fields can carry Warcraft 3 colour codes.
  colored?: boolean;
}

interface MapSlot {
  name: string;
  isPlayerSlot: boolean;
  typeLabel: string;
}

// war3map.w3i slot types. Type 1 is a slot a person can occupy - the format calls it
// "human", but that collides with the Human race, so it is labelled "Player" here.
const SLOT_TYPE_PLAYER = 1;
const SLOT_TYPE_LABELS: Record<number, string> = {
  1: "Player",
  2: "Computer",
  3: "Neutral",
  4: "Rescuable",
};

export default defineComponent({
  name: "MapFileDetailsTable",
  components: { Wc3Text },
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
    const slots = computed<MapSlot[]>(() =>
      (props.gameMap.players ?? []).map((player, index) => ({
        name: player.name || `Slot ${index + 1}`,
        isPlayerSlot: player.type === SLOT_TYPE_PLAYER,
        // Player slots are the norm, so only the others are worth labelling.
        typeLabel: player.type === SLOT_TYPE_PLAYER
          ? ""
          : SLOT_TYPE_LABELS[player.type] ?? `type ${player.type}`,
      }))
    );

    const slotBreakdown = computed<string>(() => {
      const total = props.gameMap.num_players ?? 0;
      const counts: Record<string, number> = {};
      for (const player of props.gameMap.players ?? []) {
        const label = SLOT_TYPE_LABELS[player.type] ?? `type ${player.type}`;
        counts[label] = (counts[label] ?? 0) + 1;
      }

      const parts = Object.entries(counts).map(
        ([label, count]) => `${count} ${label.toLowerCase()}${count === 1 ? "" : "s"}`
      );
      return parts.length ? `${total} total (${parts.join(", ")})` : String(total);
    });

    const fields = computed<Field[]>(() => {
      const gameMap = props.gameMap;
      const entries: Field[] = [
        // The file's own name, which can differ from the map name W3C shows.
        { label: "Name", value: gameMap.name || "—", colored: true },
        { label: "Author", value: gameMap.author || "—", colored: true },
        { label: "Size", value: gameMap.width && gameMap.height ? `${gameMap.width} × ${gameMap.height}` : "—" },
        { label: "Slots", value: slotBreakdown.value },
        // Free text the map author wrote into the map header, not a computed value.
        { label: "Suggested", value: gameMap.suggested_players || "—" },
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
      slots,
    };
  },
});
</script>
