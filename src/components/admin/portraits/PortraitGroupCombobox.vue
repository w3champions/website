<template>
  <v-combobox
    v-model="chips"
    :disabled="disabled"
    :items="items"
    clearable
    :label="label"
    multiple
    :variant="variant"
    :density="density"
    hide-details="auto"
  >
    <template v-slot:selection="{ item }">
      <v-chip
        color="primary"
        variant="flat"
        closable
        @click:close="remove(item.value)"
      >
        {{ item.value }}
      </v-chip>
    </template>
  </v-combobox>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import type { PropType } from "vue";

export default defineComponent({
  name: "PortraitGroupCombobox",
  components: {},
  props: {
    label: {
      type: String,
      default: "Assign Groups (optional) - Select existing or enter a new group",
    },
    variant: {
      type: String as PropType<"underlined" | "outlined">,
      default: "underlined",
    },
    density: {
      type: String as PropType<"default" | "comfortable" | "compact">,
      default: "default",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    portraitId: {
      type: Number,
      required: true,
    },
  },
  setup(props, context) {
    const playerManagement = usePlayerManagementStore();
    const chips = ref<string[]>([]);
    const items = ref<string[]>([]);
    const initItems = computed<string[]>(() => playerManagement.portraitDefinitionGroups.map((x) => x.group));

    const getChips = computed<string[]>(() => {
      return playerManagement.portraitDefinitionGroups
        .filter((x) => x.portraitIds.includes(props.portraitId))
        .map((x) => x.group);
    });

    watch(chips, onItemsChanged, { deep: true });
    function onItemsChanged(): void {
      context.emit("groups-changed", chips.value);
    }

    function remove(item: string) {
      chips.value = chips.value.filter((x) => x !== item);
    }

    async function init(): Promise<void> {
      const portraitDefGroups = playerManagement.portraitDefinitionGroups;
      if (!portraitDefGroups || portraitDefGroups.length < 1) {
        await playerManagement.loadPortraitDefinitionGroups();
      }
      const allSpecialPortraits = playerManagement.allSpecialPortraits;
      if (!allSpecialPortraits || allSpecialPortraits.length < 1) {
        await playerManagement.loadAllSpecialPortraits();
      }
      items.value = initItems.value;
      chips.value = getChips.value;
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      chips,
      items,
      remove,
    };
  },
});
</script>
