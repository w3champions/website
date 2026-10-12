<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center ga-2">
      <v-btn icon variant="text" size="small" aria-label="Back to runs" :to="{ name: EAdminRouteName.NETDIAG_RUNS }">
        <v-icon>{{ mdiArrowLeft }}</v-icon>
      </v-btn>
      New remote measurement
    </v-card-title>

    <v-container style="max-width: 960px" class="ml-0">
      <v-alert v-if="store.targetsError" type="error" variant="tonal" density="compact" class="mb-4">
        Failed to load targets: {{ store.targetsError }}
      </v-alert>

      <section aria-labelledby="netdiag-who" class="mb-8">
        <h3 id="netdiag-who" class="text-subtitle-1 font-weight-bold mb-1">Who</h3>
        <v-radio-group v-model="draft.audience" inline hide-details color="primary">
          <v-radio label="One player" value="single" />
          <v-radio label="List of players" value="users" />
          <v-radio label="Sample (count)" value="sampleCount" />
          <v-radio label="Sample (%)" value="samplePercent" />
          <v-radio label="All online" value="all" />
        </v-radio-group>
        <div class="mt-3">
          <div v-if="draft.audience === 'single'">
            <v-chip v-if="draft.singleBattleTag !== ''" closable class="mb-2" @click:close="clearSingleBattleTag">Player: {{ draft.singleBattleTag }}</v-chip>
            <battle-tag-picker v-model="draft.singleBattleTag" :reset-key="pickerKey" label="Player BattleTag" />
          </div>
          <v-combobox
            v-else-if="draft.audience === 'users'"
            :model-value="draft.battleTags"
            label="BattleTags"
            hint="Paste tags separated by spaces, commas or new lines. Tags are matched exactly, including case."
            persistent-hint
            multiple
            chips
            closable-chips
            variant="underlined"
            color="primary"
            @update:modelValue="onBattleTagsChange"
          >
            <template v-slot:chip="{ props: chipProps, item }">
              <v-chip v-bind="chipProps" size="small" :color="isBattleTag(item.title) ? undefined : 'error'">{{ item.title }}</v-chip>
            </template>
          </v-combobox>
          <v-text-field
            v-else-if="draft.audience === 'sampleCount'"
            :model-value="draft.sampleCount ?? ''"
            label="Players to sample"
            type="number"
            min="1"
            step="1"
            variant="underlined"
            color="primary"
            @update:modelValue="(value) => (draft.sampleCount = numberOrNull(value))"
          />
          <v-text-field
            v-else-if="draft.audience === 'samplePercent'"
            :model-value="draft.samplePercent ?? ''"
            label="Share of online players (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            variant="underlined"
            color="primary"
            @update:modelValue="(value) => (draft.samplePercent = numberOrNull(value))"
          />
          <v-alert v-else type="warning" variant="tonal" density="compact">
            Every player who is online during the next {{ FLEET_WINDOW_MINUTES }} minutes is measured. You will be asked to confirm.
          </v-alert>
        </div>
      </section>

      <section aria-labelledby="netdiag-targets" class="mb-8">
        <h3 id="netdiag-targets" class="text-subtitle-1 font-weight-bold mb-1">Targets</h3>
        <v-checkbox v-model="draft.allFloNodes" label="All flo nodes" color="primary" density="compact" hide-details />
        <v-autocomplete
          v-model="draft.floNodeIds"
          :items="nodeItems"
          :disabled="draft.allFloNodes"
          :loading="store.targetsLoading"
          label="Flo nodes"
          multiple
          chips
          closable-chips
          variant="underlined"
          color="primary"
        />
        <v-row dense>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">Core servers</div>
            <v-checkbox
              v-for="server in store.targets?.coreServers ?? []"
              :key="server.key"
              v-model="draft.coreServers"
              :value="server.key"
              :label="endpointLabel(server)"
              color="primary"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-caption text-medium-emphasis">Baselines</div>
            <v-checkbox
              v-for="baseline in store.targets?.baselines ?? []"
              :key="baseline.key"
              v-model="draft.baselines"
              :value="baseline.key"
              :label="endpointLabel(baseline)"
              color="primary"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>
        <v-combobox
          :model-value="customTargetChips"
          :error-messages="customTargetErrors"
          label="Custom IP:port"
          hint="IPv4, optionally with a TCP port (default 443), e.g. 203.0.113.7 or 203.0.113.7:3554"
          persistent-hint
          multiple
          chips
          closable-chips
          variant="underlined"
          color="primary"
          class="mt-4"
          @update:modelValue="onCustomTargetsChange"
        />
        <v-switch v-model="draft.includeDefaultGateway" label="Include the player's default gateway" color="primary" density="compact" hide-details class="mt-2" />
      </section>

      <section aria-labelledby="netdiag-options" class="mb-8">
        <h3 id="netdiag-options" class="text-subtitle-1 font-weight-bold mb-1">Methods and options</h3>
        <v-row dense>
          <v-col v-for="method in NETDIAG_METHODS" :key="method" cols="12" sm="6" md="4">
            <v-checkbox v-model="draft.methods" :value="method" :label="METHOD_LABELS[method]" color="primary" density="compact" hide-details />
          </v-col>
        </v-row>
        <v-switch v-model="draft.allowDuringGame" label="Allow while the player is in a game" color="primary" density="compact" hide-details class="mt-2" />
        <v-text-field
          :model-value="draft.windowSeconds ?? ''"
          :hint="`${WINDOW_SECONDS_MIN}–${WINDOW_SECONDS_MAX} seconds`"
          label="Window (seconds)"
          type="number"
          :min="WINDOW_SECONDS_MIN"
          :max="WINDOW_SECONDS_MAX"
          step="10"
          persistent-hint
          variant="underlined"
          color="primary"
          style="max-width: 240px"
          @update:modelValue="(value) => (draft.windowSeconds = numberOrNull(value))"
        />
        <p class="text-body-2 mt-3">{{ expectedDurationText(draft) }}</p>
      </section>

      <v-alert v-if="attempted && errors.length > 0" type="error" variant="tonal" density="compact" class="mb-4">
        <ul class="pl-4">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>
      <v-alert v-if="submitError" type="error" variant="tonal" density="compact" class="mb-4">{{ submitError }}</v-alert>
      <v-btn color="primary" size="large" :loading="submitting" :disabled="submitting" @click="submit">Schedule measurement</v-btn>
    </v-container>

    <v-dialog v-model="confirmOpen" max-width="480" :persistent="submitting">
      <v-card>
        <v-card-title>Measure all online players?</v-card-title>
        <v-card-text>
          Every player who is online during the next {{ FLEET_WINDOW_MINUTES }} minutes runs this measurement once: {{ draft.methods.length }} {{ draft.methods.length === 1 ? "method" : "methods" }} against the selected targets for {{ draft.windowSeconds }} s each.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="submitting" @click="confirmOpen = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="submitting" @click="confirmAll">Measure all online</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { mdiArrowLeft } from "@mdi/js";
import BattleTagPicker from "@/components/admin/commercial-events/BattleTagPicker.vue";
import { EAdminRouteName } from "@/router/types";
import { describeNetDiagError } from "@/store/admin/networkDiagnostics/errors";
import { useNetDiagRunsStore } from "@/store/admin/networkDiagnostics/runsStore";
import { type CreateRunRequest, NETDIAG_METHODS } from "@/store/admin/networkDiagnostics/types";
import { METHOD_LABELS } from "./format";
import { buildCreateRunRequest, customTargetText, emptyRunDraft, endpointLabel, expectedDurationText, FLEET_WINDOW_MINUTES, isBattleTag, nodeSelectItems, normalizeBattleTagList, numberOrNull, parseCustomTargets, requiresAllConfirmation, stringValues, validateRunDraft, WINDOW_SECONDS_MAX, WINDOW_SECONDS_MIN } from "./runDraft";

const store = useNetDiagRunsStore();
const route = useRoute();
const router = useRouter();

const draft = reactive(emptyRunDraft());
if (typeof route.query.battleTag === "string") draft.singleBattleTag = route.query.battleTag;

const attempted = ref(false);
const submitting = ref(false);
const submitError = ref("");
const confirmOpen = ref(false);
const pendingRequest = ref<CreateRunRequest | null>(null);
const customTargetErrors = ref<string[]>([]);
const pickerKey = ref(0);

const errors = computed(() => validateRunDraft(draft));
const nodeItems = computed(() => nodeSelectItems(store.targets?.floNodes ?? []));
const customTargetChips = computed(() => draft.customTargets.map(customTargetText));

function clearSingleBattleTag(): void {
  draft.singleBattleTag = "";
  pickerKey.value += 1;
}

function onBattleTagsChange(values: unknown): void {
  draft.battleTags = normalizeBattleTagList(stringValues(values));
}

function onCustomTargetsChange(values: unknown): void {
  const parsed = parseCustomTargets(stringValues(values));
  draft.customTargets = parsed.targets;
  customTargetErrors.value = parsed.errors;
}

async function send(request: CreateRunRequest): Promise<void> {
  submitting.value = true;
  submitError.value = "";
  try {
    const run = await store.createRun(request);
    confirmOpen.value = false;
    await router.push({ name: EAdminRouteName.NETDIAG_RUN_DETAIL, params: { runId: run.id } });
  } catch (e) {
    console.error("Failed to create network diagnostic run:", e);
    submitError.value = describeNetDiagError(e);
    confirmOpen.value = false;
  } finally {
    submitting.value = false;
  }
}

async function submit(): Promise<void> {
  attempted.value = true;
  const built = buildCreateRunRequest(draft);
  if (!built.ok) return;
  if (requiresAllConfirmation(draft)) {
    pendingRequest.value = built.request;
    confirmOpen.value = true;
    return;
  }
  await send(built.request);
}

async function confirmAll(): Promise<void> {
  if (pendingRequest.value === null || submitting.value) return;
  await send(pendingRequest.value);
}

onMounted(() => store.loadTargets());
</script>
