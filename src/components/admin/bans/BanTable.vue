<template>
  <div class="ban-table">
    <v-data-table-server
      :headers="headers"
      :items="bans"
      :items-length="total"
      :items-per-page="BANS_PAGE_SIZE"
      :items-per-page-options="[{ value: BANS_PAGE_SIZE, title: String(BANS_PAGE_SIZE) }]"
      :page="page"
      :loading="loading"
      :sort-by="sortBy"
      :expanded="expanded"
      :row-props="rowProps"
      :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
      :hide-default-footer="!showPager"
      :no-data-text="t(key('no_bans_match'))"
      :must-sort="scope === 'log'"
      initial-sort-order="desc"
      item-value="id"
      density="compact"
      @update:page="(value: number) => emit('update:page', value)"
      @update:sort-by="onSortBy"
      @update:expanded="onExpanded"
    >
      <template v-slot:[`header.actions`]>
        <span class="ban-sr">{{ t(key("col_actions")) }}</span>
      </template>

      <template v-slot:[`item.player`]="{ item }">
        <template v-if="scope === 'log'">
          <span class="ban-line ban-player-line">
            <a class="ban-tag" :href="accountHref(item.accountKey)" :title="item.battleTag" @click="onOpenAccount($event, item.accountKey)">{{ item.battleTag }}</a>
            <v-tooltip v-if="item.otherBansInEffect > 0" location="bottom" :text="countText('other_in_effect', item.otherBansInEffect, tr)">
              <template v-slot:activator="{ props: activator }">
                <span v-bind="activator" class="ban-others" tabindex="0">+{{ item.otherBansInEffect }}</span>
              </template>
            </v-tooltip>
          </span>
          <span class="ban-line ban-line2 text-medium-emphasis">{{ isRenamed(item) ? t(key("now_tag"), { tag: item.currentBattleTag }) : "" }}</span>
        </template>
        <span v-else class="ban-line"><b class="ban-tag" :title="item.battleTag">{{ item.battleTag }}</b></span>
      </template>

      <template v-slot:[`item.gameModes`]="{ item }">
        <ban-mode-chips
          :game-modes="item.gameModes"
          :machine-id-count="hasMachineAccess && item.machine ? item.machine.machineIds.length : undefined"
          :new-machine-id-count="hasMachineAccess && item.machine ? item.machine.newMachineIdCount : undefined"
          @cut="(cut: boolean) => onCut(item.id, cut)"
        />
      </template>

      <template v-slot:[`item.ends`]="{ item }">
        <span class="ban-line" :class="{ 'ban-ends--struck': item.status === 'revoked' }">
          {{ endsText(item, tr) }}
          <v-tooltip activator="parent" location="bottom" :text="endsTooltip(item, tr)" />
        </span>
        <span class="ban-line ban-line2" :class="`ban-state--${item.status}`">{{ statusWords(item, format().now, tr) }}</span>
      </template>

      <template v-slot:[`item.lastChange`]="{ item }">
        <span class="ban-line">
          {{ lastChangeText(item, format().now, tr) }}
          <v-tooltip activator="parent" location="bottom" :text="formatUtc(item.lastChange.at)" />
        </span>
        <span class="ban-line ban-line2 text-medium-emphasis">
          {{ lastChangeByText(item, tr) }}
          <v-tooltip activator="parent" location="bottom" :text="lastChangeByTooltip(item, tr)" />
        </span>
      </template>

      <template v-slot:[`item.banReason`]="{ item }">
        <div class="ban-reason-cell">{{ item.banReason }}</div>
      </template>

      <template v-slot:[`item.actions`]="{ item, internalItem, isExpanded, toggleExpand }">
        <div class="ban-actions">
          <template v-if="item.status === 'inEffect'">
            <v-btn :icon="mdiPencil" size="small" variant="text" :aria-label="t(key('action_edit'))" @click="emit('edit', item)" />
            <v-btn :icon="mdiCancel" size="small" variant="text" color="error" :aria-label="t(key('action_revoke'))" @click="emit('revoke', item)" />
          </template>
          <v-btn
            :icon="isExpanded(internalItem) ? mdiChevronUp : mdiChevronDown"
            size="small"
            variant="text"
            :aria-expanded="isExpanded(internalItem)"
            :aria-label="t(key(isExpanded(internalItem) ? 'action_close' : 'action_open'))"
            @click="toggleExpand(internalItem)"
          />
        </div>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
        <tr class="ban-detail-row">
          <td :colspan="columns.length">
            <ban-detail
              :ban="item"
              :scope="scope"
              :modes-cut="cutById[item.id] === true"
              @open-account="(accountKey: string) => emit('openAccount', accountKey)"
              @ban-again="(ban: BanView) => emit('banAgain', ban)"
            />
          </td>
        </tr>
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { mdiCancel, mdiChevronDown, mdiChevronUp, mdiPencil } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanPermissions } from "@/composables/useBanPermissions";
import { formatUtc } from "@/helpers/utc-dates";
import { BANS_PAGE_SIZE } from "@/store/admin/bans/listQuery";
import { countText, key } from "@/store/admin/bans/translate";
import type { BanView } from "@/store/admin/bans/types";
import { endsText, endsTooltip, isRenamed, lastChangeByText, lastChangeByTooltip, lastChangeText, statusWords } from "@/store/admin/bans/wording";
import BanDetail from "./BanDetail.vue";
import BanModeChips from "./BanModeChips.vue";

type SortKey = "lastChange" | "ends";
type SortDir = "asc" | "desc";

const props = defineProps<{
  bans: BanView[];
  total: number;
  scope: "log" | "account";
  page: number;
  sort: SortKey | null;
  dir: SortDir;
  loading: boolean;
  showPager: boolean;
}>();
const emit = defineEmits<{
  (e: "update:page", page: number): void;
  (e: "update:sort", value: { sort: SortKey; dir: SortDir }): void;
  (e: "openAccount", accountKey: string): void;
  (e: "edit", ban: BanView): void;
  (e: "revoke", ban: BanView): void;
  (e: "banAgain", ban: BanView): void;
}>();

const { t } = useI18n();
const { tr, format, accountHref } = useBanFormat();
const { hasMachineAccess } = useBanPermissions();

const expanded = ref<string[]>([]);
// Per ban id: some mode chips are hidden behind "+N" (the opened row then lists them in full).
const cutById = ref<Record<string, boolean>>({});

const sortable = computed(() => props.scope === "log");
const headers = computed<DataTableHeader[]>(() => [
  { title: t(key(props.scope === "log" ? "col_player" : "col_banned_as")), key: "player", sortable: false, width: 224 },
  { title: t(key("col_banned_from")), key: "gameModes", sortable: false, width: 188 },
  { title: t(key("col_ends")), key: "ends", sortable: sortable.value, width: 118 },
  { title: t(key("col_last_change")), key: "lastChange", sortable: sortable.value, width: 168 },
  { title: t(key("col_reason")), key: "banReason", sortable: false },
  { title: t(key("col_actions")), key: "actions", sortable: false, width: 96 },
]);

// null shows Last change, newest first.
const sortBy = computed(() => (sortable.value ? [{ key: props.sort ?? "lastChange", order: props.sort === null ? "desc" : props.dir }] : []));

function onSortBy(value: { key: string; order?: boolean | "asc" | "desc" }[]): void {
  const first = value[0];
  if (!first || (first.key !== "ends" && first.key !== "lastChange")) return;
  emit("update:sort", { sort: first.key, dir: first.order === "asc" ? "asc" : "desc" });
}

// One opened row at a time.
function onExpanded(value: string[]): void {
  expanded.value = value.slice(-1);
}

function onCut(id: string, cut: boolean): void {
  cutById.value = { ...cutById.value, [id]: cut };
}

function onOpenAccount(event: MouseEvent, accountKey: string): void {
  if (event.ctrlKey || event.metaKey || event.shiftKey) return; // the browser opens the link in a new tab
  event.preventDefault();
  emit("openAccount", accountKey);
}

function rowProps({ item }: { item: BanView }): Record<string, string> {
  return { class: `ban-row ban-row--${item.status}`, "data-ban-id": item.id };
}
</script>

<style scoped>
.ban-table {
  --ban-in-effect: rgb(var(--v-theme-error));
  --ban-expired: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  --ban-revoked: color-mix(in srgb, rgb(var(--v-theme-info)) 70%, rgb(var(--v-theme-on-surface)));
}
.ban-table :deep(table) {
  table-layout: fixed;
}
.ban-table :deep(td) {
  vertical-align: top;
  overflow: hidden;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
.ban-table :deep(.ban-row > td:first-child) {
  box-shadow: inset 5px 0 0 var(--ban-edge);
}
.ban-table :deep(.ban-row--inEffect) {
  --ban-edge: var(--ban-in-effect);
}
.ban-table :deep(.ban-row--expired) {
  --ban-edge: var(--ban-expired);
}
.ban-table :deep(.ban-row--revoked) {
  --ban-edge: var(--ban-revoked);
}
.ban-line {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ban-line2 {
  min-height: 1.25rem;
  font-size: 0.8125rem;
}
.ban-player-line {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.ban-tag {
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  color: inherit;
  text-overflow: ellipsis;
}
.ban-others {
  flex: none;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ban-in-effect);
  cursor: help;
}
.ban-ends--struck {
  text-decoration: line-through;
}
.ban-state--inEffect {
  color: var(--ban-in-effect);
}
.ban-state--expired {
  color: var(--ban-expired);
}
.ban-state--revoked {
  color: var(--ban-revoked);
}
.ban-reason-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.ban-actions {
  display: flex;
  justify-content: flex-end;
  white-space: nowrap;
}
.ban-detail-row > td {
  background: rgba(var(--v-theme-on-surface), 0.04);
  box-shadow: inset 5px 0 0 rgba(var(--v-border-color), var(--v-border-opacity));
}
.ban-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
