<template>
  <div class="ban-account-view">
    <account-header :account="account" :matched-tag="matchedTag" @back="emit('back')" @add="emit('add')" @open-account="(accountKey: string) => emit('openAccount', accountKey)" />
    <div v-if="showCounts" class="account-counts">
      <span class="account-counts-line">
        {{ t(key("account_counts"), counts) }}
        <span class="text-medium-emphasis">· {{ t(key("account_order")) }}</span>
      </span>
      <v-select
        class="account-status-select"
        :model-value="query.status"
        :items="statusItems"
        :label="t(key('filter_status'))"
        variant="outlined"
        density="compact"
        hide-details
        @update:model-value="(value: BanStatus | null) => emit('update:query', { ...query, status: value, page: 1 })"
      />
    </div>
    <p v-if="noneWithStatus" class="text-medium-emphasis account-none">{{ t(key("no_bans_with_status")) }}</p>
    <ban-table
      v-else
      :bans="bans"
      :total="total"
      scope="account"
      :page="query.page"
      :sort="null"
      :dir="query.dir"
      :loading="loading"
      :show-pager="total > BANS_PAGE_SIZE"
      @update:page="(page: number) => emit('update:query', { ...query, page })"
      @edit="(ban: BanView) => emit('edit', ban)"
      @revoke="(ban: BanView) => emit('revoke', ban)"
      @ban-again="(ban: BanView) => emit('banAgain', ban)"
      @open-account="(accountKey: string) => emit('openAccount', accountKey)"
    />
  </div>
</template>

<script lang="ts">
/** The counts line and the status filter appear only above this many bans. */
export const ACCOUNT_COUNTS_ABOVE = 3;
</script>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { BAN_STATUSES, BANS_PAGE_SIZE, type BanPageQuery } from "@/store/admin/bans/listQuery";
import { countText, key } from "@/store/admin/bans/translate";
import type { AccountView, BanStatus, BanView } from "@/store/admin/bans/types";
import { statusLabel } from "@/store/admin/bans/wording";
import AccountHeader from "./AccountHeader.vue";
import BanTable from "./BanTable.vue";

const props = defineProps<{ account: AccountView; bans: BanView[]; total: number; query: BanPageQuery; loading: boolean; matchedTag: string | null }>();
const emit = defineEmits<{
  (e: "update:query", query: BanPageQuery): void;
  (e: "back"): void;
  (e: "add"): void;
  (e: "openAccount", accountKey: string): void;
  (e: "edit", ban: BanView): void;
  (e: "revoke", ban: BanView): void;
  (e: "banAgain", ban: BanView): void;
}>();

const { t } = useI18n();
const { tr } = useBanFormat();

const showCounts = computed(() => props.account.counts.total > ACCOUNT_COUNTS_ABOVE);
const counts = computed(() => ({
  bans: countText("bans", props.account.counts.total, tr),
  inEffect: props.account.counts.inEffect,
  expired: props.account.counts.expired,
  revoked: props.account.counts.revoked,
}));
const noneWithStatus = computed(() => props.query.status !== null && props.total === 0 && !props.loading);

const statusItems = computed(() => [
  { title: t(key("filter_all")), value: null },
  ...BAN_STATUSES.map((status) => ({ title: t(key("status_option"), { status: statusLabel(status, tr), count: props.account.counts[status] }), value: status })),
]);
</script>

<style scoped>
.ban-account-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.account-counts {
  display: flex;
  align-items: center;
  gap: 16px;
}

.account-status-select {
  flex: 0 0 220px;
  margin-left: auto;
}

.account-none {
  margin: 0;
}
</style>
