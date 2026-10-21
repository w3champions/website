<template>
  <div class="d-flex flex-wrap justify-end ga-1 py-1">
    <v-btn
      v-for="option in options"
      :key="option.action"
      size="small"
      :color="colorOf(option.action)"
      :variant="isRevoke(option.action) ? 'text' : 'tonal'"
      :prepend-icon="isWideImpact(option.action) ? mdiAlertOutline : undefined"
      @click="emit('select', option)"
    >
      {{ t(key(`action_${option.action}`)) }}
    </v-btn>
  </div>
</template>

<script lang="ts" setup generic="A extends OverrideAction">
import { useI18n } from "vue-i18n";
import { mdiAlertOutline } from "@mdi/js";
import { type ActionOption, isWideImpact, type OverrideAction } from "@/store/admin/hardwareSmurfs/actions";
import { key } from "@/store/admin/hardwareSmurfs/translate";

defineProps<{ options: ActionOption<A>[] }>();

const emit = defineEmits<{
  (e: "select", option: ActionOption<A>): void;
}>();

const { t } = useI18n();

function isRevoke(action: OverrideAction): boolean {
  return action.startsWith("revoke-");
}

/** Trust (links everyone on a shared item) reads as destructive, ignore as a warning. */
function colorOf(action: OverrideAction): string | undefined {
  if (action === "trust") return "error";
  if (action === "ignore") return "warning";
  return isRevoke(action) ? undefined : "primary";
}
</script>
