<template>
  <div>
    <v-card-title>
      Product Mappings
    </v-card-title>

    <v-expansion-panels multiple>
      <v-expansion-panel
        v-for="provider in providerConfigs"
        :key="provider.id"
      >
        <v-expansion-panel-header>
          <div class="d-flex align-center">
            <v-icon class="mr-2">{{ getProviderIcon(provider.providerId) }}</v-icon>
            <div>
              <div class="font-weight-bold">{{ provider.providerName }}</div>
              <div class="text-caption text--secondary">
                {{ provider.productMappings.length }} mappings
              </div>
            </div>
            <v-spacer></v-spacer>
            <v-chip
              :color="provider.isActive ? 'success' : 'error'"
              small
            >
              {{ provider.isActive ? 'Active' : 'Inactive' }}
            </v-chip>
          </div>
        </v-expansion-panel-header>

        <v-expansion-panel-content>
          <v-data-table
            :headers="mappingHeaders"
            :items="provider.productMappings"
            :items-per-page="10"
            class="elevation-0"
          >
            <template v-slot:top>
              <v-toolbar flat color="transparent">
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  small
                  @click="createMapping(provider.providerId)"
                >
                  Add Mapping
                </v-btn>
              </v-toolbar>
            </template>

            <template v-slot:item.rewardId="{ item }">
              <div>
                <div v-for="rewardId in item.rewardIds" :key="rewardId" class="mb-1">
                  <div class="font-weight-medium">{{ getRewardName(rewardId) }}</div>
                  <div class="text-caption text--secondary">{{ rewardId }}</div>
                </div>
                <div v-if="!item.rewardIds || item.rewardIds.length === 0" class="text-caption text--secondary">No rewards assigned</div>
              </div>
            </template>

            <template v-slot:item.type="{ item }">
              <v-chip :color="getMappingTypeColor(item.type)" small>
                {{ getMappingTypeName(item.type) }}
              </v-chip>
            </template>

            <template v-slot:item.providerProductIds="{ item }">
              <div>
                <v-chip
                  v-for="productId in item.providerProductIds"
                  :key="productId"
                  small
                  class="mr-1 mb-1"
                >
                  {{ productId }}
                </v-chip>
              </div>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-icon
                small
                @click="editMapping(provider.providerId, item)"
                color="primary"
                class="mr-2"
              >
                {{ mdiPencil }}
              </v-icon>
              <v-icon
                small
                @click="deleteMapping(provider.providerId, item.id)"
                color="error"
              >
                {{ mdiDelete }}
              </v-icon>
            </template>
          </v-data-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Add Mapping Dialog -->
    <v-dialog v-model="mappingDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditMode ? 'Edit Product Mapping' : 'Add Product Mapping' }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="newMapping.providerProductIds"
                  label="Provider Product IDs *"
                  :rules="[rules.required]"
                  hint="IDs from the payment provider (e.g., Patreon tier IDs). Press Enter to add multiple IDs."
                  persistent-hint
                  multiple
                  chips
                  deletable-chips
                  required
                ></v-combobox>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newMapping.providerProductName"
                  label="Product Name *"
                  :rules="[rules.required]"
                  hint="Human-readable name for the product"
                  persistent-hint
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="newMapping.rewardIds"
                  :items="rewardOptions"
                  label="Rewards *"
                  :rules="[rules.required]"
                  item-text="text"
                  item-value="value"
                  multiple
                  chips
                  deletable-chips
                  required
                  hint="Select one or more rewards to assign for this product"
                  persistent-hint
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="newMapping.type"
                  :items="mappingTypeOptions"
                  label="Mapping Type *"
                  :rules="[rules.required]"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue darken-1"
            text
            @click="closeMappingDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            :disabled="!isMappingValid"
            @click="saveMappingDialog"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useOauthStore } from '@/store/oauth/store';
import AdminService from '@/services/admin/AdminService';
import { ProviderConfiguration, ProductMapping, ProductMappingType, Reward } from '@/store/admin/types';
import { mdiDelete, mdiPencil, mdiPatreon, mdiHandHeart, mdiCog } from '@mdi/js';

export default defineComponent({
  name: 'AdminProductMappings',
  setup() {
    const oauthStore = useOauthStore();
    const providerConfigs = ref<ProviderConfiguration[]>([]);
    const rewards = ref<Reward[]>([]);
    const mappingDialog = ref(false);
    const selectedProviderId = ref('');
    const newMapping = ref<Partial<ProductMapping>>({});
    const isEditMode = ref(false);
    const editingMappingId = ref('');
    const snackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');

    const token = computed(() => oauthStore.token);

    const mappingHeaders = [
      { text: 'Product IDs', value: 'providerProductIds', sortable: false },
      { text: 'Product Name', value: 'providerProductName', sortable: true },
      { text: 'Reward', value: 'rewardId', sortable: false },
      { text: 'Type', value: 'type', sortable: true },
      { text: 'Actions', value: 'actions', sortable: false, width: '80px' },
    ];

    const rules = {
      required: (value: any) => {
        if (Array.isArray(value)) {
          return value.length > 0 || 'At least one item is required';
        }
        return !!value || 'This field is required';
      },
    };

    const mappingTypeOptions = computed(() => [
      { text: 'One Time', value: ProductMappingType.OneTime },
      { text: 'Recurring', value: ProductMappingType.Recurring },
      { text: 'Tiered', value: ProductMappingType.Tiered },
    ]);

    const rewardOptions = computed(() => 
      rewards.value.map(reward => ({
        text: `${reward.name} (${reward.id})`,
        value: reward.id,
      }))
    );

    const isMappingValid = computed(() => {
      return newMapping.value.providerProductIds &&
             newMapping.value.providerProductIds.length > 0 &&
             newMapping.value.providerProductName &&
             newMapping.value.rewardIds &&
             newMapping.value.rewardIds.length > 0 &&
             newMapping.value.type !== undefined;
    });

    const loadData = async () => {
      try {
        const [configsResult, rewardsResult] = await Promise.all([
          AdminService.getProviderConfigurations(token.value),
          AdminService.getRewards(token.value),
        ]);
        providerConfigs.value = configsResult;
        rewards.value = rewardsResult;
      } catch (error) {
        showSnackbar('Failed to load data', 'error');
        console.error('Error loading data:', error);
      }
    };

    const getProviderIcon = (providerId: string): string => {
      const icons: Record<string, string> = {
        patreon: mdiPatreon,
        kofi: mdiHandHeart,
      };
      return icons[providerId.toLowerCase()] || mdiCog;
    };

    const getRewardName = (rewardId: string): string => {
      const reward = rewards.value.find(r => r.id === rewardId);
      return reward?.name || 'Unknown Reward';
    };

    const getMappingTypeName = (type: ProductMappingType): string => {
      return ProductMappingType[type] || 'Unknown';
    };

    const getMappingTypeColor = (type: ProductMappingType): string => {
      const colors: Record<ProductMappingType, string> = {
        [ProductMappingType.OneTime]: 'blue',
        [ProductMappingType.Recurring]: 'green',
        [ProductMappingType.Tiered]: 'orange',
      };
      return colors[type] || 'grey';
    };

    // Provider status is now controlled by environment variables, not editable via UI

    const createMapping = (providerId: string) => {
      selectedProviderId.value = providerId;
      isEditMode.value = false;
      editingMappingId.value = '';
      newMapping.value = {
        id: crypto.randomUUID(),
        providerProductIds: [],
        providerProductName: '',
        rewardIds: [],
        type: ProductMappingType.OneTime,
        additionalParameters: {},
      };
      mappingDialog.value = true;
    };

    const editMapping = (providerId: string, mapping: ProductMapping) => {
      selectedProviderId.value = providerId;
      isEditMode.value = true;
      editingMappingId.value = mapping.id;
      newMapping.value = {
        id: mapping.id,
        providerProductIds: [...mapping.providerProductIds], // Copy array
        providerProductName: mapping.providerProductName,
        rewardIds: [...mapping.rewardIds], // Copy array
        type: mapping.type,
        additionalParameters: { ...mapping.additionalParameters }, // Copy object
      };
      mappingDialog.value = true;
    };

    const saveMappingDialog = async () => {
      if (!isMappingValid.value) return;

      try {
        if (isEditMode.value) {
          await AdminService.updateProductMapping(
            selectedProviderId.value,
            editingMappingId.value,
            newMapping.value as ProductMapping,
            token.value
          );
          showSnackbar('Product mapping updated successfully');
        } else {
          await AdminService.addProductMapping(
            selectedProviderId.value,
            newMapping.value as ProductMapping,
            token.value
          );
          showSnackbar('Product mapping added successfully');
        }
        closeMappingDialog();
        await loadData();
      } catch (error) {
        const action = isEditMode.value ? 'update' : 'add';
        showSnackbar(`Failed to ${action} product mapping`, 'error');
        console.error(`Error ${action}ing mapping:`, error);
      }
    };

    const deleteMapping = async (providerId: string, mappingId: string) => {
      if (confirm('Are you sure you want to delete this mapping?')) {
        try {
          await AdminService.removeProductMapping(providerId, mappingId, token.value);
          showSnackbar('Product mapping deleted successfully');
          await loadData();
        } catch (error) {
          showSnackbar('Failed to delete product mapping', 'error');
          console.error('Error deleting mapping:', error);
        }
      }
    };

    const closeMappingDialog = () => {
      mappingDialog.value = false;
      isEditMode.value = false;
      editingMappingId.value = '';
      newMapping.value = {
        id: crypto.randomUUID(),
        providerProductIds: [],
        providerProductName: '',
        rewardIds: [],
        type: ProductMappingType.OneTime,
        additionalParameters: {},
      };
      selectedProviderId.value = '';
    };

    const showSnackbar = (message: string, color = 'success') => {
      snackbarText.value = message;
      snackbarColor.value = color;
      snackbar.value = true;
    };

    onMounted(() => {
      loadData();
    });

    return {
      providerConfigs,
      rewards,
      mappingDialog,
      newMapping,
      isEditMode,
      snackbar,
      snackbarText,
      snackbarColor,
      mappingHeaders,
      rules,
      mappingTypeOptions,
      rewardOptions,
      isMappingValid,
      getProviderIcon,
      getRewardName,
      getMappingTypeName,
      getMappingTypeColor,
      createMapping,
      editMapping,
      saveMappingDialog,
      deleteMapping,
      closeMappingDialog,
      mdiDelete,
      mdiPencil,
    };
  },
});
</script>