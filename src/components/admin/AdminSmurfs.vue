<template>
  <div>
    <v-card-title>
      Smurf Checker
    </v-card-title>
    <v-container>
      <v-card>
        <v-card-title>
          Configuration
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="auto" class="d-flex align-center pa-0 ml-5 mr-5">
              <v-select
                v-model="searchDepth"
                :items="[1, 2, 3, 4, 5]"
                label="Search depth"
                outlined
                dense
                hide-details
                style="max-width: 150px;"
              />
              <v-checkbox
                v-if="canSeeSmurfCheckerQueryExplanation"
                v-model="generateExplanation"
                label="Generate explanation"
                dense
                class="ml-4"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-title>
          Search
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col class="d-flex align-center flex-grow-1 ml-2 mr-2">
              <!-- We dont support search by the other identifier types yet, but already prepare the UI for it. Remove 'disabled' once ready. -->
              <v-select
                v-model="selectedIdentifierType"
                :items="availableIdentifierTypes"
                label="Identifier Type"
                outlined
                dense
                hide-details
                disabled
                style="max-width: 150px;"
              />
              <!-- Autocomplete Btag search -->
              <v-autocomplete
                v-model="searchPlayerModel"
                :append-icon="mdiMagnify"
                label="Search..."
                clearable
                placeholder=" "
                :items="searchedPlayers"
                :search-input.sync="search"
                return-object
                autofocus
                class="flex-grow-1 ml-4 mr-2"
                @click:clear="revertToDefault"
              />
              <v-btn
                class="ml-5"
                :disabled="!searchPlayerModel"
                @click="executeSearch"
              >
                Search
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <v-card v-if="showSmurfResults && smurfResults">
        <v-card-title>Smurfs:</v-card-title>
        <v-list>
          <v-list-item v-for="battleTag in smurfResults.connectedBattleTags" :key="battleTag">
            <div style="cursor: pointer" @click="searchSmurfsFromClick(battleTag)">{{ battleTag }}</div>
            <v-spacer />
            <v-btn @click="goToProfile(battleTag)">Go to profile</v-btn>
          </v-list-item>
        </v-list>
      </v-card>

      <v-card v-if="canSeeSmurfCheckerQueryExplanation && generateExplanation && smurfResults?.explanation && smurfResults.explanation.length > 0">
        <v-card-title>Explanation:</v-card-title>
        <v-list>
          <v-expansion-panels multiple>
            <v-expansion-panel
              v-for="step in smurfResults.explanation"
              :key="step.iteration"
            >
              <!-- Header shows iteration number, identifierType, and how many groups -->
              <v-expansion-panel-header>
                <div class="d-flex justify-space-between align-center" style="width: 100%">
                  <div>
                    <strong>Iteration {{ step.iteration }}</strong> —
                    {{ step.identifierType }}
                  </div>
                  <div>Groups: {{ step.identifierGroups.length }}</div>
                </div>
              </v-expansion-panel-header>

              <v-expansion-panel-content>
                <!-- Show filteredIdentifiers as chips or comma-separated -->
                <v-row class="mb-3">
                  <v-col cols="12">
                    <strong>Filtered Identifiers:</strong>
                    <v-chip-group
                      v-if="step.filteredIdentifiers.length"
                      column
                      class="mt-1"
                    >
                      <v-chip
                        v-for="filteredIdentifier in step.filteredIdentifiers"
                        :key="filteredIdentifier"
                        small
                      >
                        {{ filteredIdentifier }}
                      </v-chip>
                    </v-chip-group>
                    <span v-else>None</span>
                  </v-col>
                </v-row>

                <v-expansion-panels>
                  <v-expansion-panel
                    v-for="group in step.identifierGroups"
                    :key="group.identifier"
                  >
                    <v-expansion-panel-header>
                      <!-- Display the identifier and a summary of login counts to show significant identifiers -->
                      <div class="d-flex justify-space-between align-center" style="width: 100%">
                        <div>
                          <strong>{{ step.identifierType }}:</strong> {{ group.identifier }}
                        </div>
                        <div>
                          From: {{ totalLogins(group.fromBattleTags) }}
                          &nbsp;|&nbsp;
                          To: {{ totalLogins(group.toBattleTags) }}
                        </div>
                      </div>
                    </v-expansion-panel-header>

                    <v-expansion-panel-content>
                      <!-- Two side-by-side lists or tables for from vs. to -->
                      <v-row>
                        <SmurfBattleTagDetailsTable title="From BattleTags" :data="group.fromBattleTags" />
                        <SmurfBattleTagDetailsTable title="To BattleTags" :data="group.toBattleTags" />
                      </v-row>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-list>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, onMounted } from "vue";
import { useAdminStore } from "@/store/admin/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import { mdiMagnify } from "@mdi/js";
import { getProfileUrl } from "@/helpers/url-functions";
import { useRouter } from "vue-router/composables";
import { SmurfDetectionResult, BattleTagLoginCount } from "@/services/admin/smurf-detection/SmurfDetectionResponse";
import SmurfBattleTagDetailsTable from "./smurf-detection/SmurfBattleTagDetailsTable.vue";
import { useOauthStore } from "@/store/oauth/store";
import { EPermission } from "@/store/admin/permission/types";

export default defineComponent({
  name: "AdminSmurfs",
  components: {
    SmurfBattleTagDetailsTable,
  },
  setup() {
    const router = useRouter();
    const adminStore = useAdminStore();
    const playerSearchStore = usePlayerSearchStore();
    const oauthStore = useOauthStore();

    const searchPlayerModel = ref<string>("");
    const search = ref<string>("");
    const showSmurfResults = ref<boolean>(false);
    const showExplanation = ref<boolean>(false);
    const oldSearchTerm = ref<string>("");
    const smurfResults = ref<SmurfDetectionResult>();
    const generateExplanation = ref<boolean>(false);
    const searchDepth = ref<number>(1);
    const selectedIdentifierType = ref<string>("battleTag");
    const availableIdentifierTypes = ref<string[]>(["battleTag"]);

    const searchedPlayers = computed<string[]>(() => playerSearchStore.searchedPlayers.map((player) => player.battleTag));
    const permissions = computed<string[]>(() => oauthStore.permissions);
    const canSeeSmurfCheckerQueryExplanation = computed(() => permissions.value.includes(EPermission[EPermission.SmurfCheckerQueryExplanation]));

    function goToProfile(alt: string): void {
      router.push({
        path: getProfileUrl(alt),
      }).catch(() => null);
    }

    function totalLogins(list: BattleTagLoginCount[]): number {
      return list.reduce((acc, curr) => acc + curr.numberOfLogins, 0);
    }

    function searchSmurfsFromClick(bTag: string) {
      selectedIdentifierType.value = "battleTag";
      searchPlayerModel.value = bTag;
      search.value = bTag;
      executeSearch();
    }

    function revertToDefault(): void {
      showSmurfResults.value = false;
      oldSearchTerm.value = "";
      playerSearchStore.clearPlayerSearch();
      smurfResults.value = undefined;
    }

    async function executeSearch(): Promise<void> {
      if (!searchPlayerModel.value) return;
      if (selectedIdentifierType?.value != "battleTag") return; // Only battle tags are searchable

      smurfResults.value = await adminStore.querySmurfsForIdentifier(selectedIdentifierType.value, searchPlayerModel.value, searchDepth.value, generateExplanation.value);

      if ((smurfResults.value != null || undefined) && smurfResults.value.connectedBattleTags.length > 0) {
        showSmurfResults.value = true;
      } else {
        showSmurfResults.value = false;
      }
    }

    watch(search, onSearchChanged);

    onMounted(async () => {
      availableIdentifierTypes.value = await adminStore.getSmurfIdentifierTypes();
    });

    function onSearchChanged(newValue: string): void {
      if (newValue && newValue.length > 2 && newValue !== oldSearchTerm.value) {
        playerSearchStore.searchBnetTag({
          searchText: newValue,
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
      showSmurfResults,
      smurfResults,
      searchSmurfsFromClick,
      goToProfile,
      generateExplanation,
      searchDepth,
      selectedIdentifierType,
      availableIdentifierTypes,
      executeSearch,
      showExplanation,
      totalLogins,
      canSeeSmurfCheckerQueryExplanation,
    };
  },
});
</script>
