<template>
  <v-container>
    <!-- Autocomplete Btag search -->
    <v-autocomplete
      class="ml-5 mr-5"
      v-model="searchPlayerPortraitsModel"
      append-icon="mdi-magnify"
      label="Search BattleNet Tag"
      clearable
      placeholder=" "
      :items="searchedPlayers"
      :search-input.sync="search"
      item-text="player.playerIds[0].battleTag"
      item-value="player.playerIds[0].id"
      return-object
      @click:clear="revertToDefault"
    ></v-autocomplete>

    <v-card v-if="showPlayersPortraits">
      <v-container>
        <v-row class="justify-center align-center ma-1 mt-0">
          <v-col class="ml-0 pl-0">
            <v-card-title class="justify-left pl=0 ml-0">Portraits for {{ bnetTag }}</v-card-title>
          </v-col>
          <v-col>
            <v-row v-if="assignmentsChanged" class="justify-end">
              <v-dialog v-model="assignDialogOpen" transition="fade-transition" max-width="1000">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn x-large v-bind="attrs" v-on="on" class="primary">Assign</v-btn>
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
                          <v-icon>mdi-close</v-icon>
                        </v-btn>
                      </v-row>

                      <!-- The following portraits will be ADDED: -->
                      <v-row v-if="confirmAddedPortraits.length > 0">
                        <v-container>
                          <v-card-subtitle class="text-h6">
                            The following portraits will be
                            <strong>ADDED:</strong>
                          </v-card-subtitle>
                          <v-card-actions>
                            <v-row no-gutters>
                              <v-col v-for="portraitId in confirmAddedPortraits" :key="portraitId" cols="1">
                                <assign-portrait
                                  :portraitId="portraitId"
                                  :isAssigned="false"
                                  :isInert="true"
                                  class="pa-1"
                                ></assign-portrait>
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
                            <strong>REMOVED:</strong>
                          </v-card-subtitle>
                          <v-card-actions>
                            <v-row no-gutters>
                              <v-col v-for="portraitId in confirmRemovedPortraits" :key="portraitId" cols="1">
                                <assign-portrait
                                  :portraitId="portraitId"
                                  :isAssigned="false"
                                  :isInert="true"
                                  class="pa-1"
                                ></assign-portrait>
                              </v-col>
                            </v-row>
                          </v-card-actions>
                        </v-container>
                      </v-row>
                      <v-row>
                        <v-spacer />
                        <v-container>
                          <v-card-actions class="justify-end">
                            <v-btn class="primary" x-large @click="confirmDialog">Confirm</v-btn>
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

        <!-- To Be Assigned -->
        <v-col class="mt-2 mb-2">
          <v-card-title class="justify-center">To Be Assigned</v-card-title>

          <v-row v-if="hasSpecialPortraitsAssigned" no-gutters :justify="'start'">
            <v-col align-self="stretch" v-for="portraitId in assignedPortraitsModel" :key="portraitId" cols="2" md="1">
              <assign-portrait
                :portraitId="portraitId"
                :isAssigned="true"
                @remove-assigned-portrait="removeAssignedPortrait"
                class="pa-1"
              ></assign-portrait>
            </v-col>
          </v-row>
          <v-row v-else class="ma-2 pa-2">
            <v-card-subtitle class="justify-center">No special portraits assigned for this player.</v-card-subtitle>
          </v-row>
        </v-col>
        <v-divider />

        <!-- Available -->
        <v-col>
          <v-card-title class="justify-center">Available</v-card-title>
          <v-row no-gutters :justify="'start'">
            <v-col v-for="portraitId in allSpecialPortraits" :key="portraitId" cols="1">
              <assign-portrait
                :portraitId="portraitId"
                @add-available-portrait="assignThisPortrait"
                class="pa-1"
              ></assign-portrait>
            </v-col>
          </v-row>
        </v-col>
      </v-container>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { SearchedPlayer, ChangePortraitsCommand  } from "@/store/admin/types";
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import AssignPortrait from "./portraits/AssignPortrait.vue";

@Component({ components: { AssignPortrait } })
export default class AdminAssignPortraits extends Vue {
  searchPlayerPortraitsModel = {} as SearchedPlayer;
  playerPortraits = [] as number[];
  search = "";
  oldSearchTerm = "";
  showPlayersPortraits = false;
  assignedPortraitsModel = [] as number[];
  allSpecialPortraits = [] as number[];
  assignDialogOpen = false;
  confirmAddedPortraits = [] as number[];
  confirmRemovedPortraits = [] as number[];
  mouseoverText = "";

  get rules(): unknown {
    return {
      required: (value: string | unknown[]) => !!value || "Required",
      min: (text: string | unknown[]) => text.length >= 3 || "Min 3 characters",
    };
  }

  get bnetTag() {
    return this.searchPlayerPortraitsModel.player.playerIds[0].battleTag;
  }

  get searchedPlayerPortraits(): number[] {
    return this.$store.direct.state.admin.playerManagement.searchedPlayerSpecialPortraits;
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
      await this.$store.direct.dispatch.admin.playerManagement.addPortraits({
        battleTag: this.searchPlayerPortraitsModel.player.playerIds[0].battleTag,
        portraitIds: this.confirmAddedPortraits,
        mouseover: this.mouseoverText,
      } as ChangePortraitsCommand);
    }
    if (this.confirmRemovedPortraits.length > 0) {
      await this.$store.direct.dispatch.admin.playerManagement.removePortraits({
        battleTag: this.searchPlayerPortraitsModel.player.playerIds[0].battleTag,
        portraitIds: this.confirmAddedPortraits,
      } as ChangePortraitsCommand);
    }
    await this.init();
    this.assignDialogOpen = false;
  }

  updateAddAndRemoved(): void {
    console.log("Worked!");
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

  @Watch("assignDialogOpen")
  public async updateConfirmedAssignments(): Promise<void> {
    this.confirmAddedPortraits = this.assignedPortraitsModel.filter((x) => !this.searchedPlayerPortraits.includes(x));
    this.confirmRemovedPortraits = this.searchedPlayerPortraits.filter((x) => !this.assignedPortraitsModel.includes(x));
  }

  @Watch("searchPlayerPortraitsModel")
  public async onSearchStringChanged(searchedPlayer: SearchedPlayer): Promise<void> {
    if (!searchedPlayer) return;

    if (searchedPlayer) {
      let btag = searchedPlayer.player.playerIds[0].battleTag;

      await this.$store.direct.dispatch.admin.playerManagement.loadSpecialPortraitsForPlayer(btag);
      const playerPortraits = this.$store.direct.state.admin.playerManagement.searchedPlayerSpecialPortraits;
      this.assignedPortraitsModel = Object.create(playerPortraits);

      if ((playerPortraits != null || undefined) && playerPortraits.length > 0) {
        this.showPlayersPortraits = true;
      } else {
        this.revertToDefault();
      }
    }
  }

  @Watch("search") public onSearchChanged(newValue: string): void {
    if (newValue && newValue.length > 2 && newValue >= this.oldSearchTerm) {
      this.$store.direct.dispatch.admin.searchBnetTag({
        searchText: newValue.toLowerCase(),
      });
      this.oldSearchTerm = newValue;
    } else {
      this.revertToDefault();
    }
  }

  get searchedPlayers(): SearchedPlayer[] {
    return this.$store.direct.state.admin.searchedPlayers;
  }

  public revertToDefault(): void {
    this.showPlayersPortraits = false;
    this.oldSearchTerm = "";
    this.$store.direct.dispatch.admin.clearSearch();
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  private async init(): Promise<void> {
    await this.$store.direct.dispatch.admin.playerManagement.loadAllSpecialPortraits();
    this.assignedPortraitsModel = Object.create(this.searchedPlayerPortraits);
    this.allSpecialPortraits = Object.create(
      this.$store.direct.state.admin.playerManagement.allSpecialPortraits
        .map((x) => parseInt(x.id))
        .sort((a, b) => b - a)
    );
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
