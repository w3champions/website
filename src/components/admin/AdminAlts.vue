<template>
  <div>
    <v-card-title>
      Smurf Checker
    </v-card-title>
    <v-container>
      <v-row>
        <!-- Autocomplete Btag search -->
        <v-autocomplete
          class="ml-5 mr-5"
          v-model="searchPlayerModel"
          :append-icon="mdiMagnify"
          label="Search BattleTag"
          clearable
          placeholder=" "
          :items="searchedPlayers"
          :search-input.sync="search"
          return-object
          @click:clear="revertToDefault"
          autofocus
        ></v-autocomplete>
      </v-row>

      <v-card v-if="showAlts">
        <v-card-title>Smurfs:</v-card-title>
        <v-list>
          <template>
            <v-list-item v-for="alt in alts" :key="alt">
              <div @click="searchAltsFromClick(alt)" style="cursor: pointer">{{ alt }}</div>
              <v-spacer></v-spacer>
              <v-btn @click="goToProfile(alt)">Go to profile</v-btn>
            </v-list-item>
          </template>
        </v-list>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useAdminStore } from "@/store/admin/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import { mdiMagnify } from "@mdi/js";
import { getProfileUrl } from "@/helpers/url-functions";
import { useRouter } from "vue-router/composables";

export default defineComponent({
  name: "AdminAlts",
  components: {},
  setup() {
    const router = useRouter();
    const adminStore = useAdminStore();
    const playerSearchStore = usePlayerSearchStore();

    const searchPlayerModel = ref<string>("");
    const search = ref<string>("");
    const showAlts = ref<boolean>(false);
    const oldSearchTerm = ref<string>("");
    const alts = ref<string[]>([]);

    const searchedPlayers = computed<string[]>(() => playerSearchStore.searchedPlayers.map((player) => player.battleTag));

    function goToProfile(alt: string): void {
      router.push({
        path: getProfileUrl(alt),
      }).catch(() => null);
    }

    function searchAltsFromClick(bTag: string) {
      searchPlayerModel.value = bTag;
      search.value = bTag;
    }

    function revertToDefault(): void {
      showAlts.value = false;
      oldSearchTerm.value = "";
      playerSearchStore.clearPlayerSearch();
      alts.value = [];
    }

    watch(searchPlayerModel, onSearchStringChanged);
    async function onSearchStringChanged(bTag: string): Promise<void> {
      if (!bTag) return;

      alts.value = await adminStore.getAltsForPlayer(bTag);

      if ((alts.value != null || undefined) && alts.value.length > 0) {
        showAlts.value = true;
      } else {
        revertToDefault();
      }
    }

    watch(search, onSearchChanged);
    function onSearchChanged(newValue: string): void {
      if (newValue && newValue.length > 2 && newValue !== oldSearchTerm.value) {
        playerSearchStore.searchBnetTag({
          searchText: newValue.toLowerCase(),
        });
        oldSearchTerm.value = newValue;
      } else {
        revertToDefault();
      }
    }

    return {
      mdiMagnify,
      searchPlayerModel,
      searchedPlayers,
      search,
      revertToDefault,
      showAlts,
      alts,
      searchAltsFromClick,
      goToProfile,
    };
  },
});
</script>
