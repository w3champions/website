<template>
  <div>
    <v-card-title class="pt-3">
      {{ t(key("title")) }}
    </v-card-title>
    <v-container v-if="permissionsKnown && !canQuery" class="w3-container-width">
      <v-alert type="warning" variant="tonal">{{ t(key("no_permission")) }}</v-alert>
    </v-container>
    <v-container v-else-if="canQuery" class="w3-container-width">
      <v-card class="mb-4">
        <v-card-text>
          <v-row class="align-center">
            <v-col cols="12" sm="9">
              <player-search
                ref="playerSearchComponent"
                :hideDetails="true"
                @playerFound="playerFound"
                @searchCleared="searchCleared"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-btn block color="primary" :disabled="!selectedPlayer" @click="search(selectedPlayer)">
                {{ t(key("search")) }}
              </v-btn>
            </v-col>
          </v-row>
          <div v-if="!store.battleTag" class="text-body-2 text-medium-emphasis mt-2">{{ t(key("search_hint")) }}</div>
        </v-card-text>
      </v-card>

      <template v-if="store.battleTag">
        <div class="d-flex align-center mb-3">
          <h2 class="text-h5">{{ store.battleTag }}</h2>
          <v-btn variant="text" size="small" class="ml-2" :href="getProfileUrl(store.battleTag)" @click.left.exact.prevent="goToProfile(store.battleTag)">
            {{ t("views_admin.profile") }}
          </v-btn>
        </div>

        <v-alert
          v-if="store.lastResult"
          type="success"
          variant="tonal"
          class="mb-4"
          closable
          role="status"
          @click:close="store.dismissResult()"
        >
          <div class="font-weight-bold">{{ t(key("recheck_queued")) }}</div>
          <div v-for="line in actionResultLines(store.lastResult.result, tr)" :key="line" class="text-body-2">{{ line }}</div>
        </v-alert>
        <v-alert v-if="store.actionError && !dialogOpen" type="error" variant="tonal" class="mb-4" closable @click:close="store.actionError = null">
          {{ errorText(store.actionError, tr) }}
        </v-alert>

        <hardware-links-card :can-administer="canAdminister" @action="openPairAction" @open-account="openAccount" />
        <hardware-items-card :can-administer="canAdminister" @action="openItemAction" />
        <hardware-audit-card />
      </template>

      <override-dialog
        v-model="dialogOpen"
        :copy="dialogCopy"
        :saving="store.acting"
        :error="store.actionError && dialogOpen ? errorText(store.actionError, tr) : ''"
        :holders-loading="needsHolders && store.itemDetailLoading"
        :holders-error="needsHolders && store.itemDetailError ? errorText(store.itemDetailError, tr) : ''"
        :ready="!needsHolders || store.itemDetail !== null"
        @confirm="confirm"
        @retry-holders="loadHolders"
      />
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onBeforeUnmount, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { getProfileUrl } from "@/helpers/url-functions";
import type { HardwareProfileItemView } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { EPermission } from "@/store/admin/permission/types";
import { type ActionOption, isWideImpact, type ItemAction, type OverrideAction, type PairAction } from "@/store/admin/hardwareSmurfs/actions";
import { actionDialogCopy } from "@/store/admin/hardwareSmurfs/dialogCopy";
import { errorText } from "@/store/admin/hardwareSmurfs/errors";
import { actionResultLines } from "@/store/admin/hardwareSmurfs/result";
import { type ActionTarget, useHardwareSmurfsStore } from "@/store/admin/hardwareSmurfs/store";
import { key, type Translate } from "@/store/admin/hardwareSmurfs/translate";
import { useOauthStore } from "@/store/oauth/store";
import HardwareAuditCard from "./hardware-smurfs/HardwareAuditCard.vue";
import HardwareItemsCard from "./hardware-smurfs/HardwareItemsCard.vue";
import HardwareLinksCard from "./hardware-smurfs/HardwareLinksCard.vue";
import OverrideDialog from "./hardware-smurfs/OverrideDialog.vue";

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const router = useRouter();
const route = useRoute();
const oauthStore = useOauthStore();
const store = useHardwareSmurfsStore();

const permissions = computed<string[]>(() => oauthStore.permissions);
const permissionsKnown = computed(() => permissions.value.length > 0);
const canQuery = computed(() => permissions.value.includes(EPermission[EPermission.SmurfCheckerQuery]));
const canAdminister = computed(() => permissions.value.includes(EPermission[EPermission.SmurfCheckerAdministration]));

type PlayerSearchType = InstanceType<typeof PlayerSearch>;
const playerSearchRef = useTemplateRef<PlayerSearchType>("playerSearchComponent");
const selectedPlayer = ref("");

function playerFound(battleTag: string): void {
  selectedPlayer.value = battleTag;
}

function searchCleared(): void {
  selectedPlayer.value = "";
  store.clear();
  router.replace({ query: { ...route.query, player: undefined } }).catch(() => null);
}

async function search(battleTag: string): Promise<void> {
  if (!battleTag) return;
  router.replace({ query: { ...route.query, player: battleTag } }).catch(() => null);
  await store.open(battleTag);
}

async function openAccount(battleTag: string): Promise<void> {
  selectedPlayer.value = battleTag;
  if (playerSearchRef.value) playerSearchRef.value.selected = battleTag;
  await search(battleTag);
}

function goToProfile(battleTag: string): void {
  router.push({ path: getProfileUrl(battleTag) }).catch(() => null);
}

// --- dialog ---

interface PendingAction {
  option: ActionOption;
  target: ActionTarget;
  other?: string;
  item?: { kind: string; hash8: string };
}

const pending = ref<PendingAction | null>(null);
const dialogOpen = ref(false);
const needsHolders = computed(() => pending.value !== null && isWideImpact(pending.value.option.action));

const dialogCopy = computed(() => {
  const p = pending.value;
  if (!p) return null;
  return actionDialogCopy({ action: p.option.action, replaces: p.option.replaces, battleTag: store.battleTag, other: p.other, item: p.item, holders: store.itemDetail?.holders ?? null }, tr);
});

function openDialog(next: PendingAction): void {
  store.actionError = null;
  store.clearItemDetail();
  pending.value = next;
  dialogOpen.value = true;
  if (isWideImpact(next.option.action)) loadHolders();
}

function openPairAction(option: ActionOption<PairAction>, other: string): void {
  openDialog({ option, target: { kind: "pair", other }, other });
}

function openItemAction(option: ActionOption<ItemAction>, item: HardwareProfileItemView): void {
  openDialog({ option, target: { kind: "item", hash8: item.hash8 }, item: { kind: item.kind, hash8: item.hash8 } });
}

function loadHolders(): void {
  const hash8 = pending.value?.target.kind === "item" ? pending.value.target.hash8 : null;
  if (hash8) void store.loadItemDetail(hash8);
}

async function confirm(reason: string): Promise<void> {
  const p = pending.value;
  if (!p) return;
  const action: OverrideAction = p.option.action;
  if (await store.runAction({ action, target: p.target, reason })) dialogOpen.value = false;
}

watch(dialogOpen, (open) => {
  if (!open) {
    pending.value = null;
    store.clearItemDetail();
  }
});

onMounted(async () => {
  const player = typeof route.query.player === "string" ? route.query.player : "";
  if (!player) return;
  selectedPlayer.value = player;
  if (playerSearchRef.value) playerSearchRef.value.selected = player;
  await store.open(player);
});

onBeforeUnmount(() => store.clear());
</script>
