<template>
  <div class="ban-detail">
    <div class="ban-detail-grid">
      <div>
        <div class="ban-label text-medium-emphasis">{{ t(key("detail_reason")) }}</div>
        <div class="ban-reason" :class="{ 'ban-reason--clamped': longReason && !reasonOpen }">{{ ban.banReason }}</div>
        <v-btn v-if="longReason && !reasonOpen" variant="text" size="small" color="primary" class="px-0" @click="reasonOpen = true">
          {{ t(key("detail_show_all_reason"), { count: ban.banReason.length.toLocaleString("en") }) }}
        </v-btn>
      </div>
      <div>
        <div class="ban-label text-medium-emphasis">{{ t(key("detail_shown")) }}</div>
        <template v-if="shownReason">
          <span class="ban-reason">{{ shownReason.text }}</span>
          <span class="text-medium-emphasis"> ({{ t(key(shownReason.kind === "free" ? "detail_shown_free" : "detail_shown_translation")) }})</span>
        </template>
        <span v-else class="text-medium-emphasis">{{ t(key("detail_shown_none")) }}</span>
      </div>
    </div>

    <div v-if="modesCut" class="ban-detail-block">
      <div class="ban-label text-medium-emphasis">{{ t(key("detail_modes"), { count: ban.gameModes.length }) }}</div>
      <v-chip v-for="mode in ban.gameModes" :key="mode" class="mr-1 mb-1" size="small" variant="tonal" label>{{ modeName(mode) }}</v-chip>
    </div>

    <div class="ban-detail-block">
      <div class="ban-label text-medium-emphasis">{{ t(key("detail_record")) }}</div>
      <div class="ban-record-line">{{ bannedAsText(ban, tr) }}</div>
      <div class="ban-record-line">{{ issuedText(ban, tr) }}</div>
      <div class="ban-record-line">{{ endLine }}</div>
      <template v-if="latest">
        <div v-for="{ change, line } in changeLines" :key="change.at + change.field" class="ban-change">
          {{ t(key("detail_change"), { when: formatUtc(change.at), by: change.by }) }}
          {{ line.field }} <s>{{ line.old }}</s> → <b>{{ line.new }}</b>
        </div>
        <v-btn v-if="olderCount > 0 && !changesOpen" variant="text" size="small" color="primary" class="px-0" @click="changesOpen = true">
          {{ t(key("detail_all_changes"), { count: ban.changes.length }) }}
        </v-btn>
      </template>
      <div v-if="ban.revoked" class="ban-revoked">
        {{ t(key("detail_revoked"), { when: formatUtc(ban.revoked.at), by: ban.revoked.by, note: ban.revoked.note }) }}
      </div>
    </div>

    <div v-if="hasMachineAccess && ban.machine" class="ban-detail-block">
      <div class="ban-label text-medium-emphasis">{{ t(key("detail_machine_ids"), { count: ban.machine.machineIds.length }) }}</div>
      <code v-for="id in shownMachineIds" :key="id" class="mr-2">{{ id }}</code>
      <v-btn v-if="ban.machine.machineIds.length > MACHINE_IDS_SHOWN && !machineIdsOpen" variant="text" size="small" color="primary" @click="machineIdsOpen = true">
        {{ t(key("detail_machine_all"), { count: ban.machine.machineIds.length }) }}
      </v-btn>
    </div>

    <div v-if="scope === 'log' || ban.status !== 'inEffect'" class="ban-detail-foot text-medium-emphasis">
      <span v-if="scope === 'log'" class="ban-account-line">
        <template v-if="account">
          <template v-if="single">{{ t(key("detail_account_single")) }}</template>
          <template v-else>
            {{ t(key("detail_account_counts"), counts) }}<template v-if="account.names.length > 1">{{ t(key("detail_account_names"), { count: account.names.length }) }}</template>
            ·
            <a class="ban-open-account" :href="accountHref(ban.accountKey)" @click="onOpenAccount">{{ t(key("open_account")) }}</a>
          </template>
        </template>
        <v-progress-circular v-else-if="store.rowAccountLoading" class="ban-account-loading" size="16" width="2" indeterminate />
        <template v-else-if="store.rowAccountError">
          {{ banErrorText(store.rowAccountError, tr) }}
          <v-btn variant="text" size="small" @click="store.loadRowAccount(ban.accountKey)">{{ t(key("retry")) }}</v-btn>
        </template>
      </span>
      <v-btn v-if="ban.status !== 'inEffect'" variant="text" size="small" color="primary" @click="emit('banAgain', ban)">{{ t(key("ban_again")) }}</v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanPermissions } from "@/composables/useBanPermissions";
import { formatUtc } from "@/helpers/utc-dates";
import { banErrorText } from "@/store/admin/bans/errors";
import { useBansStore } from "@/store/admin/bans/store";
import { countText, key } from "@/store/admin/bans/translate";
import { bannedAsText, changeLine, issuedText, shownReasonOf } from "@/store/admin/bans/wording";
import type { BanView } from "@/store/admin/bans/types";
import { useAdminStore } from "@/store/admin/store";

const props = defineProps<{ ban: BanView; scope: "log" | "account"; modesCut: boolean }>();
const emit = defineEmits<{
  (e: "openAccount", accountKey: string): void;
  (e: "banAgain", ban: BanView): void;
}>();

// Layout limits of the opened row: a reason above these is clamped at 6 lines.
const REASON_CLAMP_CHARS = 480;
const REASON_CLAMP_LINES = 6;
const MACHINE_IDS_SHOWN = 6;

const { t } = useI18n();
const { tr, modeName, format, accountHref } = useBanFormat();
const { hasMachineAccess } = useBanPermissions();
const store = useBansStore();
const adminStore = useAdminStore();

const reasonOpen = ref(false);
const changesOpen = ref(false);
const machineIdsOpen = ref(false);

const translationName = (id: string): string | undefined => adminStore.banReasonTranslations.find((x) => x._id === id)?.translations.en;

const longReason = computed(() => props.ban.banReason.length > REASON_CLAMP_CHARS || props.ban.banReason.split("\n").length > REASON_CLAMP_LINES);
const shownReason = computed(() => shownReasonOf(props.ban.userVisibleBanReason, translationName, tr));

const endLine = computed(() => {
  if (props.ban.endDate === null) return t(key("detail_no_end"));
  const name = props.ban.status === "revoked" ? "detail_was_to_end" : props.ban.status === "expired" ? "detail_ended" : "detail_ends";
  return t(key(name), { date: formatUtc(props.ban.endDate) });
});

// Newest first.
const newestFirst = computed(() => [...props.ban.changes].reverse());
const latest = computed(() => newestFirst.value[0]);
const visibleChanges = computed(() => (changesOpen.value ? newestFirst.value : newestFirst.value.slice(0, 1)));
const olderCount = computed(() => props.ban.changes.length - 1);

const changeLines = computed(() => visibleChanges.value.map((change) => ({ change, line: changeLine(change, format(), translationName) })));

const shownMachineIds = computed(() => (machineIdsOpen.value ? props.ban.machine?.machineIds : props.ban.machine?.machineIds.slice(0, MACHINE_IDS_SHOWN)) ?? []);

const account = computed(() => (store.rowAccount?.accountKey === props.ban.accountKey ? store.rowAccount : null));
const single = computed(() => account.value !== null && account.value.counts.total === 1 && account.value.names.length === 1);
const counts = computed(() => ({
  bans: countText("bans", account.value?.counts.total ?? 0, tr),
  inEffect: account.value?.counts.inEffect ?? 0,
  expired: account.value?.counts.expired ?? 0,
  revoked: account.value?.counts.revoked ?? 0,
}));

function onOpenAccount(event: MouseEvent): void {
  if (event.ctrlKey || event.metaKey || event.shiftKey) return; // the browser opens the link in a new tab
  event.preventDefault();
  emit("openAccount", props.ban.accountKey);
}

onMounted(() => {
  if (props.scope === "log") void store.loadRowAccount(props.ban.accountKey);
});
</script>

<style scoped>
.ban-detail {
  padding: 8px 0;
}
.ban-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 6px 28px;
}
.ban-detail-block {
  margin-top: 10px;
}
.ban-label {
  font-size: 0.8125rem;
}
.ban-reason {
  overflow-wrap: anywhere;
  max-width: 80ch;
  white-space: pre-wrap;
}
.ban-reason--clamped {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ban-detail-foot {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
