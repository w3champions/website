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

    <v-card v-if="true">
      <!-- showPlayersPortraits -->
      <v-container>
        <v-row class="justify-center align-center mb-1">
          <v-card-title>Portraits for {{ bnetTag }}:</v-card-title>
        </v-row>
        <v-divider />

        <!-- Currently Assigned -->
        <v-col class="mt-2 mb-2">
          <v-row>
            <v-card-title class="justify-center">
              Currently Assigned
            </v-card-title>
          </v-row>

          <v-row v-if="hasSpecialPortraits" no-gutters :justify="'start'">
            <v-col
              v-for="portraitId in searchedPlayerPortraits"
              :key="portraitId"
              cols="2"
              md="1"
            >
              <assign-portrait
                :portraitId="portraitId"
                class="pa-1"
              ></assign-portrait>
            </v-col>
          </v-row>
          <v-row v-else class="ma-2 pa-2">
            <v-card-subtitle class="justify-center">
              No special portraits found for this player.
            </v-card-subtitle>
          </v-row>
        </v-col>
        <v-divider />

        <!-- To Be Assigned -->
        <v-col class="mt-2 mb-2">
          <v-row>
            <v-card-title class="justify-center">To Be Assigned</v-card-title>
          </v-row>
          <v-row no-gutters :justify="'start'">
            <v-col
              align-self="stretch"
              v-for="portraitId in assignedPortraitsModel"
              :key="portraitId"
              cols="2"
              md="1"
            >
              <assign-portrait
                :portraitId="portraitId"
                :isAssigned="true"
                @remove-assigned-portrait="removeAssignedPortrait"
                class="pa-1"
              ></assign-portrait>
            </v-col>
          </v-row>

          <v-row v-if="assignmentsChanged" class="justify-center">
            <v-dialog
              v-model="assignDialog"
              transition="dialog-bottom-transition"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  x-large
                  v-bind="attrs"
                  v-on="on"
                  class="primary ma-3 pa-3"
                >
                  Assign
                </v-btn>
              </template>

              <!-- Confirmation dialog -->
              <template v-slot:default="assignDialog">
                <v-card>
                  <v-card-title>Confirm Portrait Assignments</v-card-title>
                  <v-card-actions class="justify-center">
                    <v-btn text @click="assignDialog.value = false">Close</v-btn>
                  </v-card-actions>
                </v-card>
              </template>
            </v-dialog>
          </v-row>
        </v-col>
        <v-divider />

        <!-- Available -->
        <v-col>
          <v-card-title class="justify-center">Available</v-card-title>
          <v-row no-gutters :justify="'start'">
            <v-col
              v-for="portraitId in allSpecialPortraits"
              :key="portraitId"
              cols="1"
            >
              <assign-portrait
                :portraitId="portraitId"
                @add-available-portrait="assignPortrait"
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
import { SearchedPlayer } from "@/store/admin/types";
import _ from "lodash";
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
  assignDialog = false;

  // TODO - on dialog activate -> figure out the diff between current + to-be assigned lists
  // TODO - ARE YOU SURE? dialog
  // TODO - service method to send to backend


  get bnetTag() {
    return "Cepheid#1467";
    //return this.searchPlayerPortraitsModel.player.playerIds[0].battleTag;
  }

  get searchedPlayerPortraits(): number[] {
    //return this.$store.direct.state.admin.searchedPlayerSpecialPortraits;
    return [
      10004, 10005,
    ];
  }

  get hasSpecialPortraits(): boolean {
    return this.searchedPlayerPortraits.length > 0;
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

  removeAssignedPortrait(portraitId: number): void {
    this.assignedPortraitsModel = this.assignedPortraitsModel.filter(x => x != portraitId);
    this.assignedPortraitsModel.sort((a, b) => a - b);
  }

  assignPortrait(portraitId: number): void {
    if (!this.assignedPortraitsModel.includes(portraitId)) {
      this.assignedPortraitsModel.push(portraitId);
    }
    this.assignedPortraitsModel.sort((a, b) => a - b);
    this.assignedPortraitsModel = Object.create(this.assignedPortraitsModel); // force change detection
  }

  @Watch("searchPlayerPortraitsModel")
  public async onSearchStringChanged(
    searchedPlayer: SearchedPlayer
  ): Promise<void> {
    if (!searchedPlayer) return;

    if (searchedPlayer) {
      let btag = searchedPlayer.player.playerIds[0].battleTag;

      this.playerPortraits =
        await this.$store.direct.dispatch.admin.loadSpecialPortraitsForPlayer(
          btag
        );

      if (
        (this.playerPortraits != null || undefined) &&
        this.playerPortraits.length > 0
      ) {
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
    this.playerPortraits = [];
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  private async init(): Promise<void> {
    await this.$store.direct.dispatch.admin.loadAllSpecialPortraits();
    this.assignedPortraitsModel = Object.create(this.searchedPlayerPortraits);
    this.allSpecialPortraits = Object.create(
      this.$store.direct.state.admin.allSpecialPortraits
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
