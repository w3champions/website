<template>
  <div class="account-lookup">
    <v-text-field
      :model-value="text"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="String(open)"
      :aria-controls="listId"
      :aria-activedescendant="activeId"
      :label="label"
      :loading="pending"
      :autofocus="autofocus"
      :prepend-inner-icon="mdiMagnify"
      autocomplete="off"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="onInput"
      @keydown="onKeydown"
      @focus="open = text !== ''"
      @blur="open = false"
    />
    <v-sheet v-if="open" class="lookup-list" :class="{ 'lookup-list--stale': pending }" elevation="4" rounded @mousedown.prevent>
      <v-list :id="listId" role="listbox" :aria-label="label" density="compact">
        <v-list-item
          v-for="(suggestion, index) in results"
          :id="optionId(index)"
          :key="suggestion.accountKey + suggestion.matchedBattleTag"
          role="option"
          :aria-selected="index === highlighted"
          :active="index === highlighted"
          @click="pick(suggestion)"
        >
          <span class="lookup-line">
            <b class="lookup-tag">{{ suggestion.matchedBattleTag }}</b>
            <span v-if="!sameTag(suggestion.matchedBattleTag, suggestion.currentBattleTag)" class="text-medium-emphasis">{{ t(key("lookup_now"), { tag: suggestion.currentBattleTag }) }}</span>
          </span>
          <span class="lookup-line text-medium-emphasis">
            {{ countText("lookup_names", suggestion.nameCount, tr) }} ·
            {{ suggestion.bansTotal > 0 ? t(key("lookup_bans"), { inEffect: suggestion.bansInEffect, total: suggestion.bansTotal }) : t(key("lookup_no_bans")) }}
          </span>
        </v-list-item>
      </v-list>
      <div v-if="message" class="lookup-message text-medium-emphasis">{{ message }}</div>
    </v-sheet>
  </div>
</template>

<script lang="ts">
export const LOOKUP_DEBOUNCE_MS = 500;
let lookupCount = 0;
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { mdiMagnify } from "@mdi/js";
import debounce from "debounce";
import { useBanFormat } from "@/composables/useBanFormat";
import { banErrorText } from "@/store/admin/bans/errors";
import { LOOKUP_MIN_CHARS, lookupAccounts } from "@/store/admin/bans/lookup";
import { sameTag } from "@/store/admin/bans/tags";
import { countText, key } from "@/store/admin/bans/translate";
import type { AccountSuggestion } from "@/store/admin/bans/types";

const props = defineProps<{ label: string; autofocus?: boolean; initialText?: string }>();
const emit = defineEmits<{ (e: "pick", suggestion: AccountSuggestion): void }>();

const { t } = useI18n();
const { tr } = useBanFormat();

const uid = `ban-lookup-${++lookupCount}`;
const listId = `${uid}-list`;
const optionId = (index: number): string => `${uid}-option-${index}`;

const text = ref("");
const results = ref<AccountSuggestion[]>([]);
const total = ref(0);
const error = ref<unknown>(null);
const pending = ref(false);
const open = ref(false);
const highlighted = ref(-1);

// Advanced as soon as a search is queued and on every cancel, so an answer only applies while it
// belongs to the latest text.
let latestSearchId = 0;
const debouncedSearch = debounce(runSearch, LOOKUP_DEBOUNCE_MS);

const tooShort = computed(() => text.value.trim().length < LOOKUP_MIN_CHARS);
const activeId = computed(() => (open.value && highlighted.value >= 0 ? optionId(highlighted.value) : undefined));
const message = computed(() => {
  if (tooShort.value) return t(key("lookup_min_chars"));
  if (pending.value && results.value.length === 0) return "";
  if (error.value !== null) return banErrorText(error.value, tr);
  if (results.value.length === 0) return t(key("lookup_none"));
  return total.value > results.value.length ? t(key("lookup_more"), { shown: results.value.length, total: total.value }) : "";
});

async function runSearch(value: string, searchId: number): Promise<void> {
  try {
    const response = await lookupAccounts(value);
    if (searchId !== latestSearchId) return;
    results.value = response.results;
    highlighted.value = -1;
    total.value = response.total;
    error.value = null;
  } catch (e) {
    if (searchId !== latestSearchId) return;
    results.value = [];
    total.value = 0;
    error.value = e;
  } finally {
    if (searchId === latestSearchId) pending.value = false;
  }
}

function cancelSearch(): void {
  debouncedSearch.clear();
  latestSearchId++;
}

function search(value: string, immediately: boolean): void {
  text.value = value;
  highlighted.value = -1;
  cancelSearch();
  open.value = value !== "";
  if (value.trim().length < LOOKUP_MIN_CHARS) {
    results.value = [];
    total.value = 0;
    error.value = null;
    pending.value = false;
    return;
  }
  pending.value = true;
  const searchId = ++latestSearchId;
  if (immediately) void runSearch(value, searchId);
  else debouncedSearch(value, searchId);
}

const onInput = (value: string | null): void => search(value ?? "", false);

watch(
  () => props.initialText,
  (value) => {
    if (value) search(value, true);
  },
  { immediate: true },
);

onBeforeUnmount(cancelSearch);

function pick(suggestion: AccountSuggestion): void {
  if (pending.value) return; // a stale row is not pickable, as with Enter
  cancelSearch();
  text.value = "";
  results.value = [];
  total.value = 0;
  error.value = null;
  pending.value = false;
  open.value = false;
  highlighted.value = -1;
  emit("pick", suggestion);
}

/** The highlighted suggestion, else the only one. */
function pickable(): AccountSuggestion | null {
  if (pending.value || tooShort.value) return null;
  if (highlighted.value >= 0) return results.value[highlighted.value] ?? null;
  return results.value.length === 1 ? results.value[0] : null;
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    open.value = text.value !== "";
    const last = results.value.length - 1;
    highlighted.value = e.key === "ArrowDown" ? Math.min(highlighted.value + 1, last) : Math.max(Math.min(highlighted.value - 1, last), last < 0 ? -1 : 0);
  } else if (e.key === "Enter") {
    if (e.isComposing) return;
    e.preventDefault();
    const suggestion = pickable();
    if (suggestion) pick(suggestion);
  } else if (e.key === "Escape") {
    if (!open.value) return; // a closed list lets Escape reach an enclosing dialog
    // Vuetify's overlay listens for Escape on window; this one only closes the list.
    e.preventDefault();
    e.stopPropagation();
    open.value = false;
  }
}
</script>

<style scoped>
.account-lookup {
  position: relative;
}

.lookup-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 4px;
  max-height: 60vh;
  overflow-y: auto;
}

.lookup-list--stale {
  opacity: 0.6;
}

.lookup-line {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lookup-tag {
  margin-right: 8px;
}

.lookup-message {
  padding: 8px 16px;
}
</style>
