<template>
  <v-card v-if="loading || total > 0" variant="tonal" density="compact" class="mb-2 px-3 py-2">
    <div class="d-flex align-center ga-2 flex-wrap text-caption">
      <v-progress-circular v-if="loading" indeterminate size="14" width="2" />
      <template v-else>
        <strong>{{ battleTag }}</strong>
        <span>{{ summaryLine }}</span>
        <span v-if="nodesLine" class="text-medium-emphasis">· {{ nodesLine }}</span>
        <span v-if="categoriesLine" class="text-medium-emphasis">· {{ categoriesLine }}</span>
        <span v-if="playersLine" class="text-medium-emphasis">· {{ playersLine }}</span>
        <!-- A date gesture in context: player-scoped reads are index-bounded,
             so the full retained range costs almost nothing here. -->
        <span
          v-if="canExpandHistory"
          class="text-primary history-link"
          title="Widen the date window to everything retained (90 days)"
          @click="$emit('expand-history')"
        >full 90-day history</span>
      </template>
    </div>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useLagReportsStore } from "@/store/admin/lagReports/store";
import { LagReportAggregateBucket } from "@/store/admin/lagReports/types";
import debounce from "debounce";

export default defineComponent({
  name: "LagReportPlayerDossier",
  props: {
    battleTag: { type: String, required: true },
    dateFrom: { type: String, required: true },
    dateTo: { type: String, required: true },
    canExpandHistory: { type: Boolean, default: false },
  },
  emits: ["expand-history"],
  setup(props) {
    const lagReportsStore = useLagReportsStore();

    const loading = ref(false);
    const dayBuckets = ref<LagReportAggregateBucket[]>([]);
    const serverBuckets = ref<LagReportAggregateBucket[]>([]);
    const categoryBuckets = ref<LagReportAggregateBucket[]>([]);
    const playerBuckets = ref<LagReportAggregateBucket[]>([]);

    // A newer request invalidates any in-flight older one.
    let seq = 0;

    async function load() {
      const token = ++seq;
      loading.value = true;
      const base = {
        battleTag: props.battleTag,
        dateFrom: props.dateFrom || undefined,
        dateTo: props.dateTo || undefined,
      };
      try {
        const [days, servers, categories, players] = await Promise.all([
          lagReportsStore.fetchAggregate({ ...base, groupBy: "day" }),
          lagReportsStore.fetchAggregate({ ...base, groupBy: "server" }),
          lagReportsStore.fetchAggregate({ ...base, groupBy: "category" }),
          lagReportsStore.fetchAggregate({ ...base, groupBy: "battleTag", limit: 4 }),
        ]);
        if (token !== seq) return;
        dayBuckets.value = days;
        serverBuckets.value = servers;
        categoryBuckets.value = categories;
        playerBuckets.value = players;
      } catch (_e) {
        // The dossier is an enhancement card — on failure it simply stays
        // absent rather than showing stale or partial numbers.
        if (token !== seq) return;
        dayBuckets.value = [];
        serverBuckets.value = [];
        categoryBuckets.value = [];
        playerBuckets.value = [];
      } finally {
        if (token === seq) loading.value = false;
      }
    }

    const debouncedLoad = debounce(load, 400);

    watch(
      () => [props.battleTag, props.dateFrom, props.dateTo],
      () => {
        loading.value = true;
        debouncedLoad();
      },
      { immediate: true },
    );

    const total = computed(() => dayBuckets.value.reduce((sum, b) => sum + b.count, 0));

    const summaryLine = computed(() => {
      const days = dayBuckets.value;
      if (days.length === 0) return "";
      const first = days[0].day;
      const last = days[days.length - 1].day;
      const span = first === last ? `on ${first}` : `${first} – ${last}`;
      // With exactly one matching player, their submitted-vs-appears split is
      // the chronic-reporter signal; with several, playersLine breaks it down.
      const submitted = playerBuckets.value.length === 1 ? playerBuckets.value[0].submittedCount ?? 0 : null;
      const suffix = submitted !== null ? ` · ${submitted} submitted` : "";
      return `${total.value} report${total.value === 1 ? "" : "s"} across ${days.length} day${days.length === 1 ? "" : "s"} (${span})${suffix}`;
    });

    // One node points at the node; many nodes point at the player's connection.
    const nodesLine = computed(() => {
      const nodes = serverBuckets.value;
      if (nodes.length === 0) return "";
      const top = nodes.slice(0, 3).map((n) => `${n.serverNodeName} (${n.count})`).join(", ");
      const rest = nodes.length > 3 ? ` +${nodes.length - 3} more` : "";
      const hint = nodes.length === 1 ? "active on a single node" : `active on ${nodes.length} nodes`;
      return `${hint}: ${top}${rest}`;
    });

    const categoriesLine = computed(() => {
      const top = categoryBuckets.value.slice(0, 3);
      if (top.length === 0) return "";
      return `top: ${top.map((c) => `${c.category} ×${c.count}`).join(", ")}`;
    });

    // The battleTag filter is a prefix — say so when it matches several people.
    const playersLine = computed(() => {
      const players = playerBuckets.value;
      if (players.length <= 1) return "";
      const shown = players.slice(0, 3).map((p) => `${p.battleTag} ×${p.submittedCount ?? 0}/${p.count}`).join(", ");
      return `matches ${players.length >= 4 ? "≥" : ""}${players.length} players: ${shown}`;
    });

    return {
      loading,
      total,
      summaryLine,
      nodesLine,
      categoriesLine,
      playersLine,
    };
  },
});
</script>

<style lang="scss" scoped>
.history-link {
  cursor: pointer;
}

.history-link:hover {
  text-decoration: underline;
}
</style>
