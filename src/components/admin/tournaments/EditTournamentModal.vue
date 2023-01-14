<template>
  <v-card class="edit-tournament-modal">
    <v-card-title>
      <span class="headline">{{ isEdit ? "Edit" : "Create" }} Tournament</span>
    </v-card-title>
    <v-card-text>
      <v-tabs v-model="tabsModel">
        <v-tabs-slider></v-tabs-slider>
        <v-tab>General</v-tab>
        <v-tab>Advanced</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tabsModel">
        <v-tab-item :transition="false">
          <v-select
            :items="gateways"
            v-model="gateway"
            item-text="name"
            item-value="id"
            label="Gateway"
            hide-details
            single-line
          />
          <v-text-field
            v-model="name"
            label="Name"
            hide-details
            single-line
          />
          <v-datetime-picker
            label="Date / Time (UTC)"
            v-model="startDateTime"
            :textFieldProps="{ 'single-line': true, 'hide-details': true }"
          />
          <v-select
            v-if="isEdit"
            :items="states"
            v-model="state"
            item-text="name"
            item-value="id"
            label="State"
            hide-details
            single-line
          />
          <div class="mt-4">
            Map Pool
          </div>
          <v-row class="mt-0 mb-0">
            <v-col cols="4" class="py-0" v-for="map in mapOptions" v-bind:key="map.id">
              <v-checkbox
                :multiple="true"
                v-model="mapPool"
                :label="map.name"
                :value="map.id"
                :dense="true"
                hide-details
              />
            </v-col>
          </v-row>
        </v-tab-item>
        <v-tab-item :transition="false">
          <v-row class="mt-0">
            <v-col cols="4">
              <v-text-field
                v-model="registrationTimeMinutes"
                label="Registration Time (mins)"
                hide-details
                type="number"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="readyTimeSeconds"
                label="Ready Time (s)"
                hide-details
                type="number"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="vetoTimeSeconds"
                label="Veto Time (s)"
                hide-details
                type="number"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <v-text-field
                v-model="showWinnerTimeHours"
                label="Show Winner Time (hrs)"
                hide-details
                type="number"
              />
            </v-col>
            <v-col cols="8">
              <v-text-field
                v-model="matcherinoUrl"
                label="Matcherino URL"
                hide-details
              />
            </v-col>
          </v-row>
          <v-select
            :items="gameModes"
            :disabled="true"
            v-model="mode"
            item-text="name"
            item-value="id"
            label="Game Mode"
            hide-details
            single-line
          />
          <v-select
            :items="formats"
            :disabled="true"
            v-model="format"
            item-text="name"
            item-value="id"
            label="Format"
            hide-details
            single-line
          />
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>
    <v-card-actions class="pt-0 pb-2">
      <v-spacer />
      <v-btn text @click="cancel">
        {{ $t(`views_admin.cancel`) }}
      </v-btn>
      <v-btn color="primary" class="w3-race-bg--text" @click="save" :disabled="saving || !formValid">
        {{ $t(`views_admin.save`) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { addDays, setHours, startOfHour } from "date-fns";
import _ from "lodash";
import { ETournamentFormat, ETournamentState, ITournament } from "@/store/tournaments/types";
import { EGameMode } from "@/store/typings";
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import { EGatewayLabel, EGameModeLabel, ETournamentFormatLabel } from "@/helpers/tournaments";
import { Gateways } from "@/store/ranking/types";
import { Map } from "@/store/admin/maps/types";

@Component({})
export default class AddPlayerModal extends Vue {
  @Prop() public tournament!: ITournament;
  @Prop() public saving!: boolean;
  @Prop() public maps!: Map[];

  public name = "Standard One vs One Tournament";
  public gateway = Gateways.Europe;
  public startDateTime = startOfHour(setHours(addDays(new Date(), 1), 20));
  public mode = EGameMode.GM_1ON1;
  public format = ETournamentFormat.SINGLE_ELIM;
  public mapPool: number[] = [];
  public state = ETournamentState.INIT;
  public registrationTimeMinutes = 5;
  public readyTimeSeconds = 180;
  public vetoTimeSeconds = 45;
  public showWinnerTimeHours = 24;
  public matcherinoUrl = "";

  public tabsModel = {};

  mounted() {
    this.init();
  }

  private init() {
    if (!this.tournament) {
      this.mapPool = this.maps.slice(0, 5).map(m => m.id);
      return;
    }
    this.name = this.tournament.name;
    this.gateway = this.tournament.gateway;
    this.startDateTime = this.tournament.startDateTime;
    this.mode = this.tournament.mode;
    this.format = this.tournament.format;
    this.mapPool = this.tournament.mapPool;
    this.state = this.tournament.state;
    this.registrationTimeMinutes = this.tournament.registrationTimeMinutes;
    this.readyTimeSeconds = this.tournament.readyTimeSeconds;
    this.vetoTimeSeconds = this.tournament.vetoTimeSeconds;
    this.showWinnerTimeHours = this.tournament.showWinnerTimeHours;
    this.matcherinoUrl = this.tournament.matcherinoUrl ?? "";
  }

  get isEdit() {
    return !!this.tournament;
  }

  get formValid() {
    if (this.mapPool.length < 3) {
      return false;
    }
    return true;
  }

  public cancel() {
    this.$emit("cancel");
  }

  public save() {
    const fieldNames = [
      "name", "gateway", "startDateTime", "mode", "format", "mapPool", "state",
      "registrationTimeMinutes", "readyTimeSeconds", "vetoTimeSeconds",
      "showWinnerTimeHours", "matcherinoUrl",
    ];
    const tournamentData = _.pick(this, fieldNames);
    this.$emit("save", tournamentData);
  }

  get gateways() {
    return this.getSelectOptions(EGatewayLabel);
  }

  get states() {
    const validStates = _.pickBy(ETournamentState, (_value, key) => {
      return !isNaN(key as any);
    }) as { [key: number]: string };
    return this.getSelectOptions(validStates);
  }

  get gameModes() {
    return this.getSelectOptions(EGameModeLabel);
  }

  get formats() {
    return this.getSelectOptions(ETournamentFormatLabel).slice(0, 1);
  }

  get mapOptions() {
    return this.maps;
  }

  private getSelectOptions(labelMap: { [key: number]: string }) {
    return _.map(labelMap, (name, id) => ({
      id: +id,
      name,
    }));
  }
}
</script>
