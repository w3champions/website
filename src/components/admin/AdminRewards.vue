<template>
  <div>
    <v-card-title>
      Rewards Management
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="rewards"
      :items-per-page="10"
      :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
      :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      :search="tableSearch"
      class="elevation-1"
      :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
    >
      <template v-slot:top>
        <div class="d-flex align-center px-4">
          <v-text-field
            v-model="tableSearch"
            label="Search rewards"
            :prepend-inner-icon="mdiMagnify"
            variant="underlined"
            color="primary"
          />
          <v-spacer />
          <v-dialog v-model="dialog" max-width="600px">
            <template v-slot:activator="{ props }">
              <v-btn
                class="bg-primary text-w3-race-bg"
                v-bind="props"
                @click="createNewReward"
              >
                Create Reward
              </v-btn>
            </template>
            <admin-reward-edit
              :reward="editedReward"
              :is-editing="isEditMode"
              @save="saveReward"
              @cancel="closeDialog"
            />
          </v-dialog>
        </div>
      </template>

      <template v-slot:item.moduleId="{ item }">
        <v-chip class="bg-primary" size="small">
          {{ getModuleName(item.moduleId) }}
        </v-chip>
      </template>

      <template v-slot:item.translatedName="{ item }">
        <div>
          <strong>{{ getRewardName(item.displayId) }}</strong>
          <div v-if="!hasTranslation(item.displayId)" class="w3-gray-text text-caption">
            <v-icon size="small" color="warning">mdi-alert</v-icon>
            No translation
          </div>
        </div>
      </template>

      <template v-slot:item.isActive="{ item }">
        <v-chip size="small" :class="item.isActive ? 'bg-success' : 'bg-error'">
          {{ item.isActive ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <template v-slot:item.duration="{ item }">
        <span v-if="item.duration">
          {{ formatDuration(item.duration) }}
        </span>
        <span v-else class="w3-gray-text">Permanent</span>
      </template>

      <template v-slot:item.assignmentStats="{ item }">
        <div class="text-center">
          <v-chip-group class="d-flex flex-column">
            <v-chip size="x-small" class="ma-1 bg-success">
              A: {{ item.assignmentStats?.activeCount || 0 }}
            </v-chip>
            <v-chip size="x-small" class="ma-1 bg-warning">
              E: {{ item.assignmentStats?.expiredCount || 0 }}
            </v-chip>
            <v-chip size="x-small" class="ma-1 bg-error">
              R: {{ item.assignmentStats?.revokedCount || 0 }}
            </v-chip>
          </v-chip-group>
        </div>
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
          class="mr-2"
          @click="editReward(item)"
        >
          {{ mdiPencil }}
        </v-icon>
        <v-icon
          size="small"
          @click="deleteReward(item)"
        >
          {{ mdiDelete }}
        </v-icon>
      </template>
    </v-data-table>

    <!-- View Users Dialog -->
    <reward-users-dialog
      :visible.sync="usersDialog"
      :title="`Users with Reward: ${selectedReward && getRewardName(selectedReward.displayId) || 'Unknown'}`"
      :users="rewardUsers"
      :loading="loadingUsers"
      :error="usersError"
      @retry="loadRewardUsers"
      @update:visible="toggleRewardUsersDialog"
    />

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
      <div style="white-space: pre-line;">{{ snackbarText }}</div>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, getCurrentInstance } from "vue";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/admin/AdminService";
import { Reward, DurationType, CreateRewardRequest, UpdateRewardRequest, RewardAssignment, RewardStatus, ModuleDefinition, RewardAssignmentStats } from "@/store/admin/types";
import AdminRewardEdit from "./AdminRewardEdit.vue";
import RewardUsersDialog from "./RewardUsersDialog.vue";
import { mdiMagnify, mdiPencil, mdiDelete, mdiAccountGroup } from "@mdi/js";
import { formatTimestampString } from "@/helpers/date-functions";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminRewards",
  components: {
    AdminRewardEdit,
    RewardUsersDialog,
  },
  setup() {
    const instance = getCurrentInstance();
    const oauthStore = useOauthStore();
    const rewards = ref<Reward[]>([]);
    const availableModules = ref<ModuleDefinition[]>([]);
    const allAssignments = ref<RewardAssignment[]>([]);
    const tableSearch = ref("");
    const dialog = ref(false);
    const isEditMode = ref(false);
    const editedReward = ref<Partial<Reward>>({});
    const snackbar = ref(false);
    const snackbarText = ref("");
    const snackbarColor = ref("success");

    // Users dialog state
    const usersDialog = ref(false);
    const loadingUsers = ref(false);
    const usersError = ref<string | undefined>(undefined);
    const rewardUsers = ref<RewardAssignment[]>([]);
    const selectedReward = ref<Reward | null>(null);

    const token = computed(() => oauthStore.token);

    const headers: DataTableHeader[] = [
      { title: "Display ID", value: "displayId", sortable: true },
      { title: "Translated Name", value: "translatedName", sortable: false },
      { title: "Module", value: "moduleId", sortable: true },
      { title: "Duration", value: "duration", sortable: false },
      { title: "Status", value: "isActive", sortable: true },
      { title: "Users", value: "assignmentStats", sortable: false },
      { title: "Created", value: "createdAt", sortable: true },
      { title: "Actions", value: "actions", sortable: false },
    ];

    // const usersHeaders = [
    //   { text: "User", value: "userId", sortable: true },
    //   { text: "Status", value: "status", sortable: true },
    //   { text: "Provider", value: "providerId", sortable: true },
    //   { text: "Assigned", value: "assignedAt", sortable: true },
    //   { text: "Expires", value: "expiresAt", sortable: true },
    // ];

    // const activeUsersCount = computed(() => {
    //   return rewardUsers.value.filter((user) => user.status === RewardStatus.Active).length;
    // });

    // const expiredUsersCount = computed(() => {
    //   return rewardUsers.value.filter((user) => user.status === RewardStatus.Expired || user.status === RewardStatus.Revoked).length;
    // });

    const loadAllAssignments = async (): Promise<void> => {
      try {
        const assignmentsData = await AdminService.getAllAssignments(token.value, 1, 10000);
        allAssignments.value = assignmentsData.assignments;
      } catch (error) {
        console.error("Error loading all assignments:", error);
      }
    };

    const calculateAssignmentStats = (rewardId: string): RewardAssignmentStats => {
      const rewardAssignments = allAssignments.value.filter((a) => a.rewardId === rewardId);
      return {
        activeCount: rewardAssignments.filter((a) => a.status === RewardStatus.Active).length,
        expiredCount: rewardAssignments.filter((a) => a.status === RewardStatus.Expired).length,
        revokedCount: rewardAssignments.filter((a) => a.status === RewardStatus.Revoked).length,
        totalCount: rewardAssignments.length,
      };
    };

    const loadRewards = async (): Promise<void> => {
      try {
        const [rewardsData] = await Promise.all([
          AdminService.getRewards(token.value),
          loadAllAssignments(),
        ]);

        // Add assignment statistics to each reward
        rewards.value = rewardsData.map((reward) => ({
          ...reward,
          assignmentStats: calculateAssignmentStats(reward.id),
        }));
      } catch (error) {
        showSnackbar("Failed to load rewards", "error");
        console.error("Error loading rewards:", error);
      }
    };

    const loadModules = async (): Promise<void> => {
      try {
        availableModules.value = await AdminService.getAvailableModules(token.value);
      } catch (error) {
        console.error("Failed to load modules:", error);
      }
    };

    const getModuleName = (moduleId: string): string => {
      const module = availableModules.value.find((m) => m.moduleId === moduleId);
      return module?.moduleName || moduleId;
    };

    // Translation helper functions
    const getRewardName = (displayId: string): string => {
      const key = `rewards.${displayId}.name`;
      const translated = instance?.proxy?.$t(key) as string;
      return translated !== key ? translated : displayId;
    };

    const getRewardDescription = (displayId: string): string => {
      const key = `rewards.${displayId}.description`;
      const translated = instance?.proxy?.$t(key) as string;
      return translated !== key ? translated : "";
    };

    const hasTranslation = (displayId: string): boolean => {
      const nameKey = `rewards.${displayId}.name`;
      const descKey = `rewards.${displayId}.description`;
      const nameTranslated = instance?.proxy?.$t(nameKey) as string;
      const descTranslated = instance?.proxy?.$t(descKey) as string;
      return nameTranslated !== nameKey || descTranslated !== descKey;
    };

    const createNewReward = (): void => {
      editedReward.value = {
        displayId: "",
        moduleId: "",
        parameters: {},
        duration: null,
        isActive: true,
      };
      isEditMode.value = false;
      dialog.value = true;
    };

    const editReward = (reward: Reward): void => {
      editedReward.value = { ...reward };
      isEditMode.value = true;
      dialog.value = true;
    };

    const saveReward = async (rewardData: Partial<Reward>): Promise<void> => {
      try {
        if (isEditMode.value && editedReward.value.id) {
          const updateData: UpdateRewardRequest = {
            displayId: rewardData.displayId,
            parameters: rewardData.parameters,
            duration: rewardData.duration!,
            isActive: rewardData.isActive,
          };
          await AdminService.updateReward(editedReward.value.id, updateData, token.value);
          showSnackbar("Reward updated successfully");
        } else {
          const createData: CreateRewardRequest = {
            displayId: rewardData.displayId!,
            moduleId: rewardData.moduleId!,
            parameters: rewardData.parameters,
            duration: rewardData.duration!,
          };
          await AdminService.createReward(createData, token.value);
          showSnackbar("Reward created successfully");
        }
        closeDialog();
        await loadRewards();

      // eslint-disable-next-line
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Failed to save reward";
        showSnackbar(errorMessage, "error");
        console.error("Error saving reward:", error);
      }
    };

    const deleteReward = async (reward: Reward): Promise<void> => {
      if (confirm(`Are you sure you want to delete "${getRewardName(reward.displayId)}"?`)) {
        try {
          await AdminService.deleteReward(reward.id, token.value);
          showSnackbar("Reward deleted successfully");
          await loadRewards();

        // eslint-disable-next-line
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || "Failed to delete reward";
          showSnackbar(errorMessage, "error");
          console.error("Error deleting reward:", error);
        }
      }
    };

    const closeDialog = (): void => {
      dialog.value = false;
      editedReward.value = {};
    };

    const showSnackbar = (message: string, color = "success"): void => {
      snackbarText.value = message;
      snackbarColor.value = color;
      snackbar.value = true;
    };

    const formatDuration = (duration: { type: DurationType; value: number }): string => {
      if (!duration) return "Permanent";
      const unit = DurationType[duration.type].toLowerCase();
      return `${duration.value} ${unit}${duration.value !== 1 ? "s" : ""}`;
    };

    // New methods for assignment functionality
    const viewUsers = async (reward: Reward): Promise<void> => {
      selectedReward.value = reward;
      usersDialog.value = true;
      await loadRewardUsers();
    };

    const loadRewardUsers = async (): Promise<void> => {
      if (!selectedReward.value) return;

      loadingUsers.value = true;
      usersError.value = undefined;

      try {
        const assignments = await AdminService.getAssignmentsByReward(selectedReward.value.id, token.value);
        rewardUsers.value = assignments;
      } catch (error) {
        console.error("Error loading reward users:", error);
        usersError.value = "Failed to load users for this reward";
        rewardUsers.value = [];
      } finally {
        loadingUsers.value = false;
      }
    };


    const getStatusColor = (status: RewardStatus | string): string => {
      // Handle both enum values and string representations
      const statusValue = typeof status === "number" ? RewardStatus[status] : status;
      const colors: Record<string, string> = {
        "Pending": "info",
        "Active": "success",
        "Expired": "warning",
        "Revoked": "error",
        "Failed": "error",
      };
      return colors[statusValue] || "grey";
    };

    const getStatusName = (status: RewardStatus): string => {
      return RewardStatus[status] || "Unknown";
    };

    const formatDate = (dateString: string): string => {
      return formatTimestampString(dateString, "yyyy-MM-dd");
    };

    const formatTime = (dateString: string): string => {
      return formatTimestampString(dateString, "HH:mm:ss");
    };

    const toggleRewardUsersDialog = (isVisible: boolean) => {
      usersDialog.value = isVisible;
    };

    onMounted(() => {
      loadRewards();
      loadModules();
    });

    return {
      rewards,
      allAssignments,
      tableSearch,
      dialog,
      isEditMode,
      editedReward,
      snackbar,
      snackbarText,
      snackbarColor,

      // Users dialog data
      usersDialog,
      loadingUsers,
      usersError,
      rewardUsers,
      selectedReward,

      // Computed
      headers,

      // Methods
      createNewReward,
      editReward,
      saveReward,
      deleteReward,
      closeDialog,
      viewUsers,
      loadRewardUsers,
      getStatusColor,
      getStatusName,
      getModuleName,
      getRewardName,
      getRewardDescription,
      hasTranslation,
      formatDuration,
      formatDate,
      formatTime,
      toggleRewardUsersDialog,

      // Icons
      mdiMagnify,
      mdiPencil,
      mdiDelete,
      mdiAccountGroup,

      // Enums
      RewardStatus,
    };
  },
});
</script>
