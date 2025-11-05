<template>
  <div>
    <v-card-title class="pt-3">
      Smurf Checker
    </v-card-title>
    <v-container class="w3-container-width">
      <v-card>
        <v-card-title class="pt-3">
          Configuration
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="auto" class="d-flex align-center pb-0">
              <v-select
                v-model="searchDepth"
                :items="[1, 2, 3, 4, 5]"
                label="Search depth"
                variant="outlined"
                color="primary"
                density="compact"
                hide-details
                width="150"
              />
              <v-checkbox
                v-if="canSeeSmurfCheckerQueryExplanation"
                v-model="generateExplanation"
                label="Generate explanation"
                class="ml-4"
                color="primary"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-title>
          Search
        </v-card-title>
        <v-card-text>
          <v-row class="align-center">
            <v-col cols="2">
              <!-- We dont support search by the other identifier types yet, but already prepare the UI for it. Remove 'disabled' once ready. -->
              <v-select
                v-model="selectedIdentifierType"
                :items="availableIdentifierTypes"
                label="Identifier Type"
                variant="outlined"
                color="primary"
                density="compact"
                hide-details
                disabled
                style="max-width: 150px;"
              />
            </v-col>
            <v-col class="pl-0" cols="8">
              <player-search
                ref="playerSearchComponent"
                :hideDetails="false"
                @playerFound="playerFound"
                @searchCleared="searchCleared"
              />
            </v-col>
            <v-col cols="2">
              <v-btn
                :disabled="!selectedPlayer"
                @click="executeSearch"
              >
                Search
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <v-card v-if="smurfResults">
        <v-card-title>Smurfs:</v-card-title>
        <v-list>
          <v-list-item v-for="battleTag in smurfResults.connectedBattleTags" :key="battleTag">
            <div class="d-flex align-center">
              <div class="cursor-pointer" @click="searchSmurfsFromClick(battleTag)">{{ battleTag }}</div>

              <!-- Moderation status badges -->
              <moderation-status-badges
                v-if="hasModerationPermission && !loadingModerationStatus"
                :battle-tag="battleTag"
                :compact="false"
                class="ml-3"
              />

              <v-progress-circular v-else-if="hasModerationPermission && loadingModerationStatus" indeterminate size="20" width="2" class="ml-3" />

              <v-spacer />
              <v-btn variant="text" border @click="goToProfile(battleTag)">Go to profile</v-btn>
            </div>
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
              <v-expansion-panel-title>
                <div class="d-flex justify-space-between align-center" style="width: 100%">
                  <div>
                    <strong>Iteration {{ step.iteration }}</strong> —
                    {{ step.identifierType }}
                  </div>
                  <div>Groups: {{ step.identifierGroups.length }}</div>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
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
                        size="small"
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
                    <v-expansion-panel-title>
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
                    </v-expansion-panel-title>

                    <v-expansion-panel-text>
                      <!-- Two side-by-side lists or tables for from vs. to -->
                      <v-row>
                        <SmurfBattleTagDetailsTable title="From BattleTags" :data="group.fromBattleTags" />
                        <SmurfBattleTagDetailsTable title="To BattleTags" :data="group.toBattleTags" />
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-list>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, onMounted, useTemplateRef } from "vue";
import { useAdminStore } from "@/store/admin/store";
import { getProfileUrl } from "@/helpers/url-functions";
import { useRouter } from "vue-router";
import { SmurfDetectionResult, BattleTagLoginCount } from "@/services/admin/smurf-detection/SmurfDetectionResponse";
import SmurfBattleTagDetailsTable from "./smurf-detection/SmurfBattleTagDetailsTable.vue";
import ModerationStatusBadges from "./smurf-detection/ModerationStatusBadges.vue";
import { useOauthStore } from "@/store/oauth/store";
import { EPermission } from "@/store/admin/permission/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";

export default defineComponent({
  name: "AdminSmurfs",
  components: {
    SmurfBattleTagDetailsTable,
    ModerationStatusBadges,
    PlayerSearch,
  },
  setup() {
    const router = useRouter();
    const adminStore = useAdminStore();
    const oauthStore = useOauthStore();

    const showExplanation = ref<boolean>(false);
    const smurfResults = ref<SmurfDetectionResult>();
    const generateExplanation = ref<boolean>(false);
    const searchDepth = ref<number>(1);
    const selectedIdentifierType = ref<string>("battleTag");
    const availableIdentifierTypes = ref<string[]>(["battleTag"]);
    const loadingModerationStatus = ref<boolean>(false);
    const selectedPlayer = ref<string>("");

    type PlayerSearchType = InstanceType<typeof PlayerSearch>;
    const playerSearchRef = useTemplateRef<PlayerSearchType>("playerSearchComponent");

    const permissions = computed<string[]>(() => oauthStore.permissions);
    const canSeeSmurfCheckerQueryExplanation = computed(() => permissions.value.includes(EPermission[EPermission.SmurfCheckerQueryExplanation]));
    const hasModerationPermission = computed(() => permissions.value.includes(EPermission[EPermission.Moderation]));

    function goToProfile(alt: string): void {
      router.push({
        path: getProfileUrl(alt),
      }).catch(() => null);
    }

    function totalLogins(list: BattleTagLoginCount[]): number {
      return list.reduce((acc, curr) => acc + curr.numberOfLogins, 0);
    }

    function searchSmurfsFromClick(bTag: string) {
      selectedPlayer.value = bTag;
      executeSearch();

      if (playerSearchRef.value) {
        playerSearchRef.value.selected = bTag;
      }
    }

    async function executeSearch(): Promise<void> {
      if (!selectedPlayer.value) return;
      if (selectedIdentifierType.value != "battleTag") return; // Only battle tags are searchable

      smurfResults.value = await adminStore.querySmurfsForIdentifier(selectedIdentifierType.value, selectedPlayer.value, searchDepth.value, generateExplanation.value);

      if ((smurfResults.value != null || undefined) && smurfResults.value.connectedBattleTags.length > 0) {
        // Load moderation data if user has permission
        if (hasModerationPermission.value) {
          loadingModerationStatus.value = true;
          try {
            await adminStore.loadModerationStatusForBattleTags(smurfResults.value.connectedBattleTags);
          } finally {
            loadingModerationStatus.value = false;
          }
        }
      }
    }

    onMounted(async () => {
      availableIdentifierTypes.value = await adminStore.getSmurfIdentifierTypes();
    });

    function playerFound(bTag: string): void {
      selectedPlayer.value = bTag;
    }

    function searchCleared(): void {
      selectedPlayer.value = "";
      smurfResults.value = undefined;
    }

    return {
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
      hasModerationPermission,
      loadingModerationStatus,
      playerFound,
      searchCleared,
      selectedPlayer,
    };
  },
});
</script>
