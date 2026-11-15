<template>
  <v-dialog
    :model-value="modelValue"
    scrollable
    max-width="760"
    :persistent="store.acting"
    :aria-label="title"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="restoreFocus"
  >
    <v-form @submit.prevent="submit">
      <v-card>
        <v-card-title class="pt-3">{{ title }}</v-card-title>
        <v-card-text>
          <div class="ban-field-player mb-4">
            <div class="text-caption text-medium-emphasis">{{ t(key("field_player")) }}</div>
            <template v-if="mode === 'edit' && ban">
              <div>{{ bannedAsText(ban, tr) }}</div>
              <div class="text-body-2 text-medium-emphasis">{{ issuedText(ban, tr) }}</div>
            </template>
            <template v-else-if="accountKey === null">
              <slot name="player" :pick="pick"></slot>
              <div v-if="pickedKey !== null && dialogStore.account" class="ban-field-picked mt-1">
                <b>{{ dialogStore.account.currentBattleTag }}</b>
                <span v-if="pickedMatched !== null && !sameTag(pickedMatched, dialogStore.account.currentBattleTag)" class="text-medium-emphasis">
                  · {{ t(key("picked_found_as"), { tag: pickedMatched }) }}
                </span>
              </div>
            </template>
            <div v-else>{{ dialogStore.account?.currentBattleTag ?? "" }}</div>
          </div>

          <v-progress-linear v-if="dialogStore.contextLoading" indeterminate class="mb-4" />
          <v-alert v-if="dialogStore.contextError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ banErrorText(dialogStore.contextError, tr) }}
          </v-alert>
          <BanAccountBox v-if="dialogStore.account" :account="dialogStore.account" :editing-id="editingId" />

          <div v-if="showType" class="ban-field-type mb-4">
            <div class="text-caption text-medium-emphasis">{{ t(key("field_type")) }}</div>
            <v-radio-group :model-value="draft.kind" hide-details @update:model-value="setKind">
              <v-radio value="regular" :label="t(key('type_regular'))" color="primary" />
              <v-radio value="machine" :label="t(key('type_machine'))" color="primary" :disabled="machineUnavailable" />
            </v-radio-group>
            <div v-if="dialogStore.machineRowsLoading" class="text-body-2 text-medium-emphasis ml-10">{{ t(key("type_machine_loading")) }}</div>
            <div v-else-if="dialogStore.machineRowsError" class="text-body-2 text-medium-emphasis ml-10">
              {{ banErrorText(dialogStore.machineRowsError, tr) }}
              <v-btn variant="text" size="small" color="primary" @click="retryMachineRows">{{ t(key("retry")) }}</v-btn>
            </div>
            <div v-else-if="dialogStore.machineRows.length === 0" class="text-body-2 text-medium-emphasis ml-10">{{ t(key("picker_no_ids")) }}</div>
          </div>

          <template v-if="isMachine">
            <MachinePicker v-if="picker" :model-value="picker" @update:model-value="picker = $event" />
            <v-alert v-else-if="dialogStore.machineRowsError" type="error" variant="tonal" density="compact" class="mb-4">
              {{ banErrorText(dialogStore.machineRowsError, tr) }}
            </v-alert>
            <v-progress-linear v-else-if="dialogStore.machineRowsLoading" indeterminate class="mb-4" />
          </template>
          <div v-else class="ban-field-modes mb-4">
            <div class="text-caption text-medium-emphasis">{{ t(key("field_modes")) }}</div>
            <v-radio-group :model-value="draft.scope" hide-details @update:model-value="setScope">
              <v-radio value="modes" :label="t(key('scope_modes'))" color="primary" />
              <v-radio value="all" :label="t(key('all_game_modes'))" color="primary" />
            </v-radio-group>
            <v-select
              :model-value="[...draft.gameModes]"
              :items="modeItems"
              item-title="name"
              item-value="id"
              multiple
              chips
              :aria-label="t(key('field_modes'))"
              variant="underlined"
              color="primary"
              hide-details
              :disabled="draft.scope === 'all'"
              @update:model-value="setModes"
            />
          </div>

          <BanEndField :model-value="draft" :mode="mode" @update:model-value="draft = $event" />
          <BanOverlapNotice :notice="notice" @edit-instead="editInstead" />

          <div v-if="isMachine" class="machine-reasons-hint text-body-2 text-medium-emphasis mb-2">{{ t(key("machine_reasons_hint")) }}</div>
          <v-textarea
            class="ban-field-reason"
            :model-value="draft.banReason"
            :label="t(key('field_reason'))"
            auto-grow
            max-rows="8"
            rows="2"
            variant="filled"
            color="primary"
            :counter="REASON_MAX"
            @update:model-value="draft = { ...draft, banReason: $event }"
          />

          <div class="ban-field-shown">
            <div class="text-caption text-medium-emphasis">{{ t(key("field_shown")) }}</div>
            <v-text-field
              class="ban-field-shown-free"
              :model-value="draft.freeText"
              :label="t(key('shown_free'))"
              variant="underlined"
              color="primary"
              hide-details
              :disabled="draft.translationId !== ''"
              @update:model-value="draft = { ...draft, freeText: $event }"
            />
            <v-select
              class="ban-field-shown-translation"
              :model-value="draft.translationId || null"
              :items="translationItems"
              item-title="title"
              item-value="id"
              :label="t(key('shown_translation'))"
              variant="underlined"
              color="primary"
              clearable
              hide-details
              :disabled="draft.freeText.trim() !== ''"
              @update:model-value="draft = { ...draft, translationId: $event ?? '' }"
            />
            <div v-if="shownEmpty" class="text-body-2 text-medium-emphasis mt-1">{{ t(key("shown_none_hint")) }}</div>
          </div>

          <ul v-if="problems.length > 0" class="ban-problems text-error text-body-2 mt-4 pl-4">
            <li v-for="problem in problems" :key="problem">{{ problemText(problem, tr) }}</li>
          </ul>
        </v-card-text>
        <v-alert v-if="errorText" type="error" variant="tonal" density="compact" class="ban-dialog-error mx-4 mb-2">{{ errorText }}</v-alert>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="store.acting" @click="emit('update:modelValue', false)">
            {{ t("views_admin.cancel") }}
          </v-btn>
          <v-btn type="submit" color="primary" variant="flat" :disabled="saveDisabled" :loading="store.acting">
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { activeGameModes } from "@/composables/GameModesMixin";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanPermissions } from "@/composables/useBanPermissions";
import { useRestoreFocus } from "@/composables/useRestoreFocus";
import {
  addProblems,
  type BanDraft,
  type BanFormProblem,
  draftFromBan,
  emptyDraft,
  overlapDraftOf,
  problemText,
  REASON_MAX,
  toCreateRequest,
  toEditRequest,
  editProblems,
  withKind,
} from "@/store/admin/bans/banForm";
import { initialPicker, machineSaveLabel, pickerSummary, type PickerState } from "@/store/admin/bans/machinePicker";
import { useBanDialogStore } from "@/store/admin/bans/dialogStore";
import { banErrorText, blocksRetry } from "@/store/admin/bans/errors";
import { overlapNotice } from "@/store/admin/bans/inEffect";
import { useBansStore } from "@/store/admin/bans/store";
import { sameTag } from "@/store/admin/bans/tags";
import { key } from "@/store/admin/bans/translate";
import type { AccountSuggestion, BanView } from "@/store/admin/bans/types";
import { bannedAsText, issuedText } from "@/store/admin/bans/wording";
import { useAdminStore } from "@/store/admin/store";
import type { EGameMode } from "@/store/types";
import BanAccountBox from "./BanAccountBox.vue";
import BanEndField from "./BanEndField.vue";
import BanOverlapNotice from "./BanOverlapNotice.vue";
import MachinePicker from "./MachinePicker.vue";

const props = defineProps<{
  modelValue: boolean;
  mode: "add" | "edit";
  ban: BanView | null;
  accountKey: string | null;
  initialDraft: BanDraft | null;
}>();
const emit = defineEmits<{
  (e: "update:modelValue", open: boolean): void;
  (e: "saved", ban: BanView): void;
  /** With the account the dialog shows: the given one, or the one picked in it. */
  (e: "editInstead", banId: string, accountKey: string): void;
}>();

defineSlots<{ player(props: { pick: (suggestion: AccountSuggestion) => void }): unknown }>();

const { t } = useI18n();
const { tr, modeName } = useBanFormat();
const { hasMachineAccess } = useBanPermissions();
const store = useBansStore();
const dialogStore = useBanDialogStore();
const adminStore = useAdminStore();
const restoreFocus = useRestoreFocus(toRef(props, "modelValue"));

const draft = ref<BanDraft>(initialDraftOf());
const pickedKey = ref<string | null>(props.accountKey);
/** The name a pick inside the dialog matched; null when the account came from the page. */
const pickedMatched = ref<string | null>(null);
const problems = ref<BanFormProblem[]>([]);
/** The machine ID selection; replaced on every change of the picker. */
const picker = ref<PickerState | null>(null);

const title = computed(() => t(key(props.mode === "edit" ? "dialog_edit" : "dialog_add")));
const editingId = computed(() => (props.mode === "edit" ? props.ban?.id : undefined));
const shownEmpty = computed(() => draft.value.freeText.trim() === "" && draft.value.translationId === "");

function initialDraftOf(): BanDraft {
  if (props.mode === "edit" && props.ban) {
    const fromBan = draftFromBan(props.ban);
    // This dialog edits a regular ban; only an admin with machine access sees the machine kind.
    return hasMachineAccess.value ? fromBan : { ...fromBan, kind: "regular" };
  }
  return props.initialDraft ?? emptyDraft();
}

const modeItems = computed(() => {
  const active = activeGameModes();
  const known = new Set(active.map((m) => m.id));
  const extra = draft.value.gameModes.filter((m) => !known.has(m)).map((m) => ({ id: m, name: modeName(m) }));
  return [...active, ...extra];
});
const translationItems = computed(() => adminStore.banReasonTranslations.map((x) => ({ id: x._id, title: x.translations.en })));

const notice = computed(() =>
  dialogStore.account
    ? overlapNotice(dialogStore.account, overlapDraftOf(draft.value, props.mode, new Date()), editingId.value)
    : ({ kind: "none" } as const)
);

/** Machine parts render only for AdminModeration; a moderator's dialog never depends on ban.machine. */
const isMachine = computed(() => hasMachineAccess.value && draft.value.kind === "machine");
const showType = computed(() => hasMachineAccess.value && props.mode === "add" && pickedKey.value !== null);
const machineUnavailable = computed(() => dialogStore.machineRowsLoading || dialogStore.machineRowsError !== null || dialogStore.machineRows.length === 0);
const machineEdit = computed(() => hasMachineAccess.value && props.mode === "edit" && props.ban?.machine !== undefined);
const activePicker = computed(() => (isMachine.value ? picker.value : null));
const saveLabel = computed(() =>
  activePicker.value ? machineSaveLabel(pickerSummary(activePicker.value), dialogStore.impact, props.mode, tr) : t(key("save"))
);

const editRequest = computed(() => (props.mode === "edit" && props.ban ? toEditRequest(draft.value, props.ban, activePicker.value) : null));
const blocked = computed(() => store.actionError !== null && blocksRetry(store.actionError));
const saveDisabled = computed(() => store.acting || blocked.value || (props.mode === "edit" && editRequest.value === null));
const errorText = computed(() => {
  if (store.actionError === null) return "";
  return store.maybeSaved ? t(key("error_maybe_saved")) : banErrorText(store.actionError, tr);
});

function openContext(accountKey: string | null, matched: string | null = null): void {
  pickedKey.value = accountKey;
  pickedMatched.value = matched;
  if (accountKey === null) return;
  // Another player's machine IDs replace the picked ones, so a machine ban starts over as a regular one.
  if (props.mode === "add" && draft.value.kind === "machine") draft.value = withKind(draft.value, "regular");
  picker.value = null;
  const machineAccess = props.mode === "edit" ? machineEdit.value : hasMachineAccess.value;
  void dialogStore.open(accountKey, { machineAccess });
}

function retryMachineRows(): void {
  if (pickedKey.value !== null) void dialogStore.open(pickedKey.value, { machineAccess: true });
}

function setKind(kind: BanDraft["kind"] | null): void {
  if (kind === null) return;
  draft.value = withKind(draft.value, kind);
  picker.value = kind === "machine" ? initialPicker(dialogStore.machineRows) : null;
}

// Edit of a machine ban: the picker opens with the ban's IDs once the account's machine IDs arrive.
watch(() => dialogStore.machineRowsLoading, (loading, wasLoading) => {
  if (!wasLoading || loading || !props.modelValue || !machineEdit.value || !props.ban?.machine) return;
  if (dialogStore.machineRowsError !== null) return;
  picker.value = initialPicker(dialogStore.machineRows, props.ban.machine.machineIds, props.ban.issuedAt);
});

function editInstead(banId: string): void {
  if (pickedKey.value !== null) emit("editInstead", banId, pickedKey.value);
}

function pick(suggestion: AccountSuggestion): void {
  openContext(suggestion.accountKey, suggestion.matchedBattleTag);
}

function setScope(scope: "all" | "modes" | null): void {
  draft.value = { ...draft.value, scope, gameModes: scope === "all" ? [] : draft.value.gameModes };
}

function setModes(modes: EGameMode[]): void {
  draft.value = { ...draft.value, gameModes: modes, scope: modes.length > 0 ? "modes" : draft.value.scope };
}

async function submit(): Promise<void> {
  if (saveDisabled.value) return;
  const now = new Date();
  const found = props.mode === "edit" && props.ban
    ? editProblems(draft.value, props.ban, { now, picker: activePicker.value })
    : addProblems(draft.value, { accountKey: pickedKey.value, now, picker: activePicker.value });
  problems.value = found;
  if (found.length > 0) return;
  const saved = props.mode === "edit" && props.ban && editRequest.value
    ? await store.edit(props.ban.id, editRequest.value)
    : pickedKey.value !== null
      ? await store.create(toCreateRequest(draft.value, { accountKey: pickedKey.value, now, picker: activePicker.value }))
      : null;
  if (saved === null) return;
  emit("saved", saved);
  emit("update:modelValue", false);
}

watch(draft, () => {
  problems.value = [];
});

function reset(): void {
  draft.value = initialDraftOf();
  picker.value = null;
  problems.value = [];
  dialogStore.clear();
  store.clearActionError();
  openContext(props.mode === "edit" ? (props.ban?.accountKey ?? null) : props.accountKey);
}

// One watcher, so a page that sets the ban, player or mode and opens in the same tick resets (and loads) once.
// Another ban, player or mode handed to a dialog that stays open also starts from scratch.
watch(() => [props.modelValue, props.mode, props.ban?.id, props.accountKey] as const, ([open], previous) => {
  if (open) {
    reset();
  } else if (previous === undefined || previous[0]) {
    dialogStore.clear();
    store.clearActionError();
  }
}, { immediate: true });
</script>
