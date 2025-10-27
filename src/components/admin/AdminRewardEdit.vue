<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">{{ isEditing ? 'Edit Reward' : 'Create Reward' }}</span>
    </v-card-title>

    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="localReward.displayId"
              label="Display ID *"
              :rules="[rules.required]"
              counter="100"
              required
              hint="Translation key for the reward (e.g., 'portrait_grubby', 'patreon_tier1')"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="localReward.moduleId"
              :items="moduleItems"
              label="Reward Module *"
              :rules="[rules.required]"
              :loading="loading"
              required
              @update:model-value="onModuleChange"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props">
                  <v-list-item-subtitle>{{ item.raw.description }}</v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>

        <!-- Translation Preview -->
        <v-row v-if="localReward.displayId">
          <v-col cols="12">
            <v-card border class="mb-4">
              <v-card-title class="text-subtitle-1">Translation Preview</v-card-title>
              <v-card-text>
                <div><strong>Name:</strong> {{ getRewardName(localReward.displayId) }}</div>
                <div><strong>Description:</strong> {{ getRewardDescription(localReward.displayId) }}</div>
                <div v-if="!hasTranslation(localReward.displayId)" class="text--secondary mt-2">
                  <v-icon size="small" color="warning">mdi-alert</v-icon>
                  No translation found for display ID "{{ localReward.displayId }}"
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Dynamic Module Parameters -->
        <v-row v-if="selectedModule && selectedModule.supportsParameters">
          <v-col cols="12">
            <v-list-subheader>Module Parameters</v-list-subheader>
            <v-alert
              v-if="selectedModule.description"
              type="info"
              variant="outlined"
              class="mb-4"
            >
              {{ selectedModule.description }}
            </v-alert>

            <v-row v-for="(paramDef, paramKey) in selectedModule.parameterDefinitions" :key="paramKey">
              <v-col cols="12" :md="getInputType(paramDef) === 'boolean' ? 12 : 6">
                <!-- Text/Number inputs -->
                <v-text-field
                  v-if="getInputType(paramDef) === 'text' || getInputType(paramDef) === 'number'"
                  v-model="moduleParameters[paramKey]"
                  :label="paramDef.name + (paramDef.required ? ' *' : '')"
                  :type="getInputType(paramDef) === 'number' ? 'number' : 'text'"
                  :rules="paramDef.required ? [rules.required] : []"
                  :hint="paramDef.description"
                  persistent-hint
                />

                <!-- Boolean switch -->
                <v-switch
                  v-else-if="getInputType(paramDef) === 'boolean'"
                  v-model="moduleParameters[paramKey]"
                  :label="paramDef.name + (paramDef.required ? ' *' : '')"
                  color="success"
                />

                <!-- Array input (comma-separated) -->
                <v-text-field
                  v-else-if="getInputType(paramDef) === 'array'"
                  v-model="moduleParameters[paramKey]"
                  :label="paramDef.name + (paramDef.required ? ' *' : '') + ' (comma-separated)'"
                  :rules="paramDef.required ? [rules.required] : []"
                  :hint="paramDef.description + ' (e.g., 1,2,3)'"
                  persistent-hint
                  @update:model-value="(value) => onInput(value, paramKey)"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <v-row>
          <v-col v-if="isEditing" cols="12" md="6">
            <v-switch
              v-model="localReward.isActive"
              label="Active"
              color="success"
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-list-subheader>Duration Settings</v-list-subheader>
            <v-radio-group v-model="durationType" inline>
              <v-radio label="Permanent" value="permanent" />
              <v-radio label="Time Limited" value="limited" />
            </v-radio-group>

            <div v-if="durationType === 'limited'">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="durationValue"
                    label="Duration Value"
                    type="number"
                    :rules="[rules.required, rules.positiveNumber]"
                    min="1"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="durationUnit"
                    :items="durationUnitItems"
                    label="Duration Unit"
                    :rules="[rules.required]"
                  />
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        variant="text"
        @click="cancel"
      >
        Cancel
      </v-btn>
      <v-btn
        class="bg-primary text-w3-race-bg"
        variant="text"
        :disabled="!isValid"
        @click="save"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch, onMounted, getCurrentInstance } from "vue";
import { Reward, DurationType, ModuleDefinition, ParameterDefinition } from "@/store/admin/types";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/admin/AdminService";

export default defineComponent({
  name: "AdminRewardEdit",
  props: {
    reward: {
      type: Object as PropType<Partial<Reward>>,
      required: true,
    },
    isEditing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["save", "cancel"],
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    const oauthStore = useOauthStore();
    const localReward = ref<Partial<Reward>>({});
    const durationType = ref<"permanent" | "limited">("permanent");
    const durationValue = ref<number>(1);
    const durationUnit = ref<DurationType>(DurationType.Days);

    // Module-related refs
    const availableModules = ref<ModuleDefinition[]>([]);
    const selectedModule = ref<ModuleDefinition | null>(null);

    // eslint-disable-next-line
    const moduleParameters = ref<Record<string, any>>({});

    const loading = ref(false);

    const token = computed(() => oauthStore.token);

    const rules = {
      required: (value: string | string[] | number) => !!value || "This field is required",
      positiveNumber: (value: number) => (value > 0) || "Must be greater than 0",
    };

    const moduleItems = computed(() =>
      availableModules.value.map((module) => ({
        title: module.moduleName,
        value: module.moduleId,
        description: module.description
      }))
    );

    const durationUnitItems = ref<{title: string; value: DurationType}[]>([
      { title: "Days", value: DurationType.Days },
      { title: "Months", value: DurationType.Months },
      { title: "Years", value: DurationType.Years },
    ]);

    const isValid = computed(() => {
      const hasRequiredFields = localReward.value.displayId &&
                               localReward.value.moduleId;

      const hasValidDuration = durationType.value === "permanent" ||
                              (durationValue.value > 0 && durationUnit.value !== undefined);

      // Check if all required module parameters are provided
      const hasValidParameters = !selectedModule.value ||
        Object.entries(selectedModule.value.parameterDefinitions || {}).every(([key, def]) =>
          !def.required || (moduleParameters.value[key] !== undefined && moduleParameters.value[key] !== "")
        );

      return hasRequiredFields && hasValidDuration && hasValidParameters;
    });

    // Load available modules
    const loadModules = async () => {
      try {
        loading.value = true;
        availableModules.value = await AdminService.getAvailableModules(token.value);
      } catch (error) {
        console.error("Failed to load modules:", error);
      } finally {
        loading.value = false;
      }
    };

    // Handle module selection change
    const onModuleChange = (moduleId: string) => {
      selectedModule.value = availableModules.value.find((m) => m.moduleId === moduleId) || null;
      localReward.value.moduleId = moduleId;

      // Initialize parameters with default values
      moduleParameters.value = {};
      if (selectedModule.value?.parameterDefinitions) {
        Object.entries(selectedModule.value.parameterDefinitions).forEach(([key, def]) => {
          moduleParameters.value[key] = def.defaultValue ?? "";
        });
      }
    };

    // Get input type for parameter
    const getInputType = (paramDef: ParameterDefinition): string => {
      switch (paramDef.type.toLowerCase()) {
        case "int":
        case "number":
          return "number";
        case "bool":
        case "boolean":
          return "boolean";
        case "int[]":
        case "array":
          return "array";
        default:
          return "text";
      }
    };

    const initializeForm = () => {
      localReward.value = {
        displayId: props.reward.displayId || "",
        moduleId: props.reward.moduleId || "",
        parameters: props.reward.parameters || {},
        isActive: props.reward.isActive ?? true,
        duration: props.reward.duration || null,
      };

      // Initialize duration settings
      if (localReward.value.duration) {
        durationType.value = "limited";
        durationValue.value = localReward.value.duration.value;
        durationUnit.value = localReward.value.duration.type;
      } else {
        durationType.value = "permanent";
        durationValue.value = 1;
        durationUnit.value = DurationType.Days;
      }

      // Initialize module and parameters
      if (localReward.value.moduleId) {
        selectedModule.value = availableModules.value.find((m) => m.moduleId === localReward.value.moduleId) || null;
        moduleParameters.value = { ...localReward.value.parameters };
      }
    };

    const save = () => {
      if (!isValid.value) return;

      const rewardData: Partial<Reward> = {
        ...localReward.value,
        parameters: moduleParameters.value,
        duration: durationType.value === "permanent"
          ? null
          : {
              type: durationUnit.value,
              value: durationValue.value,
            },
      };

      emit("save", rewardData);
    };

    const cancel = () => {
      emit("cancel");
    };

    // Watch for prop changes
    watch(
      () => props.reward,
      () => initializeForm(),
      { immediate: true, deep: true }
    );

    // Watch for available modules changes
    watch(
      availableModules,
      () => initializeForm(),
      { deep: true }
    );

    // Load modules on component mount
    onMounted(() => {
      loadModules();
    });

    // Translation helper functions
    function getRewardName(displayId: string): string {
      const key = `rewards.${displayId}.name`;
      const translated = instance?.proxy?.$t(key) as string;
      return translated !== key ? translated : displayId;
    }

    function getRewardDescription(displayId: string): string {
      const key = `rewards.${displayId}.description`;
      const translated = instance?.proxy?.$t(key) as string;
      return translated !== key ? translated : "";
    }

    function hasTranslation(displayId: string): boolean {
      const nameKey = `rewards.${displayId}.name`;
      const descKey = `rewards.${displayId}.description`;
      const nameTranslated = instance?.proxy?.$t(nameKey) as string;
      const descTranslated = instance?.proxy?.$t(descKey) as string;
      return nameTranslated !== nameKey || descTranslated !== descKey;
    }

    function onInput(value: string, paramKey: string) {
      if (typeof value === "string") {
        moduleParameters.value[paramKey] = value.split(",").map((v) => {
          const num = parseInt(v.trim());
          return isNaN(num) ? v.trim() : num;
        });
      }
    }

    return {
      localReward,
      durationType,
      durationValue,
      durationUnit,
      availableModules,
      selectedModule,
      moduleParameters,
      loading,
      rules,
      moduleItems,
      durationUnitItems,
      isValid,
      onModuleChange,
      getInputType,
      save,
      cancel,
      getRewardName,
      getRewardDescription,
      hasTranslation,
      onInput,
    };
  },
});
</script>
