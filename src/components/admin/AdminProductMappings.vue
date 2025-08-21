<template>
  <div>
    <v-card-title>
      Product Mappings
    </v-card-title>

    <v-card>
      <v-data-table
        :headers="mappingHeaders"
        :items="productMappings"
        :items-per-page="10"
        class="elevation-0"
      >
        <template v-slot:top>
          <v-toolbar flat color="transparent">
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              small
              @click="createMapping"
            >
              Add Mapping
            </v-btn>
          </v-toolbar>
        </template>

        <template v-slot:item.productName="{ item }">
          <div class="font-weight-medium">{{ item.productName }}</div>
        </template>

        <template v-slot:item.productProviders="{ item }">
          <div>
            <v-chip
              v-for="provider in item.productProviders"
              :key="`${provider.providerId}-${provider.productId}`"
              small
              class="mr-1 mb-1"
              :color="getProviderColor(provider.providerId)"
            >
              <v-icon small left>{{ getProviderIcon(provider.providerId) }}</v-icon>
              {{ provider.productId }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.rewardIds="{ item }">
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

        <template v-slot:item.actions="{ item }">
          <v-icon
            small
            @click="viewUsers(item)"
            color="info"
            class="mr-2"
          >
            {{ mdiAccountGroup }}
          </v-icon>
          <v-icon
            small
            @click="editMapping(item)"
            color="primary"
            class="mr-2"
          >
            {{ mdiPencil }}
          </v-icon>
          <v-icon
            small
            @click="deleteMapping(item.id)"
            color="error"
          >
            {{ mdiDelete }}
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Mapping Dialog -->
    <v-dialog v-model="mappingDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditMode ? 'Edit Product Mapping' : 'Add Product Mapping' }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newMapping.productName"
                  label="Product Name *"
                  :rules="[rules.required]"
                  hint="Human-readable name for the product (e.g., 'Premium Subscription')"
                  persistent-hint
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-subheader class="px-0">Product Provider Pairs *</v-subheader>
                <div v-for="(pair, index) in newMapping.productProviders" :key="index" class="mb-3 pa-3 border">
                  <v-row>
                    <v-col cols="5">
                      <v-select
                        v-model="pair.providerId"
                        :items="providerOptions"
                        label="Provider *"
                        :rules="[rules.required]"
                        item-text="text"
                        item-value="value"
                        required
                      ></v-select>
                    </v-col>
                    <v-col cols="5">
                      <v-text-field
                        v-model="pair.productId"
                        label="Product ID *"
                        :rules="[rules.required]"
                        hint="ID from the payment provider"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="2" class="d-flex align-center">
                      <v-btn
                        icon
                        color="error"
                        @click="removeProductProvider(index)"
                        :disabled="newMapping.productProviders.length <= 1"
                      >
                        <v-icon>{{ mdiDelete }}</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
                <v-btn
                  text
                  color="primary"
                  @click="addProductProvider"
                >
                  Add Provider
                </v-btn>
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

    <!-- View Users Dialog -->
    <reward-users-dialog
      :visible.sync="usersDialog"
      :title="`Users for Product Mapping: ${selectedMapping?.productName || 'Product Mapping'}`"
      :users="mappingUsersForDialog"
      :loading="loadingUsers"
      :error="usersError"
      @retry="loadMappingUsers"
    />

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useOauthStore } from '@/store/oauth/store';
import AdminService from '@/services/admin/AdminService';
import { ProductMapping, ProductMappingType, ProductProviderPair, Reward, ProductMappingUsersResponse, RewardStatus } from '@/store/admin/types';
import { mdiDelete, mdiPencil, mdiPatreon, mdiHandHeart, mdiCog, mdiAccountGroup, mdiClose, mdiAlert } from '@mdi/js';
import RewardUsersDialog from './RewardUsersDialog.vue';

export default defineComponent({
  name: 'AdminProductMappings',
  components: {
    RewardUsersDialog,
  },
  setup() {
    const oauthStore = useOauthStore();
    const productMappings = ref<ProductMapping[]>([]);
    const rewards = ref<Reward[]>([]);
    const providers = ref<any[]>([]);
    const mappingDialog = ref(false);
    const newMapping = ref<Partial<ProductMapping>>({});
    const isEditMode = ref(false);
    const editingMappingId = ref('');
    const snackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');
    
    // Users dialog state
    const usersDialog = ref(false);
    const loadingUsers = ref(false);
    const usersError = ref<string | null>(null);
    const mappingUsers = ref<ProductMappingUsersResponse | null>(null);
    const selectedMapping = ref<ProductMapping | null>(null);

    const token = computed(() => oauthStore.token);

    const mappingUsersForDialog = computed(() => {
      if (!mappingUsers.value?.users) return [];
      
      return mappingUsers.value.users.map(user => ({
        id: `${user.userId}-${user.providerId}-${user.providerProductId}`,
        userId: user.userId,
        rewardId: '', // Not applicable for product mappings
        status: user.isActive ? RewardStatus.Active : 
                user.status === 'Expired' ? RewardStatus.Expired : RewardStatus.Revoked,
        providerId: user.providerId,
        assignedAt: user.assignedAt,
        expiresAt: user.expiresAt,
        metadata: {
          providerReference: user.providerReference,
          eventType: user.eventType,
        }
      }));
    });

    const mappingHeaders = [
      { text: 'Product Name', value: 'productName', sortable: true },
      { text: 'Providers', value: 'productProviders', sortable: false },
      { text: 'Rewards', value: 'rewardIds', sortable: false },
      { text: 'Type', value: 'type', sortable: true },
      { text: 'Actions', value: 'actions', sortable: false, width: '120px' },
    ];

    const usersHeaders = [
      { text: 'User', value: 'userId', sortable: true },
      { text: 'Provider', value: 'provider', sortable: false },
      { text: 'Product ID', value: 'providerProductId', sortable: true },
      { text: 'Status', value: 'status', sortable: true },
      { text: 'Assigned', value: 'assignedAt', sortable: true },
      { text: 'Expires', value: 'expiresAt', sortable: true },
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

    const providerOptions = computed(() => 
      providers.value.map(provider => ({
        text: provider.providerName,
        value: provider.providerId,
      }))
    );

    const rewardOptions = computed(() => 
      rewards.value.map(reward => ({
        text: `${reward.name} (${reward.id})`,
        value: reward.id,
      }))
    );

    const isMappingValid = computed(() => {
      return !!(
        newMapping.value.productName &&
        newMapping.value.productProviders &&
        newMapping.value.productProviders.length > 0 &&
        newMapping.value.productProviders.every(pp => pp.providerId && pp.productId) &&
        newMapping.value.rewardIds &&
        newMapping.value.rewardIds.length > 0 &&
        newMapping.value.type !== undefined
      );
    });

    const loadData = async () => {
      try {
        const [mappingsResponse, rewardsResponse, providersResponse] = await Promise.all([
          AdminService.getProductMappings(token.value),
          AdminService.getRewards(token.value),
          AdminService.getProviderConfigurations(token.value),
        ]);

        productMappings.value = mappingsResponse;
        rewards.value = rewardsResponse;
        providers.value = providersResponse;
      } catch (error) {
        console.error('Error loading data:', error);
        showSnackbar('Error loading data', 'error');
      }
    };

    const getRewardName = (rewardId: string): string => {
      const reward = rewards.value.find(r => r.id === rewardId);
      return reward ? reward.name : rewardId;
    };

    const getProviderIcon = (providerId: string): string => {
      switch (providerId.toLowerCase()) {
        case 'patreon': return mdiPatreon;
        case 'kofi': return mdiHandHeart;
        default: return mdiCog;
      }
    };

    const getProviderColor = (providerId: string): string => {
      switch (providerId.toLowerCase()) {
        case 'patreon': return 'orange';
        case 'kofi': return 'blue';
        default: return 'grey';
      }
    };

    const getMappingTypeName = (type: ProductMappingType): string => {
      switch (type) {
        case ProductMappingType.OneTime: return 'One Time';
        case ProductMappingType.Recurring: return 'Recurring';
        case ProductMappingType.Tiered: return 'Tiered';
        default: return 'Unknown';
      }
    };

    const getMappingTypeColor = (type: ProductMappingType): string => {
      switch (type) {
        case ProductMappingType.OneTime: return 'success';
        case ProductMappingType.Recurring: return 'primary';
        case ProductMappingType.Tiered: return 'warning';
        default: return 'grey';
      }
    };

    const createMapping = () => {
      newMapping.value = {
        productName: '',
        productProviders: [{ providerId: '', productId: '' }],
        rewardIds: [],
        type: ProductMappingType.OneTime,
        additionalParameters: {},
      };
      isEditMode.value = false;
      mappingDialog.value = true;
    };

    const editMapping = (mapping: ProductMapping) => {
      newMapping.value = {
        ...mapping,
        productProviders: [...mapping.productProviders],
        rewardIds: [...mapping.rewardIds],
      };
      editingMappingId.value = mapping.id;
      isEditMode.value = true;
      mappingDialog.value = true;
    };

    const addProductProvider = () => {
      if (!newMapping.value.productProviders) {
        newMapping.value.productProviders = [];
      }
      newMapping.value.productProviders.push({ providerId: '', productId: '' });
    };

    const removeProductProvider = (index: number) => {
      if (newMapping.value.productProviders && newMapping.value.productProviders.length > 1) {
        newMapping.value.productProviders.splice(index, 1);
      }
    };

    const saveMappingDialog = async () => {
      try {
        if (isEditMode.value) {
          await AdminService.updateProductMapping(token.value, editingMappingId.value, newMapping.value as ProductMapping);
          showSnackbar('Product mapping updated successfully', 'success');
        } else {
          await AdminService.createProductMapping(token.value, newMapping.value as ProductMapping);
          showSnackbar('Product mapping created successfully', 'success');
        }
        
        closeMappingDialog();
        await loadData();
      } catch (error) {
        console.error('Error saving mapping:', error);
        showSnackbar('Error saving product mapping', 'error');
      }
    };

    const deleteMapping = async (mappingId: string) => {
      if (confirm('Are you sure you want to delete this product mapping?')) {
        try {
          await AdminService.deleteProductMapping(token.value, mappingId);
          showSnackbar('Product mapping deleted successfully', 'success');
          await loadData();
        } catch (error) {
          console.error('Error deleting mapping:', error);
          showSnackbar('Error deleting product mapping', 'error');
        }
      }
    };

    const closeMappingDialog = () => {
      mappingDialog.value = false;
      newMapping.value = {};
      editingMappingId.value = '';
      isEditMode.value = false;
    };

    const showSnackbar = (message: string, color: string) => {
      snackbarText.value = message;
      snackbarColor.value = color;
      snackbar.value = true;
    };

    const viewUsers = async (mapping: ProductMapping) => {
      selectedMapping.value = mapping;
      usersDialog.value = true;
      await loadMappingUsers();
    };

    const loadMappingUsers = async () => {
      if (!selectedMapping.value) return;
      
      loadingUsers.value = true;
      usersError.value = null;
      
      try {
        mappingUsers.value = await AdminService.getProductMappingUsers(token.value, selectedMapping.value.id);
      } catch (error) {
        console.error('Error loading mapping users:', error);
        usersError.value = 'Failed to load users for this product mapping';
        mappingUsers.value = null;
      } finally {
        loadingUsers.value = false;
      }
    };


    onMounted(() => {
      loadData();
    });

    return {
      // Data
      productMappings,
      rewards,
      providers,
      mappingDialog,
      newMapping,
      isEditMode,
      editingMappingId,
      snackbar,
      snackbarText,
      snackbarColor,
      
      // Users dialog data
      usersDialog,
      loadingUsers,
      usersError,
      mappingUsers,
      selectedMapping,
      
      // Computed
      mappingHeaders,
      mappingUsersForDialog,
      rules,
      mappingTypeOptions,
      providerOptions,
      rewardOptions,
      isMappingValid,
      
      // Methods
      getRewardName,
      getProviderIcon,
      getProviderColor,
      getMappingTypeName,
      getMappingTypeColor,
      createMapping,
      editMapping,
      addProductProvider,
      removeProductProvider,
      saveMappingDialog,
      deleteMapping,
      closeMappingDialog,
      viewUsers,
      loadMappingUsers,
      
      // Icons
      mdiDelete,
      mdiPencil,
      mdiAccountGroup,
    };
  },
});
</script>

<style scoped>
.border {
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>