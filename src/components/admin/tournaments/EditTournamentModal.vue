<template>
  <v-card class="edit-tournament-modal">
    <v-card-title>
      <span class="headline">{{isEdit ? 'Edit' : 'Create'}} Tournament</span>
    </v-card-title>
    <v-card-text>
      <v-select
        :items="gateways"
        v-model="gateway"
        item-text="name"
        item-value="id"
        label="Gateway"
      />
      <v-text-field v-model="name" label="Name"></v-text-field>
      <v-datetime-picker
        label="Date / Time (UTC)"
        v-model="startDateTime"
      />
      <v-select
        v-if="isEdit"
        :items="states"
        v-model="state"
        item-text="name"
        item-value="id"
        label="State"
      />
      <div>
        Map Pool
      </div>
      <v-row class="mt-0 mb-3">
        <v-col cols="4" class="py-0" v-for="map in maps" v-bind:key="map.id">
          <v-checkbox
            :multiple="true"
            v-model="mapPool"
            :label="map.name"
            :value="map.id"
            :dense="true"
          />
        </v-col>
      </v-row>
      <v-select
        :items="gameModes"
        v-model="mode"
        item-text="name"
        item-value="id"
        label="Game Mode"
      />
      <v-select
        :items="formats"
        v-model="format"
        item-text="name"
        item-value="id"
        label="Format"
      />
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

@Component({})
export default class AddPlayerModal extends Vue {
  @Prop() public tournament!: ITournament;
  @Prop() public saving!: boolean;

  public name = "Standard One vs One Tournament";
  public gateway = Gateways.Europe;
  public startDateTime = startOfHour(setHours(addDays(new Date(), 1), 20));
  public mode = EGameMode.GM_1ON1;
  public format = ETournamentFormat.SINGLE_ELIM;
  public mapPool = this.maps.slice(0, 5).map(m => m.id);
  public state = ETournamentState.INIT;

  mounted() {
    this.init();
  }

  private init() {
    if (!this.tournament) {
      return
    }
    this.name = this.tournament.name;
    this.gateway = this.tournament.gateway;
    this.startDateTime = this.tournament.startDateTime;
    this.mode = this.tournament.mode;
    this.format = this.tournament.format;
    this.mapPool = this.tournament.mapPool;
    this.state = this.tournament.state;
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
    const fieldNames = [ 'name', 'gateway', 'startDateTime', 'mode', 'format', 'mapPool', 'state' ];
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

  get maps() {
    // TODO: use server maps after merging https://github.com/w3champions/website/pull/540
    return [
      {
        id: 2000,
        name: 'Amazonia',
      },
      {
        id: 2001,
        name: 'Concealed Hill',
      },
      {
        id: 2002,
        name: 'Echo Isles',
      },
      {
        id: 2003,
        name: 'Last Refuge',
      },
      {
        id: 2004,
        name: 'Northern Isles',
      },
      {
        id: 2005,
        name: 'Terenas Stand LV',
      },
      {
        id: 2006,
        name: 'Twisted Meadows',
      },
      {
        id: 2044,
        name: 'Autumn Leaves',
      },
      {
        id: 2054,
        name: 'Tidehunters',
      },
      {
        id: 2061,
        name: 'Shallow Grave',
      },
    ];
  }

  private getSelectOptions(labelMap: { [key: number]: string }) {
    return _.map(labelMap, (name, id) => ({
      id: +id,
      name,
    }));
  }
}
</script>

<style>
.edit-tournament-modal .v-messages {
  display: none;
}
</style>
