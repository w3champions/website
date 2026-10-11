<template>
  <div>
    <v-autocomplete
      v-model="selected"
      v-model:search="input"
      class="w3-autocomplete"
      :class="classes"
      menu-icon=""
      :append-inner-icon="mdiMagnify"
      :label="showFloatingLabel ? searchLabel : undefined"
      :placeholder="showFloatingLabel ? undefined : searchLabel"
      :persistent-placeholder="!showFloatingLabel"
      :single-line="!showFloatingLabel"
      :density="density"
      :items="searchedPlayers"
      item-title="battleTag"
      :no-data-text="noDataText"
      :loading="isLoading"
      :autofocus="setAutofocus"
      bg-color="transparent"
      :hide-details="hideDetails"
      glow
      color="primary"
      icon-color="primary"
      variant="underlined"
      autocomplete="off"
      clearable
      @update:model-value="onSelect"
      @click:clear="clearSearch"
      @click:append-inner="submitSearch"
      @keydown.enter.prevent="submitSearch"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, ref, watch, PropType } from "vue";
import debounce from "debounce";
import ProfileService from "@/services/ProfileService";

import { mdiMagnify } from "@mdi/js";
import { PlayerProfile } from "@/store/player/types";

type SearchDensity = "default" | "comfortable" | "compact";

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
    hideDetails: {
      type: Boolean,
      required: false,
      default: true,
    },
    showFloatingLabel: {
      type: Boolean,
      required: false,
      default: true,
    },
    density: {
      type: String as PropType<SearchDensity>,
      required: false,
      default: "default",
    },
    searchLabel: {
      type: String,
      required: false,
      default: "Search BattleTag",
    }
  },
  setup: (props, context) => {
    const input = ref<string>("");
    const isLoading = ref<boolean>(false);
    const SEARCH_DELAY = 500;
    const searchedPlayers = ref<PlayerProfile[]>([]);
    const selected = ref<string>();

    // Advanced as soon as a search is queued (not when the debounce fires) and on every
    // cancel, so a reply is only applied while it belongs to the latest queued text.
    let latestSearchId = 0;
    const debouncedSearch = debounce(dispatchSearch, SEARCH_DELAY);

    async function dispatchSearch(val: string, searchId: number) {
      try {
        const players = await ProfileService.searchPlayer(val.toLowerCase());
        if (searchId !== latestSearchId) return;
        searchedPlayers.value = players;
      } finally {
        if (searchId === latestSearchId) isLoading.value = false;
      }
    }

    function cancelPendingSearch(): void {
      debouncedSearch.clear();
      latestSearchId++;
    }

    onBeforeUnmount(cancelPendingSearch);

    // Driven by the field's update:model-value. Vuetify only emits that when the value
    // changes, so onInput clears `selected` once the text diverges from it; otherwise
    // re-picking the same player after editing the text would emit nothing.
    function onSelect(btag: string | undefined): void {
      if (!btag) return;
      context.emit("playerFound", btag);
    }

    function submitSearch(): void {
      const searchValue = (input.value || selected.value || "").trim();
      if (!searchValue) {
        clearSearch();
        return;
      }

      context.emit("searchRequested", searchValue);
    }

    watch(input, onInput);

    function onInput(val: string): void {
      context.emit("searchTextChanged", val);
      // Empty text is not an edit: Vuetify resets the search to "" on blur while the
      // selection stays shown, and clears the selection itself when the user empties it.
      if (val && selected.value && val !== selected.value) selected.value = undefined;
      if (!val || val.length < 3) {
        cancelPendingSearch();
        searchedPlayers.value = [];
        isLoading.value = false;
        return;
      }
      isLoading.value = true;
      debouncedSearch(val, ++latestSearchId);
    }

    const clearSearch = (): void => {
      context.emit("searchCleared");
      isLoading.value = false;
    };

    context.expose({
      selected
    });

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
      onSelect,
      submitSearch,
    };
  },
});
</script>
