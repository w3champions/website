<template>
  <v-autocomplete
    :class="classes"
    v-model="playerSearchModel"
    :append-icon="mdiMagnify"
    label="Search BattleTag"
    clearable
    placeholder=" "
    :items="searchedPlayers"
    :search.sync="search"
    :no-data-text="noDataText"
    :loading="isLoading"
    :autofocus="setAutofocus ? true : false"
  ></v-autocomplete>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, ref, watch, WritableComputedRef } from "vue";
import debounce from "debounce";
import { usePlayerSearchStore } from "@/store/playerSearch/store";

import { mdiMagnify } from "@mdi/js";

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
    const search = ref<string>("");
    const isLoading = ref<boolean>(false);
    const SEARCH_DELAY = 500;
    const debouncedSearch = debounce(dispatchSearch, SEARCH_DELAY);
    const playerSearchStore = usePlayerSearchStore();

    // Instead of using the playerSearchStore for the playerSearchModel, we can have it in this component only,
    // and then clearing the necessary data from the parent when closing dialog/moving away from page, by using defineExpose.
    // defineExpose is available in Vue 3: https://stackoverflow.com/a/75145481
    const playerSearchModel: WritableComputedRef<string> = computed({
      get(): string {
        return playerSearchStore.playerSearchModel;
      },
      set(val: string): void {
        playerSearchStore.setPlayerSearchModel(val);
      },
    });

    function dispatchSearch() {
      playerSearchStore.searchBnetTag({ searchText: search.value.toLowerCase() });
    }

    watch(playerSearchModel, onPlayerSearchModelChanged);

    function onPlayerSearchModelChanged(btag: string): void {
      if (!btag) return;
      context.emit("playerFound", btag);
    }

    watch(search, onPlayerSearchChanged);

    function onPlayerSearchChanged(): void {
      if (search.value && search.value.length > 2) {
        isLoading.value = true;
        debouncedSearch();
      } else {
        clearSearch();
        isLoading.value = false;
        // Prevent previous calls from executing
        debouncedSearch.clear();
      }
    }

    function clearSearch(): void {
      context.emit("searchCleared");
      playerSearchStore.clearPlayerSearch();
    }

    const searchedPlayers: ComputedRef<string[]> = computed((): string[] => playerSearchStore.searchedPlayers.map((player) => player.battleTag));

    const noDataText: ComputedRef<string> = computed((): string => (!search.value || search.value.length < 3) ? "Type at least 3 letters" : isLoading.value ? "Loading..." : "No player found");

    watch(searchedPlayers, onPlayersChanged);

    function onPlayersChanged() {
      // If the players array has changed it means the search request finished
      isLoading.value = false;
    }

    return {
      mdiMagnify,
      playerSearchModel,
      searchedPlayers,
      search,
      noDataText,
      isLoading,
    };
  },
});

</script>

<style lang="scss"></style>
