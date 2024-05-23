<template>
  <div>
    <v-card-title>
      Assign Portraits
    </v-card-title>
    <v-container>
      <player-search
        @searchCleared="searchCleared"
        @playerFound="playerFound"
        classes="ml-5 mr-5"
      ></player-search>

      <v-card v-if="showPlayersPortraits">
        <v-container>
          <v-row class="justify-center align-center ma-1 mt-0">
            <v-col class="ml-0 pl-0">
              <v-card-title class="justify-left pl=0 ml-0">Portraits for {{ foundPlayer }}</v-card-title>
            </v-col>
            <v-col>
              <v-row v-if="assignmentsChanged" class="justify-end">
                <v-dialog v-model="assignDialogOpen" transition="fade-transition" max-width="1000">
                  <template v-slot:activator="{ props }">
                    <v-btn size="x-large" v-bind="props" class="bg-primary w3-race-bg--text">Assign</v-btn>
                  </template>

                  <!-- Confirmation dialog -->
                  <template>
                    <v-card>
                      <v-container>
                        <v-row>
                          <v-col>
                            <v-card-title class="justify-center">Confirm Portrait Assignments</v-card-title>
                          </v-col>

                          <v-btn icon @click="assignDialogOpen = false">
                            <v-icon>{{ mdiClose }}</v-icon>
                          </v-btn>
                        </v-row>

                        <!-- The following portraits will be ADDED: -->
                        <v-row v-if="confirmAddedPortraits.length > 0">
                          <v-container>
                            <v-card-subtitle class="text-h6">
                              The following portraits will be
                              <strong>ADDED</strong>
                              for
                              <strong>{{ foundPlayer }}:</strong>
                            </v-card-subtitle>
                            <v-card-actions>
                              <v-row no-gutters>
                                <v-col v-for="portraitId in confirmAddedPortraits" :key="portraitId" cols="1">
                                  <assign-portrait :portraitId="portraitId" class="pa-1"></assign-portrait>
                                </v-col>
                              </v-row>
                            </v-card-actions>
                            <v-card-actions>
                              <v-row class="ma-1 pa-1">
                                <v-text-field
                                  v-model="mouseoverText"
                                  :rules="[rules.required, rules.min]"
                                  label="Mouseover tooltip"
                                ></v-text-field>
                                <v-spacer />
                              </v-row>
                            </v-card-actions>
                          </v-container>
                        </v-row>

                        <!-- The following portraits will be REMOVED: -->
                        <v-row v-if="confirmRemovedPortraits.length > 0">
                          <v-container>
                            <v-card-subtitle class="text-h6">
                              The following portraits will be
                              <strong>REMOVED</strong>
                              for
                              <strong>{{ foundPlayer }}:</strong>
                            </v-card-subtitle>
                            <v-card-actions>
                              <v-row no-gutters>
                                <v-col v-for="portraitId in confirmRemovedPortraits" :key="portraitId" cols="1">
                                  <assign-portrait :portraitId="portraitId" class="pa-1"></assign-portrait>
                                </v-col>
                              </v-row>
                            </v-card-actions>
                          </v-container>
                        </v-row>

                        <v-row>
                          <v-spacer />
                          <v-container>
                            <v-card-actions class="justify-end">
                              <v-btn class="bg-primary w3-race-bg--text" size="x-large" @click="confirmDialog">Confirm</v-btn>
                            </v-card-actions>
                          </v-container>
                        </v-row>
                      </v-container>
                    </v-card>
                  </template>
                </v-dialog>
              </v-row>
            </v-col>
          </v-row>
          <v-divider />

          <!-- To Be Assigned -->
          <v-col class="mt-2 mb-2">
            <v-row>
              <v-col></v-col>
              <v-col>
                <v-card-title class="justify-center">To Be Assigned</v-card-title>
              </v-col>
              <v-col>
                <v-spacer />
                <portrait-group-dropdown
                  class="d-flex justify-end"
                  @add-group-of-portraits="assignGroupPortraits"
                ></portrait-group-dropdown>
              </v-col>
            </v-row>

            <v-row v-if="hasSpecialPortraitsAssigned" no-gutters :justify="'start'">
              <v-col align-self="stretch" v-for="portraitId in assignedPortraitsModel" :key="portraitId" cols="2" md="1">
                <assign-portrait
                  :portraitId="portraitId"
                  :isAssigned="true"
                  @portrait-deselected="removeAssignedPortrait"
                  class="pa-1"
                ></assign-portrait>
              </v-col>
            </v-row>
            <v-row v-else class="ma-2 pa-2">
              <v-card-subtitle class="justify-center">No special portraits assigned for this player.</v-card-subtitle>
            </v-row>
          </v-col>
          <v-divider />

          <!-- Currently Assigned -->
          <v-col class="mt-2 mb-2">
            <v-card-title class="justify-center">Currently Assigned</v-card-title>

            <v-row v-if="hasSpecialPortraits" no-gutters :justify="'start'">
              <v-col v-for="portraitId in searchedPlayerPortraits" :key="portraitId" cols="2" md="1">
                <assign-portrait :portraitId="portraitId" class="pa-1"></assign-portrait>
              </v-col>
            </v-row>
            <v-row v-else class="ma-2 pa-2">
              <v-card-subtitle class="justify-center">No special portraits found for this player.</v-card-subtitle>
            </v-row>
          </v-col>
          <v-divider />

          <!-- Available -->
          <available-portraits-gallery
            :selectable="true"
            @portrait-selected="assignThisPortrait"
          ></available-portraits-gallery>
        </v-container>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, ref, watch } from "vue";
import { ChangePortraitsCommand } from "@/store/admin/types";
import AssignPortrait from "./portraits/AssignPortrait.vue";
import PortraitGroupDropdown from "./portraits/PortraitGroupDropdown.vue";
import AvailablePortraitsGallery from "./portraits/AvailablePortraitsGallery.vue";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { mdiClose } from "@mdi/js";

type AdminAssignPortraitsRules = {
  required: (value: string) => string | boolean;
  min: (text: string) => string | boolean;
};

export default defineComponent({
  name: "AdminAssignPortraits",
  components: {
    AssignPortrait,
    PortraitGroupDropdown,
    AvailablePortraitsGallery,
    PlayerSearch,
  },
  setup() {
    const oauthStore = useOauthStore();
    const playerManagement = usePlayerManagementStore();

    const showPlayersPortraits = ref<boolean>(false);
    const assignedPortraitsModel = ref<number[]>([]);
    const allSpecialPortraits = ref<number[]>([]);
    const assignDialogOpen = ref<boolean>(false);
    const confirmAddedPortraits = ref<number[]>([]);
    const confirmRemovedPortraits = ref<number[]>([]);
    const mouseoverText = ref<string>("");
    const foundPlayer = ref<string>("");

    const searchedPlayerPortraits: ComputedRef<number[]> = computed((): number[] => playerManagement.searchedPlayerSpecialPortraits);
    const hasSpecialPortraits: ComputedRef<boolean> = computed((): boolean => searchedPlayerPortraits.value != null && searchedPlayerPortraits.value.length > 0);
    const hasSpecialPortraitsAssigned: ComputedRef<boolean> = computed((): boolean => assignedPortraitsModel.value.length > 0);
    const isAdmin: ComputedRef<boolean> = computed((): boolean => oauthStore.isAdmin);

    const rules: ComputedRef<AdminAssignPortraitsRules> = computed((): AdminAssignPortraitsRules => {
      return {
        required: (value: string) => !!value || "Required",
        min: (text: string) => text.length >= 3 || "Min 3 characters",
      };
    });

    const assignmentsChanged: ComputedRef<boolean> = computed((): boolean => {
      const assignedSorted = assignedPortraitsModel.value.slice().sort();
      const searchedSorted = searchedPlayerPortraits.value.slice().sort();
      if (
        assignedSorted.length === searchedSorted.length &&
        assignedSorted.every((value, index) => {
          return value === searchedSorted[index];
        })
      ) {
        return false;
      }
      return true;
    });

    async function confirmDialog(): Promise<void> {
      if (confirmAddedPortraits.value.length > 0) {
        const battleTags = [] as string[];
        battleTags.push(foundPlayer.value);

        const command = {
          battleTags: battleTags,
          portraitIds: confirmAddedPortraits.value,
          mouseover: mouseoverText.value || "",
        } as ChangePortraitsCommand;

        await playerManagement.addPortraits(command);
      }
      if (confirmRemovedPortraits.value.length > 0) {
        const battleTags = [] as string[];
        battleTags.push(foundPlayer.value);

        const command = {
          battleTags: battleTags,
          portraitIds: confirmRemovedPortraits.value,
        } as ChangePortraitsCommand;

        await playerManagement.removePortraits(command);
      }
      await init();
      assignDialogOpen.value = false;
    }

    function removeAssignedPortrait(portraitId: number): void {
      assignedPortraitsModel.value = assignedPortraitsModel.value.filter((x) => x != portraitId);
      assignedPortraitsModel.value.sort((a, b) => a - b);
    }

    function assignThisPortrait(portraitId: number): void {
      if (!assignedPortraitsModel.value.includes(portraitId)) {
        assignedPortraitsModel.value.push(portraitId);
      }
      assignedPortraitsModel.value.sort((a, b) => a - b);
      assignedPortraitsModel.value = Object.create(assignedPortraitsModel.value); // force change detection
    }

    function assignGroupPortraits(portraits: number[]): void {
      portraits.forEach((x) => {
        if (allSpecialPortraits.value.includes(x) && !assignedPortraitsModel.value.includes(x)) {
          assignedPortraitsModel.value.push(x);
        }
      });
      assignedPortraitsModel.value.sort((a, b) => a - b);
      assignedPortraitsModel.value = Object.create(assignedPortraitsModel.value); // force change detection
    }

    watch(assignDialogOpen, updateConfirmedAssignments);
    async function updateConfirmedAssignments(): Promise<void> {
      confirmAddedPortraits.value = assignedPortraitsModel.value.filter((x) => !searchedPlayerPortraits.value.includes(x));
      confirmRemovedPortraits.value = searchedPlayerPortraits.value.filter((x) => !assignedPortraitsModel.value.includes(x));
    }

    async function playerFound(bTag: string): Promise<void> {
      await playerManagement.loadSpecialPortraitsForPlayer(bTag);
      const playerPortraits = playerManagement.searchedPlayerSpecialPortraits;
      assignedPortraitsModel.value = Object.create(playerPortraits);

      if (playerPortraits) {
        showPlayersPortraits.value = true;
      }
      foundPlayer.value = bTag;
    }

    function searchCleared() {
      showPlayersPortraits.value = false;
      foundPlayer.value = "";
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await playerManagement.loadAllSpecialPortraits();
      const managedPlayer = playerManagement.managedBattleTag;
      if (managedPlayer) {
        await playerManagement.loadSpecialPortraitsForPlayer(managedPlayer);
      }
      assignedPortraitsModel.value = Object.create(searchedPlayerPortraits.value);
      allSpecialPortraits.value = Object.create(
        playerManagement.allSpecialPortraits
          .map((x) => parseInt(x.id))
          .sort((a, b) => b - a)
      );
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      mdiClose,
      searchCleared,
      playerFound,
      showPlayersPortraits,
      assignmentsChanged,
      assignDialogOpen,
      confirmAddedPortraits,
      foundPlayer,
      mouseoverText,
      rules,
      confirmRemovedPortraits,
      confirmDialog,
      assignGroupPortraits,
      hasSpecialPortraitsAssigned,
      assignedPortraitsModel,
      removeAssignedPortrait,
      hasSpecialPortraits,
      searchedPlayerPortraits,
      assignThisPortrait,
    };
  },
});
</script>
