<template>
  <v-combobox
    v-model="chips"
    :items
    small-chips
    clearable
    label="Assign Groups (optional) - Select existing or enter a new group"
    multiple
  >
    <template #selection="{ attrs, item, select, selected }">
      <v-chip
        v-bind="attrs"
        :color="'blue lighten-3'"
        :input-value="selected"
        close
        @click="select"
        @click:close="remove(item)"
      >
        {{ item }}
      </v-chip>
    </template>
  </v-combobox>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";

export default defineComponent({
  name: "PortraitGroupCombobox",
  components: {},
  props: {
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
      chips.value.splice(chips.value.indexOf(item), 1);
      chips.value = [...chips.value];
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
