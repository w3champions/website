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
              v-model="localReward.name"
              label="Reward Name *"
              :rules="[rules.required]"
              counter="100"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="localReward.type"
              :items="rewardTypeItems"
              label="Reward Type *"
              :rules="[rules.required]"
              required
            ></v-select>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-textarea
              v-model="localReward.description"
              label="Description *"
              :rules="[rules.required]"
              counter="500"
              rows="3"
              required
            ></v-textarea>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="localReward.moduleId"
              label="Module ID *"
              :rules="[rules.required]"
              hint="e.g., portrait_module, badge_module"
              persistent-hint
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6" v-if="isEditing">
            <v-switch
              v-model="localReward.isActive"
              label="Active"
              color="success"
            ></v-switch>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-subheader>Duration Settings</v-subheader>
            <v-radio-group v-model="durationType" row>
              <v-radio
                label="Permanent"
                value="permanent"
              ></v-radio>
              <v-radio
                label="Time Limited"
                value="limited"
              ></v-radio>
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
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="durationUnit"
                    :items="durationUnitItems"
                    label="Duration Unit"
                    :rules="[rules.required]"
                  ></v-select>
                </v-col>
              </v-row>
            </div>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-subheader>Module Parameters (JSON)</v-subheader>
            <v-textarea
              v-model="parametersJson"
              label="Parameters"
              rows="4"
              hint="Enter valid JSON for module parameters, e.g., {&quot;portraitId&quot;: 123}"
              persistent-hint
              :error-messages="jsonError"
              @input="validateJson"
            ></v-textarea>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="blue darken-1"
        text
        @click="cancel"
      >
        Cancel
      </v-btn>
      <v-btn
        color="blue darken-1"
        text
        :disabled="!isValid"
        @click="save"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue';
import { Reward, RewardType, DurationType } from '@/store/admin/types';

export default defineComponent({
  name: 'AdminRewardEdit',
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
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const localReward = ref<Partial<Reward>>({});
    const durationType = ref<'permanent' | 'limited'>('permanent');
    const durationValue = ref<number>(1);
    const durationUnit = ref<DurationType>(DurationType.Days);
    const parametersJson = ref<string>('{}');
    const jsonError = ref<string[]>([]);

    const rules = {
      required: (value: any) => !!value || 'This field is required',
      positiveNumber: (value: number) => (value > 0) || 'Must be greater than 0',
    };

    const rewardTypeItems = computed(() => [
      { text: 'Portrait', value: RewardType.Portrait },
      { text: 'Badge', value: RewardType.Badge },
      { text: 'Title', value: RewardType.Title },
      { text: 'Cosmetic', value: RewardType.Cosmetic },
      { text: 'Feature', value: RewardType.Feature },
      { text: 'Other', value: RewardType.Other },
    ]);

    const durationUnitItems = computed(() => [
      { text: 'Days', value: DurationType.Days },
      { text: 'Months', value: DurationType.Months },
      { text: 'Years', value: DurationType.Years },
    ]);

    const isValid = computed(() => {
      return localReward.value.name &&
             localReward.value.description &&
             localReward.value.type !== undefined &&
             localReward.value.moduleId &&
             (durationType.value === 'permanent' || (durationValue.value > 0 && durationUnit.value !== undefined)) &&
             jsonError.value.length === 0;
    });

    const initializeForm = () => {
      localReward.value = {
        name: props.reward.name || '',
        description: props.reward.description || '',
        type: props.reward.type ?? RewardType.Undefined,
        moduleId: props.reward.moduleId || '',
        parameters: props.reward.parameters || {},
        isActive: props.reward.isActive ?? true,
        duration: props.reward.duration || null,
      };

      // Initialize duration settings
      if (localReward.value.duration) {
        durationType.value = 'limited';
        durationValue.value = localReward.value.duration.value;
        durationUnit.value = localReward.value.duration.type;
      } else {
        durationType.value = 'permanent';
        durationValue.value = 1;
        durationUnit.value = DurationType.Days;
      }

      // Initialize parameters JSON
      parametersJson.value = JSON.stringify(localReward.value.parameters || {}, null, 2);
    };

    const validateJson = () => {
      try {
        JSON.parse(parametersJson.value);
        jsonError.value = [];
      } catch (error) {
        jsonError.value = ['Invalid JSON format'];
      }
    };

    const save = () => {
      if (!isValid.value) return;

      try {
        const parameters = JSON.parse(parametersJson.value);
        
        const rewardData: Partial<Reward> = {
          ...localReward.value,
          parameters,
          duration: durationType.value === 'permanent' 
            ? null 
            : {
                type: durationUnit.value,
                value: durationValue.value,
              },
        };

        emit('save', rewardData);
      } catch (error) {
        console.error('Error parsing parameters JSON:', error);
      }
    };

    const cancel = () => {
      emit('cancel');
    };

    // Watch for prop changes
    watch(
      () => props.reward,
      () => initializeForm(),
      { immediate: true, deep: true }
    );

    // Validate JSON on initialization
    watch(parametersJson, validateJson, { immediate: true });

    return {
      localReward,
      durationType,
      durationValue,
      durationUnit,
      parametersJson,
      jsonError,
      rules,
      rewardTypeItems,
      durationUnitItems,
      isValid,
      validateJson,
      save,
      cancel,
    };
  },
});
</script>