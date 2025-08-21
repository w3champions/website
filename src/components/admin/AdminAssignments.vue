<template>
  <div>
    <v-card-title>
      Reward Assignments
    </v-card-title>

    <!-- Tab Navigation -->
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab>By User</v-tab>
      <v-tab>By Reward</v-tab>
    </v-tabs>

    <v-tabs-items v-model="activeTab">
      <!-- By User Tab -->
      <v-tab-item>
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
      </v-tab-item>

      <!-- By Reward Tab -->
      <v-tab-item>
        <v-card flat>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="rewardSearch"
                  label="Search rewards"
                  :prepend-icon="mdiMagnify"
                  clearable
                  @input="filterRewardGroups"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn
                  color="primary"
                  @click="loadAllAssignmentsGrouped"
                  :loading="loadingGrouped"
                >
                  <v-icon left>{{ mdiRefresh }}</v-icon>
                  Refresh
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Reward Groups Display -->
        <div v-for="group in filteredRewardGroups" :key="group.rewardId" class="mb-4">
          <v-card class="elevation-2">
            <v-card-title class="pb-2">
              <div class="d-flex justify-space-between align-center w-100">
                <div>
                  <h4>{{ group.rewardName || group.rewardId }}</h4>
                  <div class="text-caption text--secondary">ID: {{ group.rewardId }}</div>
                </div>
                <div class="d-flex align-center">
                  <v-chip-group>
                    <v-chip small color="success" class="mr-2">
                      Active: {{ group.activeCount }}
                    </v-chip>
                    <v-chip small color="warning" class="mr-2">
                      Expired: {{ group.expiredCount }}
                    </v-chip>
                    <v-chip small color="error">
                      Revoked: {{ group.revokedCount }}
                    </v-chip>
                  </v-chip-group>
                </div>
              </div>
            </v-card-title>

            <v-expand-transition>
              <div v-show="expandedGroups.includes(group.rewardId)">
                <v-divider></v-divider>
                <v-card-text>
                  <v-data-table
                    :headers="groupAssignmentHeaders"
                    :items="group.assignments"
                    :items-per-page="10"
                    :footer-props="{ itemsPerPageOptions: [5, 10, 25] }"
                    sort-by="assignedAt"
                    :sort-desc="true"
                    dense
                  >
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
                  </v-data-table>
                  
                  <!-- Pagination for individual reward's assignments -->
                  <div v-if="group._allAssignments.length > group._pageSize" class="text-center pa-2">
                    <v-pagination
                      :value="group._currentPage"
                      :length="Math.ceil(group._allAssignments.length / group._pageSize)"
                      :total-visible="5"
                      @input="onRewardAssignmentPageChange(group.rewardId, $event)"
                      small
                    ></v-pagination>
                    <div class="text-caption mt-1">
                      Showing {{ ((group._currentPage - 1) * group._pageSize) + 1 }} - {{ Math.min(group._currentPage * group._pageSize, group._allAssignments.length) }} 
                      of {{ group._allAssignments.length }} assignments
                    </div>
                    <v-select
                      :value="group._pageSize"
                      :items="[5, 10, 25, 50]"
                      label="Per page"
                      style="max-width: 100px; margin: 8px auto 0;"
                      dense
                      @change="onRewardAssignmentPageSizeChange(group.rewardId, $event)"
                    ></v-select>
                  </div>
                </v-card-text>
              </div>
            </v-expand-transition>

            <v-card-actions>
              <v-btn
                text
                @click="toggleGroupExpansion(group.rewardId)"
                class="ml-auto"
              >
                {{ expandedGroups.includes(group.rewardId) ? 'Hide' : 'Show' }} Users ({{ group.assignments.length }})
                <v-icon right>
                  {{ expandedGroups.includes(group.rewardId) ? mdiChevronUp : mdiChevronDown }}
                </v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </div>

        <div v-if="loadingGrouped" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-2">Loading assignments...</div>
        </div>

        <div v-if="!loadingGrouped && filteredRewardGroups.length === 0" class="text-center pa-4 text--secondary">
          <div v-if="rewardGroups.length === 0">
            Click "Refresh" to load assignments grouped by reward
          </div>
          <div v-else>
            No rewards match your search criteria
          </div>
        </div>

        <!-- Pagination for By Reward Tab -->
        <div v-if="groupedPaginationData && groupedPaginationData.totalPages > 1" class="text-center pa-4">
          <v-pagination
            v-model="groupedCurrentPage"
            :length="groupedPaginationData.totalPages"
            :total-visible="7"
            @input="onGroupedPageChange"
          ></v-pagination>
          <div class="text-caption mt-2">
            Showing {{ ((groupedCurrentPage - 1) * groupedPageSize) + 1 }} - {{ Math.min(groupedCurrentPage * groupedPageSize, groupedPaginationData.totalCount) }} 
            of {{ groupedPaginationData.totalCount }} rewards
          </div>
          <div class="mt-2">
            <v-select
              v-model="groupedPageSize"
              :items="[10, 20, 50]"
              label="Rewards per page"
              style="max-width: 150px; margin: 0 auto;"
              dense
              @change="onGroupedPageSizeChange"
            ></v-select>
          </div>
        </div>

        <!-- Total count info for By Reward Tab -->
        <div v-if="groupedPaginationData" class="text-center pa-2">
          <div class="text-caption">
            Total: {{ groupedPaginationData.totalCount }} rewards in system
          </div>
        </div>
      </v-tab-item>
    </v-tabs-items>

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
  mdiPatreon, mdiHandHeart, mdiCog, mdiRefresh,
  mdiChevronUp, mdiChevronDown
} from '@mdi/js';
import { formatTimestampString } from "@/helpers/date-functions";

export default defineComponent({
  name: 'AdminAssignments',
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

    // New data for grouped view
    const activeTab = ref(0);
    const rewardGroups = ref<any[]>([]);
    const filteredRewardGroups = ref<any[]>([]);
    const expandedGroups = ref<string[]>([]);
    const loadingGrouped = ref(false);
    const rewardSearch = ref('');

    // Data for grouped view (frontend pagination)
    const allRewards = ref<Reward[]>([]);
    const allAssignments = ref<RewardAssignment[]>([]);
    const groupedCurrentPage = ref(1);
    const groupedPageSize = ref(20);
    const groupedPaginationData = ref<any>(null);

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

    const groupAssignmentHeaders = [
      { text: 'User ID', value: 'userId', sortable: true },
      { text: 'Provider', value: 'providerId', sortable: true },
      { text: 'Status', value: 'status', sortable: true },
      { text: 'Assigned', value: 'assignedAt', sortable: true },
      { text: 'Expires', value: 'expiresAt', sortable: true },
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

    // Load all data and implement frontend pagination
    const loadAllAssignmentsGrouped = async () => {
      loadingGrouped.value = true;
      try {
        // Load all rewards and all assignments
        const [rewardsData, assignmentsData] = await Promise.all([
          AdminService.getRewards(token.value),
          AdminService.getAllAssignments(token.value, 1, 10000) // Get all assignments with large page size
        ]);
        
        allRewards.value = rewardsData;
        allAssignments.value = assignmentsData.assignments;
        
        // Group assignments by reward and calculate counts
        const groupedData = calculateRewardGroups();
        
        // Apply frontend pagination
        const totalRewards = groupedData.length;
        const startIndex = (groupedCurrentPage.value - 1) * groupedPageSize.value;
        const endIndex = startIndex + groupedPageSize.value;
        const paginatedRewards = groupedData.slice(startIndex, endIndex);
        
        rewardGroups.value = paginatedRewards;
        
        // Set pagination data for UI
        groupedPaginationData.value = {
          totalCount: totalRewards,
          page: groupedCurrentPage.value,
          pageSize: groupedPageSize.value,
          totalPages: Math.ceil(totalRewards / groupedPageSize.value)
        };
        
        filterRewardGroups();
        
        showSnackbar(
          `Loaded ${paginatedRewards.length} rewards (page ${groupedCurrentPage.value} of ${groupedPaginationData.value.totalPages}). ` +
          `Total: ${totalRewards} rewards, ${allAssignments.value.length} total assignments`
        );
      } catch (error) {
        showSnackbar('Failed to load grouped assignments', 'error');
        console.error('Error loading grouped assignments:', error);
      } finally {
        loadingGrouped.value = false;
      }
    };

    // Calculate reward groups with assignment counts
    const calculateRewardGroups = () => {
      const grouped: Record<string, any> = {};
      
      // Initialize groups for all rewards
      allRewards.value.forEach(reward => {
        grouped[reward.id] = {
          rewardId: reward.id,
          rewardName: reward.name,
          assignments: [],
          activeCount: 0,
          expiredCount: 0,
          revokedCount: 0,
          totalCount: 0,
          _fullReward: reward,
          _allAssignments: [],
          _currentPage: 1,
          _pageSize: 10
        };
      });
      
      // Add assignments to groups and count statuses
      allAssignments.value.forEach(assignment => {
        if (grouped[assignment.rewardId]) {
          grouped[assignment.rewardId]._allAssignments.push(assignment);
          grouped[assignment.rewardId].totalCount++;
          
          if (assignment.status === RewardStatus.Active) {
            grouped[assignment.rewardId].activeCount++;
          } else if (assignment.status === RewardStatus.Expired) {
            grouped[assignment.rewardId].expiredCount++;
          } else if (assignment.status === RewardStatus.Revoked) {
            grouped[assignment.rewardId].revokedCount++;
          }
        }
      });
      
      // Set initial page of assignments for each reward
      Object.values(grouped).forEach((group: any) => {
        group._allAssignments.sort((a: RewardAssignment, b: RewardAssignment) => 
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        );
        group.assignments = group._allAssignments.slice(0, group._pageSize);
      });
      
      // Sort by total assignment count (descending)
      return Object.values(grouped).sort((a: any, b: any) => b.totalCount - a.totalCount);
    };

    const filterRewardGroups = () => {
      if (!rewardSearch.value) {
        filteredRewardGroups.value = [...rewardGroups.value];
      } else {
        const search = rewardSearch.value.toLowerCase();
        filteredRewardGroups.value = rewardGroups.value.filter(group =>
          group.rewardName.toLowerCase().includes(search) ||
          group.rewardId.toLowerCase().includes(search)
        );
      }
    };

    const toggleGroupExpansion = (rewardId: string) => {
      const index = expandedGroups.value.indexOf(rewardId);
      if (index === -1) {
        expandedGroups.value.push(rewardId);
      } else {
        expandedGroups.value.splice(index, 1);
      }
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

    const onGroupedPageChange = (page: number) => {
      groupedCurrentPage.value = page;
      
      // Recalculate pagination with current data
      const groupedData = calculateRewardGroups();
      const startIndex = (page - 1) * groupedPageSize.value;
      const endIndex = startIndex + groupedPageSize.value;
      rewardGroups.value = groupedData.slice(startIndex, endIndex);
      
      groupedPaginationData.value.page = page;
      filterRewardGroups();
    };

    const onGroupedPageSizeChange = () => {
      groupedCurrentPage.value = 1;
      
      // Recalculate pagination with new page size
      const groupedData = calculateRewardGroups();
      const totalRewards = groupedData.length;
      
      groupedPaginationData.value = {
        totalCount: totalRewards,
        page: 1,
        pageSize: groupedPageSize.value,
        totalPages: Math.ceil(totalRewards / groupedPageSize.value)
      };
      
      rewardGroups.value = groupedData.slice(0, groupedPageSize.value);
      filterRewardGroups();
    };

    // Handle pagination within a reward's assignment list (frontend pagination)
    const onRewardAssignmentPageChange = (rewardId: string, page: number) => {
      const group = rewardGroups.value.find(g => g.rewardId === rewardId);
      if (!group) return;
      
      group._currentPage = page;
      const startIndex = (page - 1) * group._pageSize;
      const endIndex = startIndex + group._pageSize;
      group.assignments = group._allAssignments.slice(startIndex, endIndex);
    };

    const onRewardAssignmentPageSizeChange = (rewardId: string, pageSize: number) => {
      const group = rewardGroups.value.find(g => g.rewardId === rewardId);
      if (!group) return;
      
      group._pageSize = pageSize;
      group._currentPage = 1;
      group.assignments = group._allAssignments.slice(0, pageSize);
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
      groupAssignmentHeaders,
      statusFilterOptions,
      providerFilterOptions,
      
      // Pagination for 'By User' tab
      paginationData,
      currentPage,
      pageSize,
      
      // New grouped functionality
      activeTab,
      rewardGroups,
      filteredRewardGroups,
      expandedGroups,
      loadingGrouped,
      rewardSearch,
      groupedCurrentPage,
      groupedPageSize,
      groupedPaginationData,
      allRewards,
      allAssignments,
      calculateRewardGroups,
      loadAllAssignmentsGrouped,
      filterRewardGroups,
      toggleGroupExpansion,
      
      searchAssignments,
      clearSearch,
      loadAllAssignments,
      onPageChange,
      onPageSizeChange,
      onGroupedPageChange,
      onGroupedPageSizeChange,
      onRewardAssignmentPageChange,
      onRewardAssignmentPageSizeChange,
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
      mdiChevronUp,
      mdiChevronDown,
    };
  },
});
</script>