<template>
  <div>
    <v-container fluid class="py-0">
      <div class="d-flex align-center ga-2 text-caption text-medium-emphasis mb-2">
        <v-progress-circular v-if="nodeDayLoading" indeterminate size="14" width="2" />
        <span>{{ groupSummary }}</span>
      </div>
    </v-container>
    <v-container v-if="nodeDayError" fluid class="py-0">
      <v-alert type="error" variant="tonal" density="compact" class="mb-2">
        Couldn't load the grouped overview — use Refresh to retry.
      </v-alert>
    </v-container>
    <v-expansion-panels v-model="expandedGroups" multiple>
      <v-expansion-panel v-for="group in pagedGroups" :key="group.key" :value="group.key">
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-2 flex-wrap">
            <strong
              class="clickable group-node-link"
              :title="`Focus ${group.serverNodeName} — filter to this node, then widen the window as needed`"
              @click.stop="$emit('focus-node', group.serverNodeId, group.serverNodeName)"
            >{{ group.serverNodeName }}</strong>
            <span class="text-medium-emphasis">{{ group.day }}</span>
            <v-chip size="x-small" variant="tonal">{{ group.count }} report{{ group.count === 1 ? "" : "s" }}</v-chip>
            <v-chip size="x-small" variant="tonal" color="info">{{ group.distinctPlayers }} player{{ group.distinctPlayers === 1 ? "" : "s" }}</v-chip>
            <v-chip v-if="group.explicitCount > 0" size="x-small" variant="tonal" color="warning">
              {{ group.explicitCount }} submitted
            </v-chip>
            <v-chip
              v-for="(cat, ci) in group.topCategories"
              :key="ci"
              size="x-small"
              color="error"
              variant="tonal"
              :title="`${cat.count} occurrence${cat.count === 1 ? '' : 's'} in this group`"
            >
              {{ cat.category }}
            </v-chip>
            <v-btn
              :icon="mdiFormatListBulleted"
              size="x-small"
              variant="text"
              class="group-node-link"
              title="Open this group in the flat list — full pagination, place kept across detail visits"
              @click.stop="$emit('open-as-list', group)"
            />
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div v-if="groupRowsFor(group.key).loading" class="d-flex justify-center pa-3">
            <v-progress-circular indeterminate size="20" width="2" />
          </div>
          <div v-else-if="groupRowsFor(group.key).error" class="text-caption text-error pa-2">
            Failed to load this group's reports — try Refresh.
          </div>
          <template v-else>
            <div
              v-if="groupRowsFor(group.key).total > groupRowsFor(group.key).rows.length"
              class="text-caption text-medium-emphasis mb-1"
            >
              Showing the newest {{ groupRowsFor(group.key).rows.length }} of {{ groupRowsFor(group.key).total }} reports in this group
            </div>
            <!-- A real table so the grouped view carries the same column
               headers and alignment as the flat one. Whole row opens the
               report; the click-to-filter targets inside stop propagation so
               they keep filtering rather than navigating. -->
            <v-table density="compact" hover class="group-table">
              <thead>
                <tr>
                  <th
                    v-for="col in groupRowColumns"
                    :key="String(col.value)"
                    class="text-medium-emphasis font-weight-bold"
                    :class="col.align === 'center' ? 'text-center' : 'text-start'"
                    :style="col.width ? { width: col.width } : undefined"
                  >
                    {{ col.title }}
                  </th>
                  <th class="text-center group-actions-col"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="report in groupRowsFor(group.key).rows"
                  :key="report.id"
                  class="group-row"
                  title="Open report detail"
                  @click="$emit('open', report.id)"
                >
                  <td
                    v-for="col in groupRowColumns"
                    :key="String(col.value)"
                    :class="col.align === 'center' ? 'text-center' : 'text-start'"
                  >
                    <lag-report-row-cells
                      :report="report"
                      :column="String(col.value)"
                      variant="grouped"
                      @filter-player="(battleTag: string) => $emit('filter-player', battleTag)"
                    />
                  </td>
                  <td class="text-center">
                    <lag-report-row-cells
                      :report="report"
                      column="actions"
                      variant="grouped"
                      @open="$emit('open', report.id)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </template>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- Two "more" controls, one rule: the pager moves WITHIN the fetched
         window (the aggregate returns every group at once; pages are sliced
         client-side to keep the DOM small), and the walk WIDENS the window —
         a date gesture, dateFrom −7d, chip and URL follow. The walk only
         offers itself on the last page, where the window is exhausted and
         "more" can only mean older days. -->
    <div class="d-flex justify-center align-center ga-4 my-2">
      <v-pagination
        v-if="groupPageCount > 1"
        v-model="groupPage"
        :length="groupPageCount"
        :total-visible="7"
        density="comfortable"
      />
      <v-btn
        v-if="groupPage === groupPageCount"
        size="small"
        variant="tonal"
        :disabled="!canWalkBack"
        :title="canWalkBack
          ? 'Widen the date window seven days further into the past'
          : 'The window already reaches the 90-day retention limit'"
        @click="$emit('walk')"
      >
        {{ canWalkBack ? "Load 7 more days" : "All retained days shown" }}
      </v-btn>
    </div>
    <v-container v-if="!nodeDayLoading && !nodeDayError && groups.length === 0" fluid>
      <span class="text-medium-emphasis">{{ emptyWindowNote }}</span>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from "vue";
import { mdiFormatListBulleted } from "@mdi/js";
import { useLagReportsStore } from "@/store/admin/lagReports/store";
import { useLagReportsPrefsStore } from "@/store/admin/lagReports/prefs";
import { LagReportListItem, LagReportQueryParams } from "@/store/admin/lagReports/types";
import { ALL_HEADERS } from "./columns";
import LagReportRowCells from "./LagReportRowCells.vue";

// One node × UTC-day bucket from the aggregation endpoint; rows are fetched
// separately when the panel expands.
export type LagReportGroup = {
  key: string;
  serverNodeId: number;
  serverNodeName: string;
  day: string;
  count: number;
  explicitCount: number;
  distinctPlayers: number;
  topCategories: { category: string; count: number }[];
};

type GroupRowsState = {
  loading: boolean;
  error: boolean;
  rows: LagReportListItem[];
  total: number;
};

// How many category chips a group header shows before truncating.
const GROUP_CATEGORY_LIMIT = 4;

const GROUPS_PER_PAGE = 20;

const EMPTY_GROUP_ROWS: GroupRowsState = { loading: false, error: false, rows: [], total: 0 };

// The grouped view: one row per server node per UTC day from the node-day
// aggregation, expandable into that group's newest reports. Date changes and
// navigation are the page's business — this component emits and renders.
export default defineComponent({
  name: "LagReportGroupedView",
  components: { LagReportRowCells },
  props: {
    // The active list query minus the grouped view's own overrides; group
    // expansion re-scopes it to the group's exact node and day.
    baseParams: {
      type: Object as PropType<LagReportQueryParams>,
      required: true,
    },
    datesExplicit: {
      type: Boolean,
      required: true,
    },
    emptyWindowNote: {
      type: String,
      required: true,
    },
    canWalkBack: {
      type: Boolean,
      required: true,
    },
    // Bumped when the aggregates reload (filter change, refresh): the cached
    // per-group rows and open panels belong to the previous result set.
    reloadToken: {
      type: Number,
      required: true,
    },
    // Bumped on filter changes only — the walk deliberately keeps the pager
    // where it is, so widening never yanks the reader off the oldest days.
    pageResetToken: {
      type: Number,
      required: true,
    },
  },
  emits: ["focus-node", "open-as-list", "open", "walk", "filter-player"],
  setup(props) {
    const lagReportsStore = useLagReportsStore();
    const prefsStore = useLagReportsPrefsStore();

    const nodeDayLoading = computed(() => lagReportsStore.nodeDayLoading);
    const nodeDayError = computed(() => lagReportsStore.nodeDayError);

    // Buckets arrive day-ascending; the view wants the newest day first, busiest
    // node first within it. Days are UTC strings, so string comparison sorts them.
    const groups = computed<LagReportGroup[]>(() =>
      [...lagReportsStore.nodeDayBuckets]
        .map((bucket) => ({
          key: `${bucket.serverNodeId}|${bucket.day}`,
          serverNodeId: bucket.serverNodeId ?? 0,
          serverNodeName: bucket.serverNodeName ?? "",
          day: bucket.day ?? "",
          count: bucket.count,
          explicitCount: bucket.explicitCount ?? 0,
          distinctPlayers: bucket.distinctPlayers ?? 0,
          topCategories: (bucket.topCategories ?? []).slice(0, GROUP_CATEGORY_LIMIT),
        }))
        .sort((a, b) => (a.day === b.day ? b.count - a.count : a.day < b.day ? 1 : -1))
    );

    // Grouped rows carry the same chosen columns as the flat table, minus the
    // two that would only be noise there: the action cell, since the whole row
    // opens the report, and the server, which every row in a group shares with
    // the header above it.
    const groupRowColumns = computed(() =>
      ALL_HEADERS.filter((h) =>
        h.value !== "actions"
        && h.value !== "serverNodeName"
        && prefsStore.visibleColumns.includes(h.value as never)
      )
    );

    // Rows are fetched per group when its panel expands — the group's node and
    // UTC day become exact list filters on top of the active server-capable ones.
    const expandedGroups = ref<string[]>([]);
    const groupRows = ref(new Map<string, GroupRowsState>());

    function groupRowsFor(key: string): GroupRowsState {
      return groupRows.value.get(key) ?? EMPTY_GROUP_ROWS;
    }

    async function loadGroupRows(group: LagReportGroup) {
      // The map is replaced wholesale when the aggregates reload; holding the
      // instance lets an in-flight fetch detect it became obsolete instead of
      // caching old-filter rows into the fresh map.
      const target = groupRows.value;
      if (target.has(group.key)) return;
      target.set(group.key, { loading: true, error: false, rows: [], total: 0 });
      try {
        const response = await lagReportsStore.fetchReportsOnce({
          ...props.baseParams,
          page: 0,
          // MaxPageSize on the endpoint; a larger group gets a "newest N of M" note.
          pageSize: 100,
          serverNames: undefined,
          serverNodeIds: [group.serverNodeId],
          dateFrom: group.day,
          dateTo: group.day,
        });
        if (groupRows.value !== target) return;
        target.set(group.key, { loading: false, error: false, rows: response.items, total: response.total });
      } catch (_e) {
        if (groupRows.value !== target) return;
        target.set(group.key, { loading: false, error: true, rows: [], total: 0 });
      }
    }

    watch(expandedGroups, (keys) => {
      for (const key of keys) {
        const group = groups.value.find((g) => g.key === key);
        if (group) void loadGroupRows(group);
      }
    });

    watch(() => props.reloadToken, () => {
      groupRows.value = new Map();
      expandedGroups.value = [];
    });

    const groupPage = ref(1);

    const groupPageCount = computed(() => Math.max(1, Math.ceil(groups.value.length / GROUPS_PER_PAGE)));

    const pagedGroups = computed(() =>
      groups.value.slice((groupPage.value - 1) * GROUPS_PER_PAGE, groupPage.value * GROUPS_PER_PAGE)
    );

    // Filters shrinking the group list can leave the page pointer past the end.
    watch(groupPageCount, (count) => {
      if (groupPage.value > count) groupPage.value = count;
    });

    watch(() => props.pageResetToken, () => {
      groupPage.value = 1;
    });

    const groupSummary = computed(() => {
      const totalReports = lagReportsStore.nodeDayBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
      const parts = [
        `${totalReports} report${totalReports === 1 ? "" : "s"} in ${groups.value.length} group${groups.value.length === 1 ? "" : "s"} (node × UTC day)`,
      ];
      if (groups.value.length > 0) {
        const newest = groups.value[0].day;
        const oldest = groups.value[groups.value.length - 1].day;
        parts.push(oldest === newest ? `day ${newest}` : `days ${oldest} → ${newest}`);
      }
      if (!props.datesExplicit) {
        parts.push("showing today and yesterday — Load 7 more days below, or set a date range");
      }
      return parts.join(" · ");
    });

    return {
      nodeDayLoading,
      nodeDayError,
      groups,
      groupRowColumns,
      expandedGroups,
      groupRowsFor,
      groupPage,
      groupPageCount,
      pagedGroups,
      groupSummary,
      mdiFormatListBulleted,
    };
  },
});
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;
}

.clickable:hover {
  text-decoration: underline;
}

// Hover comes from v-table's own `hover` prop, so a group row and a flat row
// respond identically without a second rule to keep in step.
.group-row {
  cursor: pointer;
}

.group-actions-col {
  width: 100px;
}

// The expansion-panel title lays a ripple overlay across the whole header;
// the node name needs its own stacking context to receive clicks through it.
.group-node-link {
  position: relative;
  z-index: 1;
}
</style>
