<template>
  <div class="ban-field-end mb-4">
    <template v-if="mode === 'add'">
      <div class="text-caption text-medium-emphasis">{{ t(key("field_duration")) }}</div>
      <v-chip-group :model-value="modelValue.duration" @update:model-value="setDuration">
        <v-chip v-for="days in DURATION_DAYS" :key="days" :value="days" variant="outlined" filter>
          {{ countText("days", days, tr) }}
        </v-chip>
        <v-chip value="permanent" variant="outlined" filter>{{ t(key("permanent")) }}</v-chip>
        <v-chip value="custom" variant="outlined" filter>{{ t(key("duration_custom")) }}</v-chip>
      </v-chip-group>
      <v-text-field
        v-if="modelValue.duration === 'custom'"
        :model-value="modelValue.endInput"
        :label="t(key('field_end'))"
        type="datetime-local"
        variant="underlined"
        color="primary"
        @update:model-value="update({ endInput: $event })"
      />
    </template>
    <div v-else class="d-flex align-center ga-4">
      <v-text-field
        :model-value="modelValue.endInput"
        :label="t(key('field_end'))"
        type="datetime-local"
        variant="underlined"
        color="primary"
        hide-details
        :disabled="modelValue.permanent"
        @update:model-value="update({ endInput: $event })"
      />
      <v-checkbox
        :model-value="modelValue.permanent"
        :label="t(key('permanent'))"
        hide-details
        color="primary"
        @update:model-value="update({ permanent: Boolean($event) })"
      />
    </div>
    <div v-if="echo" class="ban-end-echo text-body-2 text-medium-emphasis">{{ echo }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { type BanDraft, DURATION_DAYS, type DurationChoice, draftEnd } from "@/store/admin/bans/banForm";
import { countText, key } from "@/store/admin/bans/translate";
import { endsTooltip } from "@/store/admin/bans/wording";

const props = defineProps<{ modelValue: BanDraft; mode: "add" | "edit" }>();
const emit = defineEmits<{ (e: "update:modelValue", draft: BanDraft): void }>();

const { t } = useI18n();
const { tr } = useBanFormat();

function update(change: Partial<BanDraft>): void {
  emit("update:modelValue", { ...props.modelValue, ...change });
}

function setDuration(choice: DurationChoice | null | undefined): void {
  update({ duration: choice ?? null });
}

const echo = computed(() => {
  const end = draftEnd(props.modelValue, props.mode, new Date());
  if (typeof end === "string") return "";
  if (end.permanent) return t(key("no_end_date"));
  return t(key("end_echo"), { date: endsTooltip({ endDate: end.endDate }, tr) });
});
</script>
