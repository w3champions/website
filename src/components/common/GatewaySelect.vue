<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" class="transparent">
        <v-icon style="margin-right: 5px">{{ mdiEarth }}</v-icon>
        {{ gateway }}
      </v-btn>
    </template>
    <v-card>
      <v-list>
        <v-subheader>
          {{ $t("components_common_gatewayselect.selectgateway") }}
        </v-subheader>
        <v-list-item
          v-for="mode in gateWays"
          :key="mode.gateway"
          @click="setGateway(mode.gateway)"
        >
          <v-list-item-title>{{ mode.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue } from "vue-facing-decorator";

import { Gateways } from "@/store/ranking/types";
import { LocaleMessage } from "vue-i18n";
import { useRootStateStore } from "@/store/rootState/store";
import { mdiEarth } from "@mdi/js";

@Component({})
export default class GatewaySelect extends Vue {
  public mdiEarth = mdiEarth;
  private rootStateStore = useRootStateStore();

  get gateway(): LocaleMessage {
    const gateway = this.rootStateStore.gateway;
    return this.gateWays.filter((g) => g.gateway == gateway)[0].name;
  }

  get gateWays(): Array<{ name: LocaleMessage; gateway: number }> {
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

  public setGateway(gateway: Gateways): void {
    this.rootStateStore.SET_GATEWAY(gateway);
    this.$emit("gatewayChanged", gateway);
  }
}
</script>

<style></style>
