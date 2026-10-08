<template>
  <v-dialog :model-value="modelValue" :persistent="saving" max-width="500px" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="pt-3">
        {{ isEdit ? "Edit tagged player" : "Tag player" }}
      </v-card-title>

      <v-card-text>
        <v-text-field
          v-if="isEdit"
          :model-value="draft.battleTag"
          label="BattleTag"
          readonly
          variant="underlined"
          color="primary"
        />
        <player-search
          v-else
          :key="openCount"
          @playerFound="onPlayerFound"
          @searchCleared="draft.battleTag = ''"
        />

        <v-textarea
          v-model="draft.note"
          class="mt-4"
          label="Note"
          auto-grow
          rows="2"
          variant="filled"
          color="primary"
          :counter="NOTE_MAX_LENGTH"
          :rules="[noteRule]"
        />

        <v-switch
          v-model="draft.notify"
          label="Notify on Discord when this account (or a direct smurf) is in a custom game"
          color="primary"
          hide-details
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
          {{ error }}
        </v-alert>

        <v-alert v-if="problem && draft.battleTag" type="warning" variant="tonal" density="compact" class="mt-4">
          {{ problem }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="emit('update:modelValue', false)">
          {{ $t(`views_admin.cancel`) }}
        </v-btn>
        <v-btn
          class="bg-primary text-w3-race-bg"
          variant="text"
          :disabled="problem !== null"
          :loading="saving"
          @click="emit('save', { ...draft })"
        >
          {{ $t(`views_admin.save`) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { draftFromTag, emptyDraft, NOTE_MAX_LENGTH, validateDraft } from "@/store/admin/commercialLicense/draft";
import type { CommercialLicenseDraft } from "@/store/admin/commercialLicense/draft";
import type { CommercialLicenseTaggedPlayer } from "@/store/admin/commercialLicense/types";

const props = defineProps<{
  modelValue: boolean;
  tag: CommercialLicenseTaggedPlayer | null;
  existingBattleTags: string[];
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", draft: CommercialLicenseDraft): void;
}>();

const draft = reactive<CommercialLicenseDraft>(emptyDraft());
// Remounts PlayerSearch on every open so a previous selection never lingers.
const openCount = ref(0);

const isEdit = computed(() => props.tag !== null);
const problem = computed(() => validateDraft(draft, isEdit.value, props.existingBattleTags));

watch(() => props.modelValue, (open) => {
  if (!open) return;
  Object.assign(draft, props.tag ? draftFromTag(props.tag) : emptyDraft());
  openCount.value++;
});

function noteRule(v: string): true | string {
  return v.length <= NOTE_MAX_LENGTH || `At most ${NOTE_MAX_LENGTH} characters`;
}

function onPlayerFound(battleTag: string): void {
  draft.battleTag = battleTag;
}
</script>
