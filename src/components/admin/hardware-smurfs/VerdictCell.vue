<template>
  <div v-if="kind">
    <v-chip size="small" :color="kind === 'smurf' ? 'error' : 'success'" variant="tonal">
      {{ verdictLabel(kind, tr) }}
    </v-chip>
    <div class="text-caption text-medium-emphasis">
      {{ t(key("verdict_by"), { author: link.verdict?.author ?? "", at: formatUtc(link.verdict?.at) }) }}
    </div>
    <div class="text-caption">{{ link.verdict?.reason }}</div>
  </div>
  <span v-else class="text-medium-emphasis">{{ t(key("dash")) }}</span>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { HardwareLink } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { verdictKindOf, verdictLabel } from "@/store/admin/hardwareSmurfs/labels";
import { key, type Translate } from "@/store/admin/hardwareSmurfs/translate";

const props = defineProps<{ link: HardwareLink }>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const kind = computed(() => verdictKindOf(props.link.verdict));
</script>
