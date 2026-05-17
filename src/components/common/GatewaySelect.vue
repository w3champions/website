<template>
  <v-menu location="right">
    <template v-slot:activator="{ props }">
      <v-btn tile class="w3-dropdown-button" style="background-color: transparent" v-bind="props">
        <v-icon size="x-large" style="margin-right: 5px">{{ mdiEarth }}</v-icon>
        {{ $t(gateway.name) }}
      </v-btn>
    </template>
    <v-card>
      <v-list>
        <v-list-subheader>
          {{ $t("components_common_gatewayselect.selectgateway") }}
        </v-list-subheader>
        <v-list-item v-for="gw in gateways" :key="gw.id" @click="gateway = gw">
          <v-list-item-title>{{ $t(gw.name) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Gateways } from "@/store/ranking/types";
import { useRootStateStore } from "@/store/rootState/store";
import { mdiEarth } from "@mdi/js";

const emit = defineEmits<{
  gatewayChanged: [gateway: number];
}>();

const rootStateStore = useRootStateStore();

const gateways: Array<{ id: Gateways; name: string }> = [
  { id: Gateways.Europe, name: `gatewayNames.${Gateways[Gateways.Europe]}` },
  { id: Gateways.America, name: `gatewayNames.${Gateways[Gateways.America]}` },
];

const gateway = computed<{ id: number; name: string }>({
  get(): { id: number; name: string } {
    return gateways.find((g) => g.id === rootStateStore.gateway)!;
  },
  set(gw: { id: number; name: string }): void {
    rootStateStore.SET_GATEWAY(gw.id);
    emit("gatewayChanged", gw.id);
  },
});
</script>
