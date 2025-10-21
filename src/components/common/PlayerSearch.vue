<template>
  <div>
    <v-autocomplete
      v-model="selected"
      v-model:search="input"
      class="cursor-text"
      :class="classes"
      menu-icon=""
      :append-inner-icon="mdiMagnify"
      label="Search BattleTag"
      :items="searchedPlayers"
      item-title="battleTag"
      :no-data-text="noDataText"
      :loading="isLoading"
      :autofocus="setAutofocus"
      bg-color="transparent"
      clearable
      hide-details
      glow
      @click:clear="clearSearch"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import debounce from "debounce";
import ProfileService from "@/services/ProfileService";

import { mdiMagnify } from "@mdi/js";
import { PlayerProfile } from "@/store/player/types";

export default defineComponent({
  name: "PlayerSearch",
  props: {
    classes: {
      type: String,
      required: false,
      default: "",
    },
    setAutofocus: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup: (_props, context) => {
    const input = ref<string>("");
    const isLoading = ref<boolean>(false);
    const SEARCH_DELAY = 500;
    const debouncedSearch = debounce((val: string) => dispatchSearch(val), SEARCH_DELAY);
    const searchedPlayers = ref<PlayerProfile[]>([]);
    const selected = ref<string>("");

    async function dispatchSearch(val: string) {
      const players = await ProfileService.searchPlayer(val.toLowerCase());
      searchedPlayers.value = players;
      isLoading.value = false;
    }

    watch(selected, onSelect);

    function onSelect(btag: string): void {
      if (!btag) return;
      context.emit("playerFound", btag);
    }

    watch(input, onInput);

    function onInput(val: string): void {
      if (!val || val.length < 3) {
        searchedPlayers.value = [];
        return;
      }
      isLoading.value = true;
      debouncedSearch(val);
    }

    const clearSearch = (): void => {
      context.emit("searchCleared");
      isLoading.value = false;
    };

    const noDataText = computed<string>(() =>
      (!input.value || input.value.length < 3)
        ? "Type at least 3 letters"
        : isLoading.value
          ? "Loading..."
          : "No player found");

    return {
      mdiMagnify,
      selected,
      input,
      noDataText,
      isLoading,
      searchedPlayers,
      clearSearch,
    };
  },
});
</script>

<style lang="scss" scoped>
:deep(.v-field__input input) {
  cursor: text;
}
</style>
