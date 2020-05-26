<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent;">
        <v-icon style="margin-right: 5px;">mdi-earth</v-icon>
        {{ gateway }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>Select a gateway:</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item
            v-for="mode in gateWays"
            :key="mode.gateway"
            @click="setGateway(mode.gateway)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ mode.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

import { Gateways } from "@/store/ranking/types";

@Component({})
export default class GateWaySelect extends Vue {
  get gateway() {
    const gateway = this.$store.direct.state.rankings.gateway;
    return this.gateWays.filter((g) => g.gateway == gateway)[0].name;
  }

  get gateWays() {
    return [
      {
        name: this.$t(`gatewayNames.${Gateways[Gateways.Europe]}`),
        gateway: Gateways.Europe,
      },
      {
        name: this.$t(`gatewayNames.${Gateways[Gateways.America]}`),
        gateway: Gateways.America,
      },
    ];
  }

  public setGateway(gateway: Gateways) {
    this.$store.direct.dispatch.rankings.setGateway(gateway);
    this.$store.direct.dispatch.player.setGateway(gateway);
    window.localStorage.setItem("selectedGateway", gateway.toString());
  }
}
</script>

<style></style>
