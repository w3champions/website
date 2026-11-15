<template>
  <div class="ban-toolbar">
    <account-lookup class="ban-toolbar-lookup" :label="t(key('lookup_label'))" :initial-text="lookupText" @pick="onPick" />
    <v-select
      class="ban-toolbar-select"
      :model-value="query.status"
      :items="statusItems"
      :label="t(key('filter_status'))"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value: BanStatus | null) => emit('update:query', { ...query, status: value, page: 1 })"
    />
    <v-select
      class="ban-toolbar-select"
      :model-value="query.author"
      :items="authorItems"
      :label="t(key('filter_moderator'))"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value: string | null) => emit('update:query', { ...query, author: value, page: 1 })"
    />
    <v-checkbox
      v-if="hasMachineAccess"
      :model-value="machineOnly"
      :label="t(key('filter_machine_only'))"
      density="compact"
      hide-details
      @update:model-value="(value: boolean | null) => emit('update:machineOnly', value === true)"
    />
    <v-btn class="bg-primary text-w3-race-bg ban-toolbar-add" @click="emit('add')">{{ t(key("add_ban")) }}</v-btn>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanPermissions } from "@/composables/useBanPermissions";
import { BAN_STATUSES, type BanPageQuery } from "@/store/admin/bans/listQuery";
import { key } from "@/store/admin/bans/translate";
import type { AccountSuggestion, BanStatus } from "@/store/admin/bans/types";
import { statusLabel } from "@/store/admin/bans/wording";
import AccountLookup from "./AccountLookup.vue";

const props = defineProps<{ query: BanPageQuery; machineOnly: boolean; authors: string[]; lookupText?: string }>();
const emit = defineEmits<{
  (e: "update:query", query: BanPageQuery): void;
  (e: "update:machineOnly", on: boolean): void;
  (e: "add"): void;
  (e: "openAccount", accountKey: string, matchedTag: string): void;
}>();

const { t } = useI18n();
const { tr } = useBanFormat();
const { hasMachineAccess } = useBanPermissions();

const statusItems = computed(() => [{ title: t(key("filter_all")), value: null }, ...BAN_STATUSES.map((status) => ({ title: statusLabel(status, tr), value: status }))]);
const authorItems = computed(() => [{ title: t(key("filter_all")), value: null }, ...props.authors.map((author) => ({ title: author, value: author }))]);

const onPick = (suggestion: AccountSuggestion): void => emit("openAccount", suggestion.accountKey, suggestion.matchedBattleTag);
</script>

<style scoped>
.ban-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ban-toolbar-lookup {
  flex: 1 1 320px;
  min-width: 240px;
}

.ban-toolbar-select {
  flex: 0 0 180px;
}

.ban-toolbar-add {
  flex: 0 0 auto;
}
</style>
