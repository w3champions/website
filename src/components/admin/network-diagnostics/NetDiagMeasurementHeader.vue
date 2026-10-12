<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-text>
      <div class="d-flex flex-wrap align-center ga-3 mb-3">
        <strong class="text-h6">{{ detail.battleTag }}</strong>
        <router-link :to="{ name: EAdminRouteName.NETDIAG_MEASUREMENTS, query: { battleTag: detail.battleTag } }" class="text-primary text-body-2">All measurements of this player</router-link>
        <router-link :to="{ name: EAdminRouteName.NETDIAG_RUN_DETAIL, params: { runId: detail.runId } }" class="text-primary text-body-2">Run {{ detail.runId }}</router-link>
      </div>
      <dl class="netdiag-facts">
        <div v-for="fact in facts" :key="fact.label">
          <dt class="text-caption text-medium-emphasis">{{ fact.label }}</dt>
          <dd class="text-body-2">{{ fact.value }}</dd>
        </div>
      </dl>
      <div v-if="adapters.length > 0" class="mt-3">
        <div class="text-caption text-medium-emphasis mb-1">Adapters</div>
        <div v-for="(line, index) in adapters" :key="index" class="text-body-2">{{ line }}</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { EAdminRouteName } from "@/router/types";
import type { MeasurementDetailDto } from "@/store/admin/networkDiagnostics/types";
import { adapterLine, measurementFacts } from "./measurementView";

const props = defineProps<{ detail: MeasurementDetailDto }>();

const facts = computed(() => measurementFacts(props.detail));
const adapters = computed(() => (props.detail.system?.adapters ?? []).map(adapterLine));
</script>

<style scoped>
.netdiag-facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px 24px;
  margin: 0;
}

.netdiag-facts dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
