<template>
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
            <v-card-title class="justify-left pl=0 ml-0">Portraits for {{ bTag }}</v-card-title>
          </v-col>
          <v-col>
            <v-row v-if="assignmentsChanged" class="justify-end">
              <v-dialog v-model="assignDialogOpen" transition="fade-transition" max-width="1000">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn x-large v-bind="attrs" v-on="on" class="primary w3-race-bg--text">Assign</v-btn>
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
                            <strong>{{ bTag }}:</strong>
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
                            <strong>{{ bTag }}:</strong>
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
                            <v-btn class="primary w3-race-bg--text" x-large @click="confirmDialog">Confirm</v-btn>
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
</template>

<script lang="ts">
import { ChangePortraitsCommand } from "@/store/admin/types";
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import AssignPortrait from "./portraits/AssignPortrait.vue";
import PortraitGroupDropdown from "./portraits/PortraitGroupDropdown.vue";
import AvailablePortraitsGallery from "./portraits/AvailablePortraitsGallery.vue";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { mdiClose } from "@mdi/js";

@Component({ components: { AssignPortrait, PortraitGroupDropdown, AvailablePortraitsGallery, PlayerSearch } })
export default class AdminAssignPortraits extends Vue {
  private oauthStore = useOauthStore();
  playerPortraits = [] as number[];
  showPlayersPortraits = false;
  assignedPortraitsModel = [] as number[];
  allSpecialPortraits = [] as number[];
  assignDialogOpen = false;
  confirmAddedPortraits = [] as number[];
  confirmRemovedPortraits = [] as number[];
  mouseoverText = "";
  foundPlayer = "";
  public mdiClose = mdiClose;
  private playerManagement = usePlayerManagementStore();

  get rules(): { required: (value: string) => string | boolean; min: (text: string) => string | boolean } {
    return {
      required: (value: string) => !!value || "Required",
      min: (text: string) => text.length >= 3 || "Min 3 characters",
    };
  }

  get bTag(): string {
    return this.foundPlayer;
  }

  get searchedPlayerPortraits(): number[] {
    return this.playerManagement.searchedPlayerSpecialPortraits;
  }

  get hasSpecialPortraits(): boolean {
    return this.searchedPlayerPortraits != null && this.searchedPlayerPortraits.length > 0;
  }

  get hasSpecialPortraitsAssigned(): boolean {
    return this.assignedPortraitsModel.length > 0;
  }

  get assignmentsChanged(): boolean {
    const assignedSorted = this.assignedPortraitsModel.slice().sort();
    const searchedSorted = this.searchedPlayerPortraits.slice().sort();
    if (
      assignedSorted.length === searchedSorted.length &&
      assignedSorted.every((value, index) => {
        return value === searchedSorted[index];
      })
    ) {
      return false;
    }
    return true;
  }

  async confirmDialog(): Promise<void> {
    if (this.confirmAddedPortraits.length > 0) {
      const battleTags = [] as string[];
      battleTags.push(this.foundPlayer);

      const command = {
        battleTags: battleTags,
        portraitIds: this.confirmAddedPortraits,
        mouseover: this.mouseoverText || "",
      } as ChangePortraitsCommand;

      await this.playerManagement.addPortraits(command);
    }
    if (this.confirmRemovedPortraits.length > 0) {
      const battleTags = [] as string[];
      battleTags.push(this.foundPlayer);

      const command = {
        battleTags: battleTags,
        portraitIds: this.confirmRemovedPortraits,
      } as ChangePortraitsCommand;

      await this.playerManagement.removePortraits(command);
    }
    await this.init();
    this.assignDialogOpen = false;
  }

  removeAssignedPortrait(portraitId: number): void {
    this.assignedPortraitsModel = this.assignedPortraitsModel.filter((x) => x != portraitId);
    this.assignedPortraitsModel.sort((a, b) => a - b);
  }

  assignThisPortrait(portraitId: number): void {
    if (!this.assignedPortraitsModel.includes(portraitId)) {
      this.assignedPortraitsModel.push(portraitId);
    }
    this.assignedPortraitsModel.sort((a, b) => a - b);
    this.assignedPortraitsModel = Object.create(this.assignedPortraitsModel); // force change detection
  }

  assignGroupPortraits(portraits: number[]): void {
    portraits.forEach((x) => {
      if (this.allSpecialPortraits.includes(x) && !this.assignedPortraitsModel.includes(x)) {
        this.assignedPortraitsModel.push(x);
      }
    });
    this.assignedPortraitsModel.sort((a, b) => a - b);
    this.assignedPortraitsModel = Object.create(this.assignedPortraitsModel); // force change detection
  }

  @Watch("assignDialogOpen")
  public async updateConfirmedAssignments(): Promise<void> {
    this.confirmAddedPortraits = this.assignedPortraitsModel.filter((x) => !this.searchedPlayerPortraits.includes(x));
    this.confirmRemovedPortraits = this.searchedPlayerPortraits.filter((x) => !this.assignedPortraitsModel.includes(x));
  }

  async playerFound(bTag: string): Promise<void> {
    await this.playerManagement.loadSpecialPortraitsForPlayer(bTag);
    const playerPortraits = this.playerManagement.searchedPlayerSpecialPortraits;
    this.assignedPortraitsModel = Object.create(playerPortraits);

    if (playerPortraits) {
      this.showPlayersPortraits = true;
    }
    this.foundPlayer = bTag;
  }

  searchCleared() {
    this.showPlayersPortraits = false;
    this.foundPlayer = "";
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  private async init(): Promise<void> {
    await this.playerManagement.loadAllSpecialPortraits();
    const managedPlayer = this.playerManagement.managedBattleTag;
    if (managedPlayer) {
      await this.playerManagement.loadSpecialPortraitsForPlayer(managedPlayer);
    }
    this.assignedPortraitsModel = Object.create(this.searchedPlayerPortraits);
    this.allSpecialPortraits = Object.create(
      this.playerManagement.allSpecialPortraits
        .map((x) => parseInt(x.id))
        .sort((a, b) => b - a)
    );
  }

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
