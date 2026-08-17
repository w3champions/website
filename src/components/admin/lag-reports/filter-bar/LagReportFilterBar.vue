<template>
  <div class="d-flex align-center flex-wrap ga-2 flex-grow-1 filter-group">
    <v-menu
      v-for="pill in toolbarChips"
      :key="pill.key"
      :model-value="openEditor === pill.key"
      :close-on-content-click="false"
      location="bottom start"
      @update:modelValue="(open: boolean) => onEditorToggle(pill.key, open)"
    >
      <template v-slot:activator="{ props }">
        <!-- A closable v-chip hides ITSELF on close-click via its internal
             model, and Vuetify only treats the model as controlled when
             BOTH the prop and an update listener are bound — hence the
             deliberate no-op listener. Visibility belongs to toolbarChips
             alone: × on a pinned chip clears the value, the pill stays. -->
        <v-chip
          v-bind="props"
          :model-value="true"
          variant="tonal"
          color="primary"
          :closable="pill.closable"
          :title="pill.applied ? 'Click to edit' : 'Click to filter'"
          @update:modelValue="() => undefined"
          @click:close="removeFilter(pill.key)"
        >
          {{ pill.label }}
        </v-chip>
      </template>
      <v-card min-width="300" class="pa-3">
        <prefix-facet-editor
          v-if="pill.key === 'player'"
          :model-value="filtersStore.battleTag"
          label="BattleTag"
          placeholder="Starts with…"
          :facets="playerFacets"
          :facet-heading="playerFacetHeading"
          count-suffix=" submitted"
          :error="facetError"
          @update:modelValue="(value: string) => setTextFilter('battleTag', value)"
          @pick="(value: string) => applyFacet('player', value)"
        />
        <prefix-facet-editor
          v-else-if="pill.key === 'game'"
          :model-value="filtersStore.gameSearch"
          label="Game ID / Name"
          placeholder="ID, or name starts with…"
          @update:modelValue="(value: string) => setTextFilter('gameSearch', value)"
        />
        <server-editor
          v-else-if="pill.key === 'server'"
          :input="serverInput"
          :options="serverOptions"
          :error="facetError"
          @update:input="(value: string) => (serverInput = value)"
          @commit="addServerTerm"
          @toggle="toggleServerOption"
        />
        <prefix-facet-editor
          v-else-if="pill.key === 'proxy'"
          :model-value="filtersStore.proxyName"
          label="Proxy name"
          placeholder="Starts with…"
          :facets="proxyFacets"
          :error="facetError"
          @update:modelValue="(value: string) => setTextFilter('proxyName', value)"
          @pick="(value: string) => applyFacet('proxy', value)"
        />
        <prefix-facet-editor
          v-else-if="pill.key === 'proxyIp'"
          :model-value="filtersStore.proxyIp"
          label="Proxy IP"
          placeholder="Starts with…"
          @update:modelValue="(value: string) => setTextFilter('proxyIp', value)"
        />
        <list-editor
          v-else-if="pill.key === 'categories'"
          :items="categoryItems"
          multiple
          caption="Only matches player-submitted reports"
          :error="facetError"
          @toggle="toggleCategory"
        />
        <list-editor
          v-else-if="pill.key === 'tags'"
          :items="tagItems"
          caption="The launcher's own verdict on where the connection fault sat"
          @toggle="setTagFilter"
        />
        <date-range-editor
          v-else-if="pill.key === 'dates'"
          :date-from="filtersStore.dateFrom"
          :date-to="filtersStore.dateTo"
          :presets="datePresets"
          @update:dateFrom="(value: string) => setDateBound('dateFrom', value)"
          @update:dateTo="(value: string) => setDateBound('dateTo', value)"
          @preset="applyDatePreset"
        />
        <repeat-editor
          v-else-if="pill.key === 'repeat'"
          :min-repeat="filtersStore.minRepeat"
          :mode="filtersStore.repeatMode"
          @update:minRepeat="setMinRepeat"
          @update:mode="setRepeatMode"
        />
        <number-range-editor
          v-else-if="pill.key === 'playerCount'"
          :min="filtersStore.minPlayers"
          :max="filtersStore.maxPlayers"
          @update:min="(value: string) => setPlayerBound('min', value)"
          @update:max="(value: string) => setPlayerBound('max', value)"
        />
      </v-card>
    </v-menu>

    <v-menu v-model="addMenuOpen" :close-on-content-click="false" location="bottom start">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" variant="text" size="small" :prepend-icon="mdiPlus">
          Filter
        </v-btn>
      </template>
      <v-list density="compact" min-width="240">
        <template v-for="entry in addMenu" :key="entry.key">
          <v-divider v-if="entry.dividerBefore" class="my-1" />
          <v-list-item :active="entry.active" @click="addFilter(entry.key)">
            <v-list-item-title>{{ entry.label }}</v-list-item-title>
            <template v-slot:append>
              <v-btn
                :icon="entry.pinned ? mdiStar : mdiStarOutline"
                :color="entry.pinned ? 'primary' : undefined"
                size="x-small"
                variant="text"
                :title="entry.pinned ? 'Remove from the filter bar' : 'Show in the filter bar'"
                @click.stop="onTogglePin(entry.key)"
              />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-menu>

    <v-btn
      v-if="activeFilterCount > 0"
      variant="text"
      size="small"
      :prepend-icon="mdiFilterRemove"
      title="Remove all filters"
      @click="clearAllFilters"
    >
      Clear all
    </v-btn>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref } from "vue";
import { useDisplay } from "vuetify";
import { mdiFilterRemove, mdiPlus, mdiStar, mdiStarOutline } from "@mdi/js";
import { useLagReportsStore } from "@/store/admin/lagReports/store";
import { useLagReportsPrefsStore } from "@/store/admin/lagReports/prefs";
import type { LagReportsFilterKey as FilterKey } from "@/store/admin/lagReports/prefs";
import {
  FILTER_REGISTRY,
  applyDefaultWindow,
  clearAllFilterValues,
  countActiveFilters,
  filterParams,
  RETENTION_DAYS,
  useLagReportsFiltersStore,
  utcDayString,
} from "@/store/admin/lagReports/filters";
import { LagReportAggregateBucket } from "@/store/admin/lagReports/types";
import PrefixFacetEditor from "./editors/PrefixFacetEditor.vue";
import ServerEditor from "./editors/ServerEditor.vue";
import type { ServerOption } from "./editors/ServerEditor.vue";
import ListEditor from "./editors/ListEditor.vue";
import DateRangeEditor from "./editors/DateRangeEditor.vue";
import RepeatEditor from "./editors/RepeatEditor.vue";
import NumberRangeEditor from "./editors/NumberRangeEditor.vue";

// The launcher's tag vocabulary (ELagReportTag). New backend tags still render
// as chips and remain clickable — this list only feeds the editor.
const TAG_OPTIONS = ["LAN", "LastMile"];

const ISSUE_CATEGORY_OPTIONS = [
  "InputDelay",
  "GameStutter",
  "WaitingForPlayers",
  "RubberBanding",
  "SpikeLag",
  "ConsistentLag",
  "Reconnecting",
  "FullDisconnect",
  "Desync",
  "FpsDrops",
  "GameCrashed",
  "Other",
];

const byKey = new Map(FILTER_REGISTRY.map((descriptor) => [descriptor.key, descriptor]));

// The filter bar: one pill per applied filter, a "+ Filter" menu with per-user
// pinning, and one editor component per filter shape. It reads and writes the
// filters store and emits `change(immediate)` — persistence, URL sync and
// loading stay with the page.
export default defineComponent({
  name: "LagReportFilterBar",
  components: { PrefixFacetEditor, ServerEditor, ListEditor, DateRangeEditor, RepeatEditor, NumberRangeEditor },
  emits: ["change"],
  setup(_props, { emit }) {
    const filtersStore = useLagReportsFiltersStore();
    const prefsStore = useLagReportsPrefsStore();
    const lagReportsStore = useLagReportsStore();
    const { smAndDown } = useDisplay();

    function change(immediate = false) {
      emit("change", immediate);
    }

    const openEditor = ref<FilterKey | null>(null);
    const addMenuOpen = ref(false);
    // A filter picked from the "+ Filter" menu but not yet holding a value —
    // its pill exists while the editor is open, and vanishes if closed empty.
    const draftKey = ref<FilterKey | null>(null);

    function filterHasValue(key: FilterKey): boolean {
      return byKey.get(key)?.hasValue(filtersStore) ?? false;
    }

    // The bar carries every starred filter whether or not it holds a value —
    // the ones an admin reaches for on each visit are one click from their
    // editor. Everything else earns a pill by being applied, by being the
    // draft picked from the "+ Filter" menu, or by having its editor open
    // right now (so a chip cannot unmount from under its own editor while a
    // value is backspaced empty). The dates chip is always present: the window
    // is state every read scopes to, and it must stay visible.
    const toolbarChips = computed(() => {
      const pinned = new Set(prefsStore.pinnedFilters);
      const listed = FILTER_REGISTRY.filter((def) => !def.asToggle);
      const earnsChip = (def: { key: FilterKey }) =>
        def.key === "dates"
        || filterHasValue(def.key)
        || draftKey.value === def.key
        || openEditor.value === def.key;
      const inBar = [
        // Registry order within each block, matching the menu, so the bar
        // never reshuffles as stars come and go.
        ...listed.filter((def) => pinned.has(def.key)),
        ...listed.filter((def) => !pinned.has(def.key) && earnsChip(def)),
      ];
      // On a phone the bar is the scarcest space on the page, so the starred
      // chips standing empty give way: they are shortcuts to an editor the
      // "+ Filter" menu still reaches, while an applied chip is the only place
      // that filter's value is visible.
      const shown = smAndDown.value ? inBar.filter(earnsChip) : inBar;
      return shown.map((def) => {
        const applied = filterHasValue(def.key);
        // Dates always show the window itself and never carry an × — the
        // window always holds a value, and the editor's "Today + yesterday"
        // preset is the way back to the default (Mark's ruling).
        const showValue = applied || def.key === "dates";
        return {
          key: def.key,
          applied,
          closable: def.key === "dates" ? false : applied,
          label: showValue ? byKey.get(def.key)!.pillLabel(filtersStore) : def.label,
        };
      });
    });

    const activeFilterCount = computed(() => countActiveFilters(filtersStore));

    // Starred entries float to the top of the menu — the same block that sits
    // on the bar — keeping registry order within each block so the list
    // never reshuffles as stars change.
    const addMenu = computed(() => {
      const pinned = new Set(prefsStore.pinnedFilters);
      const listed = FILTER_REGISTRY.filter((def) => !def.asToggle);
      const ordered = [
        ...listed.filter((def) => pinned.has(def.key)),
        ...listed.filter((def) => !pinned.has(def.key)),
      ];
      // Count pins among the *listed* entries: a pin stored for a filter that
      // now renders as a toolbar toggle would otherwise push the divider past
      // the pinned block.
      const pinnedCount = ordered.filter((def) => pinned.has(def.key)).length;
      return ordered.map((def, index) => ({
        key: def.key,
        label: def.label,
        pinned: pinned.has(def.key),
        active: filterHasValue(def.key),
        dividerBefore: pinnedCount > 0 && index === pinnedCount,
      }));
    });

    function addFilter(key: FilterKey) {
      addMenuOpen.value = false;
      // An already-applied filter keeps its pill, and a starred one always has
      // one; picking either just reopens its editor.
      if (!filterHasValue(key) && !prefsStore.pinnedFilters.includes(key)) draftKey.value = key;
      void loadFacet(key);
      // The pill must render before its menu can anchor to it.
      nextTick(() => {
        openEditor.value = key;
      });
    }

    // Unstarring takes an empty chip off the bar, so an editor anchored to it
    // loses its anchor — close it in the same gesture. One holding a value
    // keeps its chip and stays open.
    function onTogglePin(key: FilterKey) {
      prefsStore.toggleFilterPin(key);
      if (!prefsStore.pinnedFilters.includes(key) && !filterHasValue(key) && openEditor.value === key) {
        openEditor.value = null;
      }
    }

    function onEditorToggle(key: FilterKey, open: boolean) {
      if (open) {
        openEditor.value = key;
        // Each visit starts from the full suggestion list, freshly counted.
        if (key === "server") serverInput.value = "";
        void loadFacet(key);
        return;
      }
      // Typing a server name and closing without pressing Enter still applies
      // it, the way the old single-value field did — the box reads as a filter,
      // not only as a search over the suggestions. Once something is ticked the
      // text was a search over the list, so it is dropped rather than added as
      // a second term that would widen the very selection just made.
      if (key === "server") {
        if (filtersStore.serverNames.length === 0 && filtersStore.serverNodes.length === 0) {
          addServerTerm();
        } else {
          serverInput.value = "";
        }
      }
      if (openEditor.value === key) openEditor.value = null;
      if (draftKey.value === key && !filterHasValue(key)) draftKey.value = null;
    }

    function removeFilter(key: FilterKey) {
      byKey.get(key)?.clear(filtersStore);
      if (key === "server") serverInput.value = "";
      if (draftKey.value === key) draftKey.value = null;
      if (openEditor.value === key) openEditor.value = null;
      change(true);
    }

    function clearAllFilters() {
      clearAllFilterValues(filtersStore);
      serverInput.value = "";
      draftKey.value = null;
      openEditor.value = null;
      change(true);
    }

    // ── Per-filter wiring ────────────────────────────────────────────

    function setTextFilter(field: "battleTag" | "gameSearch" | "proxyName" | "proxyIp", value: string) {
      filtersStore[field] = value;
      change();
    }

    // Single-value facets: picking one replaces the value and closes the editor.
    // Servers are multi-select and use toggleServerOption instead, which keeps
    // the editor open the way the category checkboxes do.
    function applyFacet(key: "player" | "proxy", value: string) {
      if (key === "player") filtersStore.battleTag = value;
      if (key === "proxy") filtersStore.proxyName = value;
      openEditor.value = null;
      draftKey.value = null;
      change(true);
    }

    // The search box doubles as the way to add a name no suggestion offers —
    // the filter runs against the whole database, so a prefix with no local
    // suggestion is still worth submitting. Ticking a suggestion instead
    // commits the node's exact id: "this node", not "names like this".
    const serverInput = ref("");

    function addServerTerm() {
      const term = serverInput.value.trim();
      serverInput.value = "";
      if (!term || filtersStore.serverNames.includes(term)) return;
      filtersStore.serverNames = [...filtersStore.serverNames, term];
      change(true);
    }

    function toggleServerNode(id: number, name: string) {
      filtersStore.serverNodes = filtersStore.serverNodes.some((n) => n.id === id)
        ? filtersStore.serverNodes.filter((n) => n.id !== id)
        : [...filtersStore.serverNodes, { id, name }];
      change(true);
    }

    function toggleServerOption(opt: ServerOption) {
      if (opt.kind === "prefix") {
        filtersStore.serverNames = filtersStore.serverNames.filter((n) => n !== opt.name);
        change(true);
        return;
      }
      toggleServerNode(opt.nodeId as number, opt.name);
    }

    function setMinRepeat(value: string) {
      const parsed = Number.parseInt(value, 10);
      filtersStore.minRepeat = Number.isFinite(parsed) && parsed >= 2 ? parsed : 0;
      change();
    }

    function setRepeatMode(mode: unknown) {
      filtersStore.repeatMode = mode === "involved" ? "involved" : "submitted";
      if (filtersStore.minRepeat >= 2) change(true);
    }

    function setPlayerBound(bound: "min" | "max", value: string) {
      const parsed = Number.parseInt(value, 10);
      const next = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      if (bound === "min") {
        filtersStore.minPlayers = next;
      } else {
        filtersStore.maxPlayers = next;
      }
      change();
    }

    // Toggle semantics: picking the active tag again clears it. (Tag chips in
    // rows filter through the page's own handler — an editor can't be open
    // behind a row click, the menu swallows the outside click first.)
    function setTagFilter(tag: string) {
      filtersStore.connectionIssueTag = filtersStore.connectionIssueTag === tag ? "" : tag;
      openEditor.value = null;
      draftKey.value = null;
      change(true);
    }

    function toggleCategory(cat: string) {
      const selected = new Set(filtersStore.issueCategories);
      if (selected.has(cat)) {
        selected.delete(cat);
      } else {
        selected.add(cat);
      }
      filtersStore.issueCategories = [...selected];
      change(true);
    }

    function setDateBound(bound: "dateFrom" | "dateTo", value: string) {
      filtersStore[bound] = value;
      filtersStore.datesExplicit = true;
      change();
    }

    const datePresets = computed(() => {
      const today = utcDayString(0);
      const rangeActive = (fromOffset: number) =>
        filtersStore.datesExplicit && filtersStore.dateFrom === utcDayString(fromOffset) && filtersStore.dateTo === today;
      return [
        { key: "default", label: "Today + yesterday", active: !filtersStore.datesExplicit },
        { key: "7d", label: "Last 7 days", active: rangeActive(-6) },
        { key: "30d", label: "Last 30 days", active: rangeActive(-29) },
        { key: "90d", label: `All retained (${RETENTION_DAYS} days)`, active: rangeActive(-RETENTION_DAYS) },
      ];
    });

    function applyDatePreset(key: string) {
      if (key === "default") {
        applyDefaultWindow(filtersStore);
      } else {
        const fromOffsets: Record<string, number> = { "7d": -6, "30d": -29, "90d": -RETENTION_DAYS };
        filtersStore.dateFrom = utcDayString(fromOffsets[key] ?? -1);
        filtersStore.dateTo = utcDayString(0);
        filtersStore.datesExplicit = true;
      }
      change(true);
    }

    // ── Facet suggestions ────────────────────────────────────────────
    // Facet values with counts from the aggregation endpoint — fetched when an
    // editor opens, scoped to the active date range and other filters (each
    // dimension excludes its own filter, so the counts preview what selecting a
    // value would match). Typing narrows the fetched list client-side by the
    // same prefix rule the filter uses; no per-keystroke requests.
    const FACET_LIMIT = 10;

    const facetBuckets = ref<{
      server: LagReportAggregateBucket[];
      proxy: LagReportAggregateBucket[];
      category: LagReportAggregateBucket[];
    }>({ server: [], proxy: [], category: [] });

    // One counter across dimensions: only one editor is open at a time, and a
    // newer open must always win over any slower older fetch.
    let facetSeq = 0;

    // A failed suggestion fetch must not read as "nothing exists" — the
    // editors show a note instead of a bare empty list.
    const facetError = ref(false);

    async function loadFacet(key: FilterKey) {
      const seq = ++facetSeq;
      facetError.value = false;
      try {
        if (key === "server") {
          const params = filterParams(filtersStore);
          delete params.serverNames;
          delete params.serverNodeIds;
          const buckets = await lagReportsStore.fetchAggregate({ ...params, groupBy: "server" });
          if (seq === facetSeq) facetBuckets.value.server = buckets;
        } else if (key === "proxy") {
          const params = filterParams(filtersStore);
          delete params.proxyName;
          const buckets = await lagReportsStore.fetchAggregate({ ...params, groupBy: "proxy" });
          if (seq === facetSeq) facetBuckets.value.proxy = buckets;
        } else if (key === "categories") {
          const params = filterParams(filtersStore);
          delete params.issueCategories;
          const buckets = await lagReportsStore.fetchAggregate({ ...params, groupBy: "category" });
          if (seq === facetSeq) facetBuckets.value.category = buckets;
        }
      } catch (_e) {
        if (seq === facetSeq) facetError.value = true;
      }
    }

    const serverCounts = computed(() => {
      const counts = new Map<string, number>();
      for (const bucket of facetBuckets.value.server) {
        if (bucket.serverNodeName) counts.set(bucket.serverNodeName, bucket.count);
      }
      return counts;
    });

    // Selected entries lead the list — exact node picks first, then typed name
    // prefixes (marked as such), then the suggestions — so a term typed by
    // hand, or one whose rows fall outside the current search, stays visible
    // and removable instead of disappearing behind the suggestions. A null
    // count means the value matches no fetched bucket, not nothing at all.
    const serverOptions = computed<ServerOption[]>(() => {
      const selectedNodes = filtersStore.serverNodes.map((node) => ({
        key: `node-${node.id}`,
        label: node.name,
        count: serverCounts.value.get(node.name) ?? null,
        selected: true,
        kind: "node" as const,
        nodeId: node.id,
        name: node.name,
      }));
      const selectedPrefixes = filtersStore.serverNames.map((name) => ({
        key: `prefix-${name}`,
        label: `${name}… (name filter)`,
        count: null,
        selected: true,
        kind: "prefix" as const,
        name,
      }));
      const needle = serverInput.value.trim().toLowerCase();
      const suggestions = facetBuckets.value.server
        .filter((b): b is typeof b & { serverNodeName: string; serverNodeId: number } =>
          !!b.serverNodeName && b.serverNodeId !== undefined
        )
        .filter((b) => !filtersStore.serverNodes.some((n) => n.id === b.serverNodeId))
        .filter((b) => !needle || b.serverNodeName.toLowerCase().startsWith(needle))
        .slice(0, FACET_LIMIT)
        .map((b) => ({
          key: `sugg-${b.serverNodeId}`,
          label: b.serverNodeName,
          count: b.count,
          selected: false,
          kind: "node" as const,
          nodeId: b.serverNodeId,
          name: b.serverNodeName,
        }));
      return [...selectedNodes, ...selectedPrefixes, ...suggestions];
    });

    const proxyFacets = computed<Array<[string, number]>>(() => {
      const needle = filtersStore.proxyName.trim().toLowerCase();
      return facetBuckets.value.proxy
        .filter((b): b is typeof b & { proxyName: string } => !!b.proxyName)
        .filter((b) => !needle || b.proxyName.toLowerCase().startsWith(needle))
        .slice(0, FACET_LIMIT)
        .map((b) => [b.proxyName, b.count]);
    });

    // With nothing typed this list is a "who reports most" leaderboard, so it
    // shows repeat players only. Once someone types they are after one specific
    // person, and holding the repeat gate would hide anyone with a single
    // report — exactly the search that looks broken.
    const playerFacets = computed<Array<[string, number]>>(() => {
      const needle = filtersStore.battleTag.trim().toLowerCase();
      return [...lagReportsStore.playerSubmittedCounts.entries()]
        .filter(([tag, count]) => (needle ? tag.toLowerCase().startsWith(needle) : count >= 2))
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, FACET_LIMIT);
    });

    const playerFacetHeading = computed(() =>
      filtersStore.battleTag.trim() ? "Matches in the selected range" : "Top reporters (selected range)"
    );

    const categoryItems = computed(() => {
      const counts = new Map<string, number>(ISSUE_CATEGORY_OPTIONS.map((cat) => [cat, 0]));
      for (const bucket of facetBuckets.value.category) {
        if (bucket.category && counts.has(bucket.category)) counts.set(bucket.category, bucket.count);
      }
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => ({
          value: cat,
          label: `${cat} (${count})`,
          active: filtersStore.issueCategories.includes(cat),
        }));
    });

    const tagItems = computed(() =>
      TAG_OPTIONS.map((tag) => ({
        value: tag,
        label: tag,
        active: filtersStore.connectionIssueTag === tag,
      }))
    );

    return {
      filtersStore,
      toolbarChips,
      activeFilterCount,
      addMenu,
      addMenuOpen,
      openEditor,
      addFilter,
      onTogglePin,
      onEditorToggle,
      removeFilter,
      clearAllFilters,
      setTextFilter,
      applyFacet,
      serverInput,
      serverOptions,
      addServerTerm,
      toggleServerOption,
      setMinRepeat,
      setRepeatMode,
      setPlayerBound,
      setTagFilter,
      toggleCategory,
      setDateBound,
      datePresets,
      applyDatePreset,
      playerFacets,
      playerFacetHeading,
      proxyFacets,
      categoryItems,
      tagItems,
      facetError,
      mdiFilterRemove,
      mdiPlus,
      mdiStar,
      mdiStarOutline,
    };
  },
});
</script>

<style lang="scss" scoped>
// A flex item won't shrink below its content width by default, so without this
// a long chip list pushes the view controls off the row instead of wrapping
// inside its own group.
.filter-group {
  min-width: 0;
}
</style>
