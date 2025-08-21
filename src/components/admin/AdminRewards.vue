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
      sort-by="createdAt"
      :sort-desc="true"
      :search="tableSearch"
      show-expand
      :expanded.sync="expanded"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <v-text-field
            v-model="tableSearch"
            label="Search rewards"
            :prepend-icon="mdiMagnify"
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog" max-width="600px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="primary"
                class="mb-2 w3-race-bg--text"
                v-bind="attrs"
                v-on="on"
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
        </v-toolbar>
      </template>

      <template v-slot:item.type="{ item }">
        <v-chip :color="getRewardTypeColor(item.type)" small>
          {{ getRewardTypeName(item.type) }}
        </v-chip>
      </template>

      <template v-slot:item.isActive="{ item }">
        <v-chip :color="item.isActive ? 'success' : 'error'" small>
          {{ item.isActive ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <template v-slot:item.duration="{ item }">
        <span v-if="item.duration">
          {{ formatDuration(item.duration) }}
        </span>
        <span v-else class="text--secondary">Permanent</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          icon
          small
          color="primary"
          @click="loadUsersForReward(item)"
          :loading="loadingAssignments[item.id]"
          class="mr-1"
          title="View Users"
        >
          <v-icon small>{{ mdiAccountMultiple }}</v-icon>
        </v-btn>
        <v-icon
          small
          class="mr-2"
          @click="editReward(item)"
        >
          {{ mdiPencil }}
        </v-icon>
        <v-icon
          small
          @click="deleteReward(item)"
        >
          {{ mdiDelete }}
        </v-icon>
      </template>

      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="pa-4">
          <div v-if="rewardAssignments[item.id]">
            <v-row class="mb-3">
              <v-col cols="12">
                <h4 class="mb-2">Users with this reward ({{ rewardAssignments[item.id].length }})</h4>
                <v-chip-group>
                  <v-chip
                    small
                    :color="getStatusColor('Active')"
                    class="mr-2"
                  >
                    Active: {{ getAssignmentCountByStatus(item.id, RewardStatus.Active) }}
                  </v-chip>
                  <v-chip
                    small
                    :color="getStatusColor('Expired')"
                    class="mr-2"
                  >
                    Expired: {{ getAssignmentCountByStatus(item.id, RewardStatus.Expired) }}
                  </v-chip>
                  <v-chip
                    small
                    :color="getStatusColor('Revoked')"
                  >
                    Revoked: {{ getAssignmentCountByStatus(item.id, RewardStatus.Revoked) }}
                  </v-chip>
                </v-chip-group>
              </v-col>
            </v-row>

            <v-data-table
              :headers="assignmentHeaders"
              :items="rewardAssignments[item.id]"
              :items-per-page="5"
              :footer-props="{ itemsPerPageOptions: [5, 10, 25] }"
              sort-by="assignedAt"
              :sort-desc="true"
              dense
            >
              <template v-slot:item.status="{ item: assignment }">
                <v-chip :color="getStatusColor(assignment.status)" small>
                  {{ getStatusName(assignment.status) }}
                </v-chip>
              </template>

              <template v-slot:item.providerId="{ item: assignment }">
                <v-chip small>
                  {{ assignment.providerId }}
                </v-chip>
              </template>

              <template v-slot:item.assignedAt="{ item: assignment }">
                <div>
                  <div>{{ formatDate(assignment.assignedAt) }}</div>
                  <div class="text-caption text--secondary">{{ formatTime(assignment.assignedAt) }}</div>
                </div>
              </template>

              <template v-slot:item.expiresAt="{ item: assignment }">
                <div v-if="assignment.expiresAt">
                  <div>{{ formatDate(assignment.expiresAt) }}</div>
                  <div class="text-caption text--secondary">{{ formatTime(assignment.expiresAt) }}</div>
                </div>
                <span v-else class="text--secondary">Permanent</span>
              </template>
            </v-data-table>
          </div>
          <div v-else-if="loadingAssignments[item.id]" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-2">Loading assignments...</div>
          </div>
          <div v-else class="text-center pa-4 text--secondary">
            Click "View Users" to load assignments for this reward
          </div>
        </td>
      </template>
    </v-data-table>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useOauthStore } from '@/store/oauth/store';
import AdminService from '@/services/admin/AdminService';
import { Reward, RewardType, DurationType, CreateRewardRequest, UpdateRewardRequest, RewardAssignment, RewardStatus } from '@/store/admin/types';
import AdminRewardEdit from './AdminRewardEdit.vue';
import { mdiMagnify, mdiPencil, mdiDelete, mdiAccountMultiple } from '@mdi/js';
import { formatTimestampString } from "@/helpers/date-functions";

export default defineComponent({
  name: 'AdminRewards',
  components: {
    AdminRewardEdit,
  },
  setup() {
    const oauthStore = useOauthStore();
    const rewards = ref<Reward[]>([]);
    const tableSearch = ref('');
    const dialog = ref(false);
    const isEditMode = ref(false);
    const editedReward = ref<Partial<Reward>>({});
    const snackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');

    // New data for assignments
    const expanded = ref<any[]>([]);
    const rewardAssignments = ref<Record<string, RewardAssignment[]>>({});
    const loadingAssignments = ref<Record<string, boolean>>({});

    const token = computed(() => oauthStore.token);

    const headers = [
      { text: 'Name', value: 'name', sortable: true },
      { text: 'Description', value: 'description', sortable: false },
      { text: 'Type', value: 'type', sortable: true },
      { text: 'Module ID', value: 'moduleId', sortable: true },
      { text: 'Duration', value: 'duration', sortable: false },
      { text: 'Status', value: 'isActive', sortable: true },
      { text: 'Created', value: 'createdAt', sortable: true },
      { text: 'Actions', value: 'actions', sortable: false, width: '140px' },
    ];

    const assignmentHeaders = [
      { text: 'User', value: 'userId', sortable: true },
      { text: 'Status', value: 'status', sortable: true },
      { text: 'Provider', value: 'providerId', sortable: true },
      { text: 'Assigned', value: 'assignedAt', sortable: true },
      { text: 'Expires', value: 'expiresAt', sortable: true },
    ];

    const loadRewards = async () => {
      try {
        rewards.value = await AdminService.getRewards(token.value);
      } catch (error) {
        showSnackbar('Failed to load rewards', 'error');
        console.error('Error loading rewards:', error);
      }
    };

    const createNewReward = () => {
      editedReward.value = {
        name: '',
        description: '',
        type: RewardType.Portrait,
        moduleId: '',
        parameters: {},
        duration: null,
        isActive: true,
      };
      isEditMode.value = false;
      dialog.value = true;
    };

    const editReward = (reward: Reward) => {
      editedReward.value = { ...reward };
      isEditMode.value = true;
      dialog.value = true;
    };

    const saveReward = async (rewardData: Partial<Reward>) => {
      try {
        if (isEditMode.value && editedReward.value.id) {
          const updateData: UpdateRewardRequest = {
            name: rewardData.name,
            description: rewardData.description,
            type: rewardData.type,
            parameters: rewardData.parameters,
            duration: rewardData.duration,
            isActive: rewardData.isActive,
          };
          await AdminService.updateReward(editedReward.value.id, updateData, token.value);
          showSnackbar('Reward updated successfully');
        } else {
          const createData: CreateRewardRequest = {
            name: rewardData.name!,
            description: rewardData.description!,
            type: rewardData.type!,
            moduleId: rewardData.moduleId!,
            parameters: rewardData.parameters,
            duration: rewardData.duration,
          };
          await AdminService.createReward(createData, token.value);
          showSnackbar('Reward created successfully');
        }
        closeDialog();
        await loadRewards();
      } catch (error) {
        showSnackbar('Failed to save reward', 'error');
        console.error('Error saving reward:', error);
      }
    };

    const deleteReward = async (reward: Reward) => {
      if (confirm(`Are you sure you want to delete "${reward.name}"?`)) {
        try {
          await AdminService.deleteReward(reward.id, token.value);
          showSnackbar('Reward deleted successfully');
          await loadRewards();
        } catch (error) {
          showSnackbar('Failed to delete reward', 'error');
          console.error('Error deleting reward:', error);
        }
      }
    };

    const closeDialog = () => {
      dialog.value = false;
      editedReward.value = {};
    };

    const showSnackbar = (message: string, color = 'success') => {
      snackbarText.value = message;
      snackbarColor.value = color;
      snackbar.value = true;
    };

    const getRewardTypeName = (type: RewardType): string => {
      return RewardType[type] || 'Unknown';
    };

    const getRewardTypeColor = (type: RewardType): string => {
      const colors: Record<RewardType, string> = {
        [RewardType.Portrait]: 'purple',
        [RewardType.Badge]: 'orange',
        [RewardType.Title]: 'blue',
        [RewardType.Cosmetic]: 'pink',
        [RewardType.Feature]: 'green',
        [RewardType.Other]: 'grey',
      };
      return colors[type] || 'grey';
    };

    const formatDuration = (duration: { type: DurationType; value: number }): string => {
      if (!duration) return 'Permanent';
      const unit = DurationType[duration.type].toLowerCase();
      return `${duration.value} ${unit}${duration.value !== 1 ? 's' : ''}`;
    };

    // New methods for assignment functionality
    const loadUsersForReward = async (reward: Reward) => {
      if (rewardAssignments.value[reward.id]) {
        // Toggle expansion if data already loaded
        const currentIndex = expanded.value.findIndex(item => item.id === reward.id);
        if (currentIndex === -1) {
          expanded.value.push(reward);
        } else {
          expanded.value.splice(currentIndex, 1);
        }
        return;
      }

      loadingAssignments.value[reward.id] = true;
      try {
        const assignments = await AdminService.getAssignmentsByReward(reward.id, token.value);
        rewardAssignments.value[reward.id] = assignments;
        
        // Expand the row
        if (!expanded.value.some(item => item.id === reward.id)) {
          expanded.value.push(reward);
        }
        
        showSnackbar(`Loaded ${assignments.length} assignments for ${reward.name}`);
      } catch (error) {
        showSnackbar(`Failed to load assignments for ${reward.name}`, 'error');
        console.error('Error loading assignments:', error);
      } finally {
        loadingAssignments.value[reward.id] = false;
      }
    };

    const getAssignmentCountByStatus = (rewardId: string, status: RewardStatus): number => {
      const assignments = rewardAssignments.value[rewardId] || [];
      return assignments.filter(a => a.status === status).length;
    };

    const getStatusColor = (status: RewardStatus | string): string => {
      // Handle both enum values and string representations
      const statusValue = typeof status === 'number' ? RewardStatus[status] : status;
      const colors: Record<string, string> = {
        'Pending': 'info',
        'Active': 'success',
        'Expired': 'warning',
        'Revoked': 'error',
        'Failed': 'error',
      };
      return colors[statusValue] || 'grey';
    };

    const getStatusName = (status: RewardStatus): string => {
      return RewardStatus[status] || 'Unknown';
    };

    const formatDate = (dateString: string): string => {
      return formatTimestampString(dateString, "yyyy-MM-dd");
    };

    const formatTime = (dateString: string): string => {
      return formatTimestampString(dateString, "HH:mm:ss");
    };

    onMounted(() => {
      loadRewards();
    });

    return {
      rewards,
      tableSearch,
      dialog,
      isEditMode,
      editedReward,
      snackbar,
      snackbarText,
      snackbarColor,
      headers,
      assignmentHeaders,
      expanded,
      rewardAssignments,
      loadingAssignments,
      createNewReward,
      editReward,
      saveReward,
      deleteReward,
      closeDialog,
      loadUsersForReward,
      getAssignmentCountByStatus,
      getStatusColor,
      getStatusName,
      getRewardTypeName,
      getRewardTypeColor,
      formatDuration,
      formatDate,
      formatTime,
      mdiMagnify,
      mdiPencil,
      mdiDelete,
      mdiAccountMultiple,
      RewardStatus,
    };
  },
});
</script>