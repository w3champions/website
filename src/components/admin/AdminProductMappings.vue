<template>
  <div>
    <v-card-title>
      Product Mappings
    </v-card-title>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="productMappings"
        :items-per-page="10"
        class="elevation-0"
        :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
      >
        <template v-slot:top>
          <v-toolbar flat color="transparent">
            <v-spacer />
            <v-btn
              class="bg-primary"
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
              size="small"
              class="mr-1 mb-1"
              variant="flat"
              :color="getProviderColor(provider.providerId)"
            >
              <v-icon size="small" start>{{ getProviderIcon(provider.providerId) }}</v-icon>
              {{ provider.productId }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.rewardIds="{ item }">
          <div>
            <div v-for="rewardId in item.rewardIds" :key="rewardId" class="mb-1">
              <div class="font-weight-medium">{{ getRewardName(rewardId) }}</div>
              <div class="text-caption w3-gray-text">{{ rewardId }}</div>
            </div>
            <div v-if="!item.rewardIds || item.rewardIds.length === 0" class="text-caption w3-gray-text">No rewards assigned</div>
          </div>
        </template>

        <template v-slot:item.type="{ item }">
          <v-chip
            size="small"
            variant="flat"
            :color="getMappingTypeColor(item.type)"
          >
            {{ getMappingTypeName(item.type) }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon
            size="small"
            color="info"
            class="mr-2"
            @click="viewUsers(item)"
          >
            {{ mdiAccountGroup }}
          </v-icon>
          <v-icon
            size="small"
            color="primary"
            class="mr-2"
            @click="editMapping(item)"
          >
            {{ mdiPencil }}
          </v-icon>
          <v-icon
            size="small"
            color="error"
            @click="deleteMapping(item.id)"
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

        <v-card-text class="pt-0 pb-0">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newMapping.productName"
                  label="Product Name *"
                  :rules="[rules.required]"
                  hint="Human-readable name for the product (e.g., 'Premium Subscription')"
                  persistent-hint
                  variant="underlined"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-list-subheader class="px-0">Product Provider Pairs *</v-list-subheader>
                <div v-for="(pair, index) in newMapping.productProviders" :key="index" class="mb-3 pa-3 border">
                  <v-row>
                    <v-col cols="5">
                      <v-select
                        v-model="pair.providerId"
                        :items="providerOptions"
                        label="Provider *"
                        :rules="[rules.required]"
                        variant="underlined"
                        required
                      />
                    </v-col>
                    <v-col cols="5">
                      <v-text-field
                        v-model="pair.productId"
                        label="Product ID *"
                        :rules="[rules.required]"
                        hint="ID from the payment provider"
                        variant="underlined"
                        required
                      />
                    </v-col>
                    <v-col cols="2" class="d-flex align-center">
                      <v-btn
                        icon
                        variant="plain"
                        color="red"
                        :disabled="isNil(newMapping.productProviders) || newMapping.productProviders.length <= 1"
                        @click="removeProductProvider(index)"
                      >
                        <v-icon>{{ mdiDelete }}</v-icon>
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>
                <v-btn
                  variant="text"
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
                  variant="underlined"
                  multiple
                  chips
                  closable-chips
                  required
                  hint="Select one or more rewards to assign for this product"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="newMapping.type"
                  :items="mappingTypeOptions"
                  label="Mapping Type *"
                  :rules="[rules.required]"
                  variant="underlined"
                  required
                />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeMappingDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            class="bg-primary text-w3-race-bg"
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
      @update:visible="toggleRewardUsersDialog"
    />

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, getCurrentInstance } from "vue";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/admin/AdminService";
import { ProductMapping, ProductMappingType, Reward, ProductMappingUsersResponse, RewardStatus, ProviderConfiguration } from "@/store/admin/types";
import { mdiDelete, mdiPencil, mdiPatreon, mdiHandHeart, mdiCog, mdiAccountGroup } from "@mdi/js";
import RewardUsersDialog from "./RewardUsersDialog.vue";
import isNil from "lodash/isNil";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminProductMappings",
  components: {
    RewardUsersDialog,
  },
  setup() {
    const instance = getCurrentInstance();
    const oauthStore = useOauthStore();
    const productMappings = ref<ProductMapping[]>([]);
    const rewards = ref<Reward[]>([]);
    const providers = ref<ProviderConfiguration[]>([]);
    const mappingDialog = ref(false);
    const newMapping = ref<Partial<ProductMapping>>({});
    const isEditMode = ref(false);
    const editingMappingId = ref("");
    const snackbar = ref(false);
    const snackbarText = ref("");
    const snackbarColor = ref("success");

    // Users dialog state
    const usersDialog = ref(false);
    const loadingUsers = ref(false);
    const usersError = ref<string | undefined>(undefined);
    const mappingUsers = ref<ProductMappingUsersResponse | null>(null);
    const selectedMapping = ref<ProductMapping | null>(null);

    const token = computed(() => oauthStore.token);

    const mappingUsersForDialog = computed(() => {
      if (!mappingUsers.value?.users) return [];

      return mappingUsers.value.users.map((user) => ({
        id: `${user.userId}-${user.providerId}-${user.providerProductId}`,
        userId: user.userId,
        rewardId: "", // Not applicable for product mappings
        status: user.isActive ? RewardStatus.Active :
                user.status === "Expired" ? RewardStatus.Expired : RewardStatus.Revoked,
        providerId: user.providerId,
        assignedAt: user.assignedAt,
        expiresAt: user.expiresAt,
        metadata: {
          providerReference: user.providerReference,
          eventType: user.eventType,
        },
        providerReference: "",
      }));
    });

    const headers: DataTableHeader[] = [
      { title: "Product Name", value: "productName", sortable: true },
      { title: "Providers", value: "productProviders", sortable: false },
      { title: "Rewards", value: "rewardIds", sortable: false },
      { title: "Type", value: "type", sortable: true },
      { title: "Actions", value: "actions", sortable: false, width: "120px" },
    ];

    // const usersHeaders = [
    //   { text: "User", value: "userId", sortable: true },
    //   { text: "Provider", value: "provider", sortable: false },
    //   { text: "Product ID", value: "providerProductId", sortable: true },
    //   { text: "Status", value: "status", sortable: true },
    //   { text: "Assigned", value: "assignedAt", sortable: true },
    //   { text: "Expires", value: "expiresAt", sortable: true },
    // ];

    const rules = {
      required: (value: string | string[] | number) => {
        if (Array.isArray(value)) {
          return value.length > 0 || "At least one item is required";
        }
        return !!value || "This field is required";
      },
    };

    const mappingTypeOptions = ref<{title: string; value: ProductMappingType}[]>([
      { title: "One Time", value: ProductMappingType.OneTime },
      { title: "Recurring", value: ProductMappingType.Recurring },
      { title: "Tiered", value: ProductMappingType.Tiered },
    ]);

    const providerOptions = computed(() =>
      providers.value.map((provider) => ({
        title: provider.providerName,
        value: provider.providerId,
      }))
    );

    const rewardOptions = computed(() =>
      rewards.value.map((reward) => ({
        title: `${getRewardTranslatedName(reward.displayId)} (${reward.id})`,
        value: reward.id,
      }))
    );

    const isMappingValid = computed(() => {
      return !!(
        newMapping.value.productName &&
        newMapping.value.productProviders &&
        newMapping.value.productProviders.length > 0 &&
        newMapping.value.productProviders.every((pp) => pp.providerId && pp.productId) &&
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
        console.error("Error loading data:", error);
        showSnackbar("Error loading data", "error");
      }
    };

    // Translation helper functions
    function getRewardTranslatedName(displayId: string): string {
      const key = `rewards.${displayId}.name`;
      const translated = instance?.proxy?.$t(key) as string;
      return translated !== key ? translated : displayId;
    }

    const getRewardName = (rewardId: string): string => {
      const reward = rewards.value.find((r) => r.id === rewardId);
      return reward ? getRewardTranslatedName(reward.displayId) : rewardId;
    };

    const getProviderIcon = (providerId: string): string => {
      switch (providerId.toLowerCase()) {
        case "patreon": return mdiPatreon;
        case "kofi": return mdiHandHeart;
        default: return mdiCog;
      }
    };

    const getProviderColor = (providerId: string): string => {
      switch (providerId.toLowerCase()) {
        case "patreon": return "orange";
        case "kofi": return "blue";
        default: return "grey";
      }
    };

    const getMappingTypeName = (type: ProductMappingType): string => {
      switch (type) {
        case ProductMappingType.OneTime: return "One Time";
        case ProductMappingType.Recurring: return "Recurring";
        case ProductMappingType.Tiered: return "Tiered";
        default: return "Unknown";
      }
    };

    const getMappingTypeColor = (type: ProductMappingType): string => {
      switch (type) {
        case ProductMappingType.OneTime: return "success";
        case ProductMappingType.Recurring: return "primary";
        case ProductMappingType.Tiered: return "warning";
        default: return "grey";
      }
    };

    const createMapping = () => {
      newMapping.value = {
        productName: "",
        productProviders: [{ providerId: "", productId: "" }],
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
      newMapping.value.productProviders.push({ providerId: "", productId: "" });
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
          showSnackbar("Product mapping updated successfully", "success");
        } else {
          await AdminService.createProductMapping(token.value, newMapping.value as ProductMapping);
          showSnackbar("Product mapping created successfully", "success");
        }

        closeMappingDialog();
        await loadData();
      } catch (error) {
        console.error("Error saving mapping:", error);
        showSnackbar("Error saving product mapping", "error");
      }
    };

    const deleteMapping = async (mappingId: string) => {
      if (confirm("Are you sure you want to delete this product mapping?")) {
        try {
          await AdminService.deleteProductMapping(token.value, mappingId);
          showSnackbar("Product mapping deleted successfully", "success");
          await loadData();
        } catch (error) {
          console.error("Error deleting mapping:", error);
          showSnackbar("Error deleting product mapping", "error");
        }
      }
    };

    const closeMappingDialog = () => {
      mappingDialog.value = false;
      newMapping.value = {};
      editingMappingId.value = "";
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
      usersError.value = undefined;

      try {
        mappingUsers.value = await AdminService.getProductMappingUsers(token.value, selectedMapping.value.id);
      } catch (error) {
        console.error("Error loading mapping users:", error);
        usersError.value = "Failed to load users for this product mapping";
        mappingUsers.value = null;
      } finally {
        loadingUsers.value = false;
      }
    };

    const toggleRewardUsersDialog = (isVisible: boolean) => {
      usersDialog.value = isVisible;
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
      headers,
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
      isNil,
      toggleRewardUsersDialog,

      // Icons
      mdiDelete,
      mdiPencil,
      mdiAccountGroup,
    };
  },
});
</script>

<style lang="scss" scoped>
.border {
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
