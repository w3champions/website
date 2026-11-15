<template>
  <div v-if="names.length > 1" class="account-names">
    <div class="account-names-inline">
      <span class="text-medium-emphasis">{{ t(key("names_label"), { count: names.length }) }}</span>
      <template v-for="(item, index) in inlineNames" :key="item.battleTag">
        <span v-if="index > 0" class="text-medium-emphasis" aria-hidden="true">·</span>
        <span class="account-name">
          <b v-if="isMatched(item)">{{ item.battleTag }}</b>
          <template v-else>{{ item.battleTag }}</template>
          <span v-if="suffixOf(item)" class="text-medium-emphasis">{{ " " + suffixOf(item) }}</span>
        </span>
      </template>
      <v-btn v-if="names.length > NAMES_INLINE" variant="text" size="small" class="account-names-toggle" @click="open = !open">
        {{ open ? t(key("names_hide")) : t(key("names_all"), { count: names.length }) }}
      </v-btn>
    </div>
    <div v-if="open" class="account-names-panel">
      <v-text-field
        v-if="names.length > NAMES_FILTER_ABOVE"
        v-model="filter"
        :label="t(key('names_filter'))"
        variant="outlined"
        density="compact"
        hide-details
        class="account-names-filter"
      />
      <div v-if="panelNames.length > 0" class="account-names-grid">
        <span v-for="item in panelNames" :key="item.battleTag" class="account-name">
          <b v-if="isMatched(item)">{{ item.battleTag }}</b>
          <template v-else>{{ item.battleTag }}</template>
          <span v-if="suffixOf(item)" class="text-medium-emphasis">{{ " " + suffixOf(item) }}</span>
        </span>
      </div>
      <p v-else class="text-medium-emphasis account-names-none">{{ t(key("names_none_match")) }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { filterNames, NAMES_FILTER_ABOVE, NAMES_INLINE, orderedNames } from "@/store/admin/bans/names";
import { sameTag } from "@/store/admin/bans/tags";
import { countText, key } from "@/store/admin/bans/translate";
import type { AccountName } from "@/store/admin/bans/types";

const props = defineProps<{ names: AccountName[]; matchedTag: string | null }>();

const { t } = useI18n();
const { tr } = useBanFormat();

const open = ref(false);
const filter = ref("");

const ordered = computed(() => orderedNames(props.names, props.matchedTag));
const inlineNames = computed(() => ordered.value.slice(0, NAMES_INLINE));
const panelNames = computed(() => filterNames(ordered.value, filter.value));

const isMatched = (item: AccountName): boolean => props.matchedTag !== null && sameTag(item.battleTag, props.matchedTag);

function suffixOf(item: AccountName): string {
  if (item.current) return t(key("name_current"));
  return item.banCount > 0 ? countText("name_bans", item.banCount, tr) : "";
}
</script>

<style scoped>
.account-names-inline {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
}

.account-names-toggle {
  flex: none;
}

.account-names-panel {
  margin-top: 8px;
}

.account-names-filter {
  max-width: 320px;
  margin-bottom: 8px;
}

.account-names-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px 16px;
}

.account-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
