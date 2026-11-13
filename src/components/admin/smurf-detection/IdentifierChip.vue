<template>
  <span class="identifier-chip d-inline-flex flex-wrap align-center ga-1" role="group" :aria-label="name">
    <v-chip size="small" variant="outlined" label class="font-monospace">
      <template v-if="!hideKind"><span class="chip-kind text-medium-emphasis">{{ kind }}</span>{{ " " }}</template>{{ hash8 }}
      <span v-if="keys !== undefined && keys > 1" class="chip-keys ml-1 text-medium-emphasis">{{ t(key("chip_keys"), { count: keys }) }}</span>
    </v-chip>
    <span v-if="values && values.length > 0" class="chip-values font-monospace text-body-2">{{ values.join(", ") }}</span>
  </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { key } from "@/store/admin/smurfEvents/translate";

const props = defineProps<{
  kind: string;
  hash8: string;
  /** Stored values typed on players' machines: shown as plain text only. */
  values?: string[];
  /** Stored keys merged into this identifier. */
  keys?: number;
  /** The kind stands elsewhere next to the chip (a column): leave it out. Shown by default. */
  hideKind?: boolean;
}>();

const { t } = useI18n();

/** Read out as the kind, then the hash. */
const name = computed(() => (props.hideKind ? props.hash8 : `${props.kind} ${props.hash8}`));
</script>
