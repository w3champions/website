<template>
  <v-tooltip v-if="kind === 'origin'" :text="originHint" location="bottom">
    <template v-slot:activator="{ props: activator }">
      <v-chip v-bind="activator" size="small" variant="outlined" tabindex="0">{{ label }}</v-chip>
    </template>
  </v-tooltip>
  <v-chip v-else size="small" variant="tonal" :color="reviewColor(value as SmurfEventReview)">{{ label }}</v-chip>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { SmurfEventOrigin, SmurfEventReview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { originLabel, reviewColor, reviewLabel } from "@/store/admin/smurfEvents/labels";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const props = defineProps<{
  kind: "origin" | "review";
  value: SmurfEventOrigin | SmurfEventReview;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

const label = computed(() => (props.kind === "origin" ? originLabel(props.value as SmurfEventOrigin, tr) : reviewLabel(props.value as SmurfEventReview, tr)));
// An origin the page does not know has no explanation: the tooltip then repeats the label as sent.
const originHint = computed(() => {
  const hint = key(`origin_hint_${props.value}`);
  const text = t(hint);
  return text === hint ? label.value : text;
});
</script>
