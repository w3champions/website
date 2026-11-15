<template>
  <div>
    <v-card-title class="pt-3">
      {{ t(key("title")) }}
    </v-card-title>
    <v-container v-if="permissionsKnown && !canModerate" class="w3-container-width">
      <v-alert type="warning" variant="tonal">{{ t(key("no_permission")) }}</v-alert>
    </v-container>
    <v-container v-else-if="canModerate" class="w3-container-width bans-page">
      <v-alert v-if="notice" :type="notice.type" variant="tonal" closable role="status" class="bans-notice" @click:close="notice = null">
        {{ notice.text }}
      </v-alert>

      <template v-if="store.query.account !== null">
        <v-alert v-if="store.accountError" type="error" variant="tonal" density="compact" class="bans-account-error">
          {{ banErrorText(store.accountError, tr) }}
          <template v-slot:append>
            <v-btn variant="text" @click="store.loadAccount()">{{ t(key("retry")) }}</v-btn>
          </template>
        </v-alert>
        <ban-account-view
          v-else-if="shownAccount"
          :account="shownAccount"
          :bans="store.bans"
          :total="store.total"
          :query="store.query"
          :loading="store.listLoading"
          :matched-tag="matchedTag"
          :list-failed="store.listError !== null"
          @update:query="replaceQuery"
          @back="openAccount(null)"
          @add="openAdd(store.query.account, null)"
          @open-account="(accountKey: string) => openAccount(accountKey)"
          @edit="openEdit"
          @revoke="openRevoke"
          @ban-again="banAgain"
        >
          <template v-slot:list-error>
            <v-alert type="error" variant="tonal" density="compact" class="bans-list-error">
              {{ banErrorText(store.listError, tr) }}
              <template v-slot:append>
                <v-btn variant="text" @click="store.loadList()">{{ t(key("retry")) }}</v-btn>
              </template>
            </v-alert>
          </template>
        </ban-account-view>
        <v-progress-linear v-else indeterminate />
      </template>

      <template v-else>
        <ban-toolbar
          :query="store.query"
          :machine-only="store.machineOnly"
          :authors="store.authors"
          :lookup-text="lookupText"
          @update:query="replaceQuery"
          @update:machine-only="setMachineOnly"
          @add="openAdd(null, null)"
          @open-account="(accountKey: string, tag: string) => openAccount(accountKey, tag)"
        />
        <v-alert v-if="store.listError" type="error" variant="tonal" density="compact" class="bans-list-error">
          {{ banErrorText(store.listError, tr) }}
          <template v-slot:append>
            <v-btn variant="text" @click="store.loadList()">{{ t(key("retry")) }}</v-btn>
          </template>
        </v-alert>
        <p v-if="noneMatch" class="text-medium-emphasis bans-none">{{ t(key("no_bans_match")) }}</p>
        <ban-table
          v-else
          :bans="store.bans"
          :total="store.total"
          scope="log"
          :page="store.query.page"
          :sort="store.query.sort"
          :dir="store.query.dir"
          :loading="store.listLoading"
          show-pager
          @update:page="(page: number) => replaceQuery({ ...store.query, page })"
          @update:sort="(value: SortChange) => replaceQuery({ ...store.query, ...value, page: 1 })"
          @open-account="(accountKey: string) => openAccount(accountKey)"
          @edit="openEdit"
          @revoke="openRevoke"
          @ban-again="banAgain"
        />
      </template>

      <ban-dialog
        v-model="dialogOpen"
        :mode="dialog.mode"
        :ban="dialog.ban"
        :account-key="dialog.accountKey"
        :initial-draft="dialog.initialDraft"
        @saved="onSaved"
        @edit-instead="editInstead"
      >
        <template v-slot:player="{ pick }">
          <account-lookup :label="t(key('player_lookup_label'))" @pick="pick" />
        </template>
      </ban-dialog>
      <revoke-dialog v-model="revokeOpen" :ban="revoking" @revoked="onRevoked" />
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { type LocationQuery, useRoute, useRouter } from "vue-router";
import { loadActiveGameModes } from "@/composables/GameModesMixin";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanPermissions } from "@/composables/useBanPermissions";
import { againDraft, type BanDraft } from "@/store/admin/bans/banForm";
import { banErrorText } from "@/store/admin/bans/errors";
import { type BanPageQuery, DEFAULT_PAGE_QUERY, entryPlayerFromRoute, pageQueryFromRoute, pageQueryToRoute, withAccount } from "@/store/admin/bans/listQuery";
import { resolvePlayerEntry } from "@/store/admin/bans/lookup";
import { useBansStore } from "@/store/admin/bans/store";
import { key } from "@/store/admin/bans/translate";
import type { BanView } from "@/store/admin/bans/types";
import { revokedNoticeText } from "@/store/admin/bans/wording";
import { EAdminRouteName } from "@/router/types";
import { useAdminStore } from "@/store/admin/store";
import AccountLookup from "./bans/AccountLookup.vue";
import BanAccountView from "./bans/BanAccountView.vue";
import BanDialog from "./bans/BanDialog.vue";
import BanTable from "./bans/BanTable.vue";
import BanToolbar from "./bans/BanToolbar.vue";
import RevokeDialog from "./bans/RevokeDialog.vue";

type SortChange = { sort: "lastChange" | "ends"; dir: "asc" | "desc" };
interface Notice {
  type: "info" | "error";
  text: string;
}
interface DialogState {
  mode: "add" | "edit";
  ban: BanView | null;
  accountKey: string | null;
  initialDraft: BanDraft | null;
}

const { t } = useI18n();
const { tr } = useBanFormat();
const { canModerate, hasMachineAccess, permissionsKnown } = useBanPermissions();
const route = useRoute();
const router = useRouter();
const store = useBansStore();
const adminStore = useAdminStore();

const notice = ref<Notice | null>(null);
/** The name picked in the lookup that led to the shown account; any other way in clears it. */
const matchedTag = ref<string | null>(null);
/** A `?player=` name the lookup starts with. */
const lookupText = ref<string | undefined>(undefined);
const dialogOpen = ref(false);
const dialog = ref<DialogState>({ mode: "add", ban: null, accountKey: null, initialDraft: null });
const revokeOpen = ref(false);
const revoking = ref<BanView | null>(null);
/** The URL is applied only once a `?player=` entry link has been resolved. */
const ready = ref(false);
let appliedKey: string | null = null;
/** The lookup pick (or `?player=` match) that the next account change belongs to. */
let pendingPick: { accountKey: string | null; tag: string | null } | null = null;

/** The account view only for the account in the URL, not the one before it while the next loads. */
const shownAccount = computed(() => (store.account?.accountKey === store.query.account ? store.account : null));
const filtered = computed(() => store.query.status !== null || store.query.author !== null || store.machineOnly);
const noneMatch = computed(() => filtered.value && store.total === 0 && !store.listLoading && store.listError === null);

/** Loads what the URL asks for; the same query again (a replace that only dropped `player`) loads nothing. */
function applyRoute(query: LocationQuery): void {
  if (!ready.value || !canModerate.value) return;
  const pageQuery = pageQueryFromRoute(query);
  const applied = JSON.stringify(pageQuery);
  if (applied === appliedKey) return;
  if (pageQuery.account !== store.query.account) {
    if (appliedKey !== null) notice.value = null;
    // A pick names the account it led to; Back, Forward or any other way in names none.
    matchedTag.value = pendingPick?.accountKey === pageQuery.account ? pendingPick.tag : null;
  }
  pendingPick = null;
  appliedKey = applied;
  void store.setQuery(pageQuery);
}

/** Status, moderator, sort and page: no history entry of their own. */
function replaceQuery(query: BanPageQuery): void {
  router.replace({ query: pageQueryToRoute(query) }).catch(() => null);
}

/** Opening or leaving an account is a history entry, so Back returns to the same page of the log. */
function openAccount(accountKey: string | null, tag: string | null = null): void {
  pendingPick = { accountKey, tag };
  router.push({ query: pageQueryToRoute(withAccount(store.query, accountKey)) }).catch(() => null);
}

/** The machine filter never reaches the URL; it starts the log at page 1. */
function setMachineOnly(on: boolean): void {
  if (store.query.page === 1) {
    void store.setMachineOnly(on);
    return;
  }
  store.$patch({ machineOnly: on });
  replaceQuery({ ...store.query, page: 1 });
}

function openAdd(accountKey: string | null, initialDraft: BanDraft | null): void {
  dialog.value = { mode: "add", ban: null, accountKey, initialDraft };
  dialogOpen.value = true;
}

function openEdit(ban: BanView): void {
  dialog.value = { mode: "edit", ban, accountKey: ban.accountKey, initialDraft: null };
  dialogOpen.value = true;
}

function banAgain(ban: BanView): void {
  openAdd(ban.accountKey, againDraft(ban));
}

function openRevoke(ban: BanView): void {
  revoking.value = ban;
  revokeOpen.value = true;
}

/** `accountKey` is the dialog's account: the locked one, or the one picked inside the dialog. */
async function editInstead(banId: string, accountKey: string): Promise<void> {
  dialogOpen.value = false;
  try {
    const ban = await store.banInEffect(accountKey, banId);
    if (ban === null) notice.value = { type: "error", text: t(key("error_ban_not_found")) };
    else openEdit(ban);
  } catch (e) {
    notice.value = { type: "error", text: banErrorText(e, tr) };
  }
}

function onSaved(): void {
  notice.value = { type: "info", text: t(key(dialog.value.mode === "edit" ? "notice_edited" : "notice_created")) };
}

function onRevoked(view: BanView): void {
  notice.value = { type: "info", text: revokedNoticeText(view, tr) };
}

let unmounted = false;
/** Still the bans page: an entry lookup that outlives it must neither touch another page's query nor load anything. */
function onThisPage(): boolean {
  return !unmounted && route.name === EAdminRouteName.BANNED_PLAYERS;
}

/** `?player=<name>`: opens that player's account, or hands the name to the lookup; the parameter goes without a history entry. */
async function resolveEntry(name: string): Promise<void> {
  try {
    const entry = await resolvePlayerEntry(name);
    if (!onThisPage()) return;
    if (entry.kind === "account") {
      pendingPick = { accountKey: entry.accountKey, tag: entry.matchedBattleTag };
      await router.replace({ query: pageQueryToRoute(withAccount(DEFAULT_PAGE_QUERY, entry.accountKey)) });
      return;
    }
    lookupText.value = entry.lookupText;
  } catch (e) {
    if (!onThisPage()) return;
    notice.value = { type: "error", text: banErrorText(e, tr) };
    lookupText.value = name;
  }
  if (!onThisPage()) return;
  await router.replace({ query: pageQueryToRoute(pageQueryFromRoute(route.query)) });
}

let started = false;
async function start(): Promise<void> {
  if (started || !onThisPage()) return;
  started = true;
  void loadActiveGameModes();
  void adminStore.loadBanReasonTranslations();
  void store.loadAuthors();
  const name = entryPlayerFromRoute(route.query);
  if (name !== null) await resolveEntry(name);
  if (!onThisPage()) return;
  ready.value = true;
  applyRoute(route.query);
}

watch(() => route.query, applyRoute, { immediate: true });

// Machine access can go under a mounted page: its filter goes with it.
watch(hasMachineAccess, (has) => {
  if (!has && store.machineOnly) void store.setMachineOnly(false);
});

onMounted(() => {
  if (canModerate.value) void start();
});

// Permissions can arrive after the page mounted (a direct load): load once they do.
watch(canModerate, (can) => {
  if (can) void start();
});

onBeforeUnmount(() => {
  unmounted = true;
  store.clear();
});
</script>

<style scoped>
.bans-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bans-none {
  margin: 0;
}
</style>
