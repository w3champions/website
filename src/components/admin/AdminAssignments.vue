<template>
  <div>
    <v-card-title>
      Reward Assignments
    </v-card-title>

        <v-card flat>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchUserId"
              label="Search by User ID (BattleTag)"
              :prepend-icon="mdiMagnify"
              clearable
              @keyup.enter="searchAssignments"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusFilterOptions"
              label="Status Filter"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="providerFilter"
              :items="providerFilterOptions"
              label="Provider Filter"
              clearable
            ></v-select>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="auto">
            <v-btn
              color="primary"
              @click="searchAssignments"
              :loading="loading"
            >
              Search
            </v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn
              text
              @click="clearSearch"
            >
              Clear
            </v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn
              color="secondary"
              @click="loadAllAssignments"
              :loading="loading"
            >
              <v-icon left>{{ mdiRefresh }}</v-icon>
              Load All Assignments
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-data-table
      :headers="headers"
      :items="assignments"
      :items-per-page="10"
      :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
      sort-by="assignedAt"
      :sort-desc="true"
      :loading="loading"
      class="elevation-1"
    >
      <template v-slot:item.userId="{ item }">
        <div class="font-weight-medium">{{ item.userId }}</div>
      </template>

      <template v-slot:item.rewardId="{ item }">
        <div>
          <div class="font-weight-medium">{{ getRewardName(item.rewardId) }}</div>
          <div class="text-caption text--secondary">{{ item.rewardId }}</div>
        </div>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip :color="getStatusColor(item.status)" small>
          {{ getStatusName(item.status) }}
        </v-chip>
      </template>

      <template v-slot:item.providerId="{ item }">
        <v-chip small>
          <v-icon left small>{{ getProviderIcon(item.providerId) }}</v-icon>
          {{ item.providerId }}
        </v-chip>
      </template>

      <template v-slot:item.assignedAt="{ item }">
        <div>
          <div>{{ formatDate(item.assignedAt) }}</div>
          <div class="text-caption text--secondary">{{ formatTime(item.assignedAt) }}</div>
        </div>
      </template>

      <template v-slot:item.expiresAt="{ item }">
        <div v-if="item.expiresAt">
          <div :class="{ 'error--text': isExpired(item.expiresAt) }">
            {{ formatDate(item.expiresAt) }}
          </div>
          <div class="text-caption text--secondary">{{ formatTime(item.expiresAt) }}</div>
        </div>
        <span v-else class="text--secondary">Never</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              icon
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>{{ mdiDotsVertical }}</v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item @click="viewDetails(item)">
              <v-list-item-icon>
                <v-icon small>{{ mdiEye }}</v-icon>
              </v-list-item-icon>
              <v-list-item-title>View Details</v-list-item-title>
            </v-list-item>
            <v-list-item
              @click="revokeAssignment(item)"
              :disabled="item.status !== 0"
            >
              <v-list-item-icon>
                <v-icon small>{{ mdiCancel }}</v-icon>
              </v-list-item-icon>
              <v-list-item-title>Revoke</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>

        <!-- Pagination for By User Tab -->
        <div v-if="paginationData && paginationData.totalPages > 1" class="text-center pa-4">
          <v-pagination
            v-model="currentPage"
            :length="paginationData.totalPages"
            :total-visible="7"
            @input="onPageChange"
          ></v-pagination>
          <div class="text-caption mt-2">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }} - {{ Math.min(currentPage * pageSize, paginationData.totalCount) }} 
            of {{ paginationData.totalCount }} assignments
          </div>
          <div class="mt-2">
            <v-select
              v-model="pageSize"
              :items="[25, 50, 100, 200]"
              label="Items per page"
              style="max-width: 150px; margin: 0 auto;"
              dense
              @change="onPageSizeChange"
            ></v-select>
          </div>
        </div>

    <!-- Assignment Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="600px">
      <v-card v-if="selectedAssignment">
        <v-card-title>Assignment Details</v-card-title>
        <v-card-text>
          <v-simple-table>
            <tbody>
              <tr>
                <td class="font-weight-bold">Assignment ID:</td>
                <td>{{ selectedAssignment.id }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">User ID:</td>
                <td>{{ selectedAssignment.userId }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Reward:</td>
                <td>{{ getRewardName(selectedAssignment.rewardId) }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Provider:</td>
                <td>{{ selectedAssignment.providerId }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Provider Reference:</td>
                <td>{{ selectedAssignment.providerReference }}</td>
              </tr>
              <tr v-if="selectedAssignment.eventId">
                <td class="font-weight-bold">Event ID:</td>
                <td>{{ selectedAssignment.eventId }}</td>
              </tr>
              <tr>
                <td class="font-weight-bold">Status:</td>
                <td>
                  <v-chip :color="getStatusColor(selectedAssignment.status)" small>
                    {{ getStatusName(selectedAssignment.status) }}
                  </v-chip>
                </td>
              </tr>
              <tr>
                <td class="font-weight-bold">Assigned At:</td>
                <td>{{ formatDateTime(selectedAssignment.assignedAt) }}</td>
              </tr>
              <tr v-if="selectedAssignment.expiresAt">
                <td class="font-weight-bold">Expires At:</td>
                <td>{{ formatDateTime(selectedAssignment.expiresAt) }}</td>
              </tr>
              <tr v-if="selectedAssignment.revokedAt">
                <td class="font-weight-bold">Revoked At:</td>
                <td>{{ formatDateTime(selectedAssignment.revokedAt) }}</td>
              </tr>
              <tr v-if="selectedAssignment.revokedReason">
                <td class="font-weight-bold">Revoke Reason:</td>
                <td>{{ selectedAssignment.revokedReason }}</td>
              </tr>
            </tbody>
          </v-simple-table>

          <v-subheader>Metadata</v-subheader>
          <pre class="text-caption">{{ JSON.stringify(selectedAssignment.metadata, null, 2) }}</pre>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="detailsDialog = false">Close</v-btn>
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
import { RewardAssignment, RewardStatus, Reward, PaginatedAssignments } from '@/store/admin/types';
import { 
  mdiMagnify, mdiDotsVertical, mdiEye, mdiCancel, 
  mdiPatreon, mdiHandHeart, mdiCog, mdiRefresh
} from '@mdi/js';
import { formatTimestampString } from "@/helpers/date-functions";

export default defineComponent({
  name: 'AdminAssignments',
  components: {},
  setup() {
    const oauthStore = useOauthStore();
    const assignments = ref<RewardAssignment[]>([]);
    const rewards = ref<Reward[]>([]);
    const searchUserId = ref('');
    const statusFilter = ref<RewardStatus | null>(null);
    const providerFilter = ref<string | null>(null);
    const loading = ref(false);
    const detailsDialog = ref(false);
    const selectedAssignment = ref<RewardAssignment | null>(null);
    const snackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');

    // Pagination state for 'By User' tab
    const paginationData = ref<PaginatedAssignments | null>(null);
    const currentPage = ref(1);
    const pageSize = ref(50);


    const token = computed(() => oauthStore.token);

    const headers = [
      { text: 'User ID', value: 'userId', sortable: true },
      { text: 'Reward', value: 'rewardId', sortable: false },
      { text: 'Provider', value: 'providerId', sortable: true },
      { text: 'Status', value: 'status', sortable: true },
      { text: 'Assigned', value: 'assignedAt', sortable: true },
      { text: 'Expires', value: 'expiresAt', sortable: true },
      { text: 'Actions', value: 'actions', sortable: false, width: '80px' },
    ];


    const statusFilterOptions = computed(() => [
      { text: 'Active', value: RewardStatus.Active },
      { text: 'Expired', value: RewardStatus.Expired },
      { text: 'Revoked', value: RewardStatus.Revoked },
    ]);

    const providerFilterOptions = computed(() => [
      { text: 'Patreon', value: 'patreon' },
      { text: 'Ko-Fi', value: 'kofi' },
    ]);


    const loadRewards = async () => {
      try {
        rewards.value = await AdminService.getRewards(token.value);
      } catch (error) {
        console.error('Error loading rewards:', error);
      }
    };

    const searchAssignments = async () => {
      if (!searchUserId.value.trim()) {
        showSnackbar('Please enter a User ID to search', 'warning');
        return;
      }

      loading.value = true;
      try {
        const result = await AdminService.getUserAssignments(searchUserId.value.trim(), token.value);
        
        // Apply filters
        let filteredResults = result;
        if (statusFilter.value !== null) {
          filteredResults = filteredResults.filter(a => a.status === statusFilter.value);
        }
        if (providerFilter.value) {
          filteredResults = filteredResults.filter(a => a.providerId === providerFilter.value);
        }
        
        assignments.value = filteredResults;
        paginationData.value = null; // Clear pagination for user-specific search
        
        if (result.length === 0) {
          showSnackbar('No assignments found for this user', 'info');
        } else {
          showSnackbar(`Found ${filteredResults.length} assignments`);
        }
      } catch (error) {
        showSnackbar('Failed to search assignments', 'error');
        console.error('Error searching assignments:', error);
      } finally {
        loading.value = false;
      }
    };

    const clearSearch = () => {
      searchUserId.value = '';
      statusFilter.value = null;
      providerFilter.value = null;
      assignments.value = [];
      paginationData.value = null;
      currentPage.value = 1;
    };

    const getRewardName = (rewardId: string): string => {
      const reward = rewards.value.find(r => r.id === rewardId);
      return reward?.name || 'Unknown Reward';
    };

    const getStatusName = (status: RewardStatus): string => {
      return RewardStatus[status] || 'Unknown';
    };

    const getStatusColor = (status: RewardStatus): string => {
      const colors: Record<RewardStatus, string> = {
        [RewardStatus.Active]: 'success',
        [RewardStatus.Expired]: 'warning',
        [RewardStatus.Revoked]: 'error',
      };
      return colors[status] || 'grey';
    };

    const getProviderIcon = (providerId: string): string => {
      const icons: Record<string, string> = {
        patreon: mdiPatreon,
        kofi: mdiHandHeart,
      };
      return icons[providerId.toLowerCase()] || mdiCog;
    };

    const formatDate = (dateString: string): string => {
      return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (dateString: string): string => {
      return new Date(dateString).toLocaleTimeString();
    };

    const formatDateTime = (dateString: string): string => {
      return new Date(dateString).toLocaleString();
    };

    const isExpired = (expiresAt: string): boolean => {
      return new Date(expiresAt) < new Date();
    };

    const viewDetails = (assignment: RewardAssignment) => {
      selectedAssignment.value = assignment;
      detailsDialog.value = true;
    };

    const revokeAssignment = async (assignment: RewardAssignment) => {
      if (assignment.status !== RewardStatus.Active) {
        showSnackbar('Can only revoke active assignments', 'warning');
        return;
      }

      const reason = prompt('Please enter a reason for revoking this assignment:');
      if (!reason) return;

      try {
        // Note: This would need a backend endpoint to revoke assignments
        // For now, show that it's not implemented
        showSnackbar('Assignment revocation not implemented yet', 'warning');
      } catch (error) {
        showSnackbar('Failed to revoke assignment', 'error');
        console.error('Error revoking assignment:', error);
      }
    };

    const showSnackbar = (message: string, color = 'success') => {
      snackbarText.value = message;
      snackbarColor.value = color;
      snackbar.value = true;
    };





    // New method to load all assignments with pagination
    const loadAllAssignments = async () => {
      loading.value = true;
      try {
        const assignmentsData = await AdminService.getAllAssignments(token.value, currentPage.value, pageSize.value);
        
        // Apply filters to the loaded data
        let filteredResults = assignmentsData.assignments;
        if (statusFilter.value !== null) {
          filteredResults = filteredResults.filter(a => a.status === statusFilter.value);
        }
        if (providerFilter.value) {
          filteredResults = filteredResults.filter(a => a.providerId === providerFilter.value);
        }
        
        assignments.value = filteredResults;
        paginationData.value = assignmentsData;
        
        showSnackbar(
          `Loaded ${filteredResults.length} assignments (page ${assignmentsData.page} of ${assignmentsData.totalPages})`
        );
      } catch (error) {
        showSnackbar('Failed to load assignments', 'error');
        console.error('Error loading assignments:', error);
      } finally {
        loading.value = false;
      }
    };

    // Pagination handlers
    const onPageChange = (page: number) => {
      currentPage.value = page;
      if (searchUserId.value.trim()) {
        searchAssignments();
      } else {
        loadAllAssignments();
      }
    };

    const onPageSizeChange = () => {
      currentPage.value = 1;
      if (searchUserId.value.trim()) {
        searchAssignments();
      } else {
        loadAllAssignments();
      }
    };








    onMounted(() => {
      loadRewards();
    });

    return {
      assignments,
      searchUserId,
      statusFilter,
      providerFilter,
      loading,
      detailsDialog,
      selectedAssignment,
      snackbar,
      snackbarText,
      snackbarColor,
      headers,
      statusFilterOptions,
      providerFilterOptions,
      
      // Pagination for 'By User' tab
      paginationData,
      currentPage,
      pageSize,
      
      searchAssignments,
      clearSearch,
      loadAllAssignments,
      onPageChange,
      onPageSizeChange,
      getRewardName,
      getStatusName,
      getStatusColor,
      getProviderIcon,
      formatDate,
      formatTime,
      formatDateTime,
      isExpired,
      viewDetails,
      revokeAssignment,
      mdiMagnify,
      mdiDotsVertical,
      mdiEye,
      mdiCancel,
      mdiRefresh,
    };
  },
});
</script>