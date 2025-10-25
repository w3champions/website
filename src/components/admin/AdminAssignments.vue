<template>
  <div>
    <v-card-title class="text-h4 mb-4">
      <v-icon start class="mr-3">{{ mdiAccountMultiple }}</v-icon>
      Reward Assignments
    </v-card-title>

    <!-- Statistics Summary Cards -->
    <v-row v-if="assignments.length > 0 || paginationData" class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card border class="text-center pa-4">
          <div class="text-h4 text-primary mb-1">{{ getTotalCount() }}</div>
          <div class="text-subtitle2 text--secondary">Total Assignments</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card border class="text-center pa-4">
          <div class="text-h4 text-success mb-1">{{ getActiveCount() }}</div>
          <div class="text-subtitle2 text--secondary">Active</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card border class="text-center pa-4">
          <div class="text-h4 text-warning mb-1">{{ getExpiredCount() }}</div>
          <div class="text-subtitle2 text--secondary">Expired</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card border class="text-center pa-4">
          <div class="text-h4 text-error mb-1">{{ getRevokedCount() }}</div>
          <div class="text-subtitle2 text--secondary">Revoked</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Enhanced Search and Filters -->
    <v-card flat class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <player-search
              ref="playerSearchComponent"
              :classes="'outlined dense'"
              :setAutofocus="false"
              @playerFound="onPlayerFound"
              @searchCleared="onPlayerSearchCleared"
            />
            <div v-if="selectedPlayer" class="mt-2 d-flex align-center">
              <v-avatar size="24" color="primary" class="mr-2">
                <v-icon size="small" color="white">{{ mdiAccount }}</v-icon>
              </v-avatar>
              <span class="font-weight-medium">{{ selectedPlayer }}</span>
              <v-btn icon size="x-small" class="ml-2" @click="clearPlayerSelection">
                <v-icon size="x-small">{{ mdiClose }}</v-icon>
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              :items="statusFilterOptions"
              label="Status Filter"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="providerFilter"
              :items="providerFilterOptions"
              label="Provider Filter"
              variant="outlined"
              density="compact"
              clearable
            />
          </v-col>
        </v-row>

        <!-- Quick Filter Buttons -->
        <v-row class="mb-4">
          <v-col cols="12">
            <div class="mb-2 text-subtitle2 text--secondary">Quick Filters:</div>
            <v-chip-group v-model="quickFilter" column>
              <v-chip filter variant="outlined" size="small" @click="applyQuickFilter('active')">
                <v-icon start size="small" color="success">{{ mdiCheckCircle }}</v-icon>
                Active Only
              </v-chip>
              <v-chip filter variant="outlined" size="small" @click="applyQuickFilter('expired')">
                <v-icon start size="small" color="warning">{{ mdiClockOutline }}</v-icon>
                Expired Only
              </v-chip>
              <v-chip filter variant="outlined" size="small" @click="applyQuickFilter('revoked')">
                <v-icon start size="small" color="error">{{ mdiCancel }}</v-icon>
                Revoked Only
              </v-chip>
              <v-chip filter variant="outlined" size="small" @click="applyQuickFilter('patreon')">
                <v-icon start size="small">{{ mdiPatreon }}</v-icon>
                Patreon
              </v-chip>
              <v-chip filter variant="outlined" size="small" @click="applyQuickFilter('kofi')">
                <v-icon start size="small">{{ mdiHandHeart }}</v-icon>
                Ko-Fi
              </v-chip>
            </v-chip-group>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="auto">
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!selectedPlayer"
              @click="searchAssignments"
            >
              <v-icon start>{{ mdiMagnify }}</v-icon>
              Search
            </v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn
              variant="outlined"
              @click="clearSearch"
            >
              <v-icon start>{{ mdiFilterRemove }}</v-icon>
              Clear All
            </v-btn>
          </v-col>
          <v-col cols="auto">
            <v-btn
              color="secondary"
              :loading="loading"
              @click="loadAllAssignments"
            >
              <v-icon start>{{ mdiRefresh }}</v-icon>
              Load All Assignments
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Enhanced Data Table -->
    <v-card class="elevation-2">
      <v-card-text v-if="loading && assignments.length === 0" class="text-center py-8">
        <v-skeleton-loader type="table" />
        <div class="mt-4 text-subtitle1">Loading assignments...</div>
      </v-card-text>

      <v-data-table
        v-else
        :headers="headers"
        :items="assignments"
        :items-per-page="-1"
        :sort-by="[{ key: 'assignedAt', order: 'desc' }]"
        :loading="loading && assignments.length > 0"
        :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
        hide-default-footer
      >
        <template v-slot:item.userId="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-3" color="primary">
              <v-icon size="small" color="white">{{ mdiAccount }}</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.userId }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.rewardId="{ item }">
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="primary" size="small">{{ mdiGift }}</v-icon>
            <div>
              <div class="font-weight-medium text-primary">{{ getRewardName(item.rewardId) }}</div>
              <div class="text-caption text--secondary">{{ item.rewardId }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" label variant="flat">
            <v-icon start size="small">{{ getStatusIcon(item.status) }}</v-icon>
            {{ getStatusName(item.status) }}
          </v-chip>
        </template>

        <template v-slot:item.providerId="{ item }">
          <v-chip size="small" variant="outlined" :color="getProviderColor(item.providerId)">
            <v-icon start size="small" :color="getProviderColor(item.providerId)">{{ getProviderIcon(item.providerId) }}</v-icon>
            {{ formatProviderName(item.providerId) }}
          </v-chip>
        </template>

        <template v-slot:item.assignedAt="{ item }">
          <div>
            <div class="font-weight-medium">{{ formatDate(item.assignedAt) }}</div>
            <div class="text-caption text--secondary">{{ formatTime(item.assignedAt) }}</div>
          </div>
        </template>

        <template v-slot:item.expiresAt="{ item }">
          <div v-if="item.expiresAt">
            <div :class="getExpirationClass(item.expiresAt)" class="font-weight-medium">
              {{ formatDate(item.expiresAt) }}
            </div>
            <div class="text-caption text--secondary">{{ formatTime(item.expiresAt) }}</div>
            <v-chip v-if="isExpiringSoon(item.expiresAt) && !isExpired(item.expiresAt)" size="x-small" color="orange" class="mt-1">
              Expires Soon
            </v-chip>
          </div>
          <div v-else class="text--secondary font-italic">Permanent</div>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn
              icon
              size="small"
              color="primary"
              class="mr-1"
              variant="outlined"
              @click="viewDetails(item)"
            >
              <v-icon size="small">{{ mdiEye }}</v-icon>
            </v-btn>
            <v-btn
              v-if="item.status === 0"
              icon
              size="small"
              color="error"
              variant="outlined"
              :disabled="item.status !== 0"
              @click="revokeAssignment(item)"
            >
              <v-icon size="small">{{ mdiCancel }}</v-icon>
            </v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">{{ mdiDatabaseSearch }}</v-icon>
            <div class="text-h6 text--secondary mb-2">No assignments found</div>
            <div class="text-body-2 text--secondary mb-4">
              {{ selectedPlayer ? 'Try searching for a different user or adjust your filters' : 'Use the player search above to find user assignments or load all assignments' }}
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Enhanced Pagination -->
    <v-card v-if="paginationData && paginationData.totalPages > 1" flat class="mt-4">
      <v-card-text class="text-center">
        <v-pagination
          v-model="currentPage"
          :length="paginationData.totalPages"
          :total-visible="7"
          color="primary"
          @update:model-value="onPageChange"
        />
        <div class="d-flex justify-center align-center mt-3">
          <div class="text-body-2 text--secondary mr-4">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }} - {{ Math.min(currentPage * pageSize, paginationData.totalCount) }}
            of {{ paginationData.totalCount.toLocaleString() }} assignments
          </div>
          <v-select
            v-model="pageSize"
            :items="[25, 50, 100, 200]"
            label="Per page"
            style="max-width: 120px;"
            density="compact"
            variant="outlined"
            @update:model-value="onPageSizeChange"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Enhanced Assignment Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="700px" scrollable>
      <v-card v-if="selectedAssignment">
        <v-card-title class="text-h5 bg-primary text-white">
          <v-icon start color="white">{{ mdiClipboardText }}</v-icon>
          Assignment Details
          <v-spacer />
          <v-btn icon color="white" @click="detailsDialog = false">
            <v-icon>{{ mdiClose }}</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4">
          <!-- User & Reward Info -->
          <v-row class="mb-4">
            <v-col cols="6">
              <v-card border class="pa-3">
                <div class="text-overline text--secondary mb-1">User</div>
                <div class="d-flex align-center">
                  <v-avatar size="32" color="primary" class="mr-2">
                    <v-icon size="small" color="white">{{ mdiAccount }}</v-icon>
                  </v-avatar>
                  <div class="font-weight-bold">{{ selectedAssignment.userId }}</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card border class="pa-3">
                <div class="text-overline text--secondary mb-1">Reward</div>
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">{{ mdiGift }}</v-icon>
                  <div>
                    <div class="font-weight-bold">{{ getRewardName(selectedAssignment.rewardId) }}</div>
                    <div class="text-caption text--secondary">{{ selectedAssignment.rewardId }}</div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Status & Provider -->
          <v-row class="mb-4">
            <v-col cols="6">
              <v-card border class="pa-3">
                <div class="text-overline text--secondary mb-1">Status</div>
                <v-chip :color="getStatusColor(selectedAssignment.status)" label>
                  <v-icon start size="x-small">{{ getStatusIcon(selectedAssignment.status) }}</v-icon>
                  {{ getStatusName(selectedAssignment.status) }}
                </v-chip>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card border class="pa-3">
                <div class="text-overline text--secondary mb-1">Provider</div>
                <v-chip variant="outlined" :color="getProviderColor(selectedAssignment.providerId)">
                  <v-icon start size="small" :color="getProviderColor(selectedAssignment.providerId)">{{ getProviderIcon(selectedAssignment.providerId) }}</v-icon>
                  {{ formatProviderName(selectedAssignment.providerId) }}
                </v-chip>
              </v-card>
            </v-col>
          </v-row>

          <!-- Timeline Information -->
          <v-card border class="mb-4">
            <v-card-subtitle class="pb-0">
              <v-icon start class="mr-2">{{ mdiTimeline }}</v-icon>
              Timeline
            </v-card-subtitle>
            <v-card-text>
              <v-timeline density="compact">
                <v-timeline-item dot-color="success" size="small">
                  <template v-slot:icon>
                    <v-icon size="small">{{ mdiPlus }}</v-icon>
                  </template>
                  <div>
                    <div class="font-weight-bold">Assigned</div>
                    <div class="text-caption">{{ formatDateTime(selectedAssignment.assignedAt) }}</div>
                  </div>
                </v-timeline-item>

                <v-timeline-item
                  v-if="selectedAssignment.expiresAt"
                  :dot-color="isExpired(selectedAssignment.expiresAt) ? 'warning' : 'info'"
                  size="small"
                >
                  <template v-slot:icon>
                    <v-icon size="small">{{ isExpired(selectedAssignment.expiresAt) ? mdiClockAlert : mdiClock }}</v-icon>
                  </template>
                  <div>
                    <div class="font-weight-bold">
                      {{ isExpired(selectedAssignment.expiresAt) ? 'Expired' : 'Expires' }}
                    </div>
                    <div class="text-caption">{{ formatDateTime(selectedAssignment.expiresAt) }}</div>
                  </div>
                </v-timeline-item>

                <v-timeline-item v-if="selectedAssignment.revokedAt" dot-color="error" size="small">
                  <template v-slot:icon>
                    <v-icon size="small">{{ mdiCancel }}</v-icon>
                  </template>
                  <div>
                    <div class="font-weight-bold">Revoked</div>
                    <div class="text-caption">{{ formatDateTime(selectedAssignment.revokedAt) }}</div>
                    <div v-if="selectedAssignment.revokedReason" class="text-body-2 mt-1">
                      Reason: {{ selectedAssignment.revokedReason }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>

          <!-- Technical Details -->
          <v-expansion-panels v-model="detailsExpansionPanel">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon class="mr-2">{{ mdiCog }}</v-icon>
                  Technical Details
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <tbody>
                    <tr>
                      <td class="font-weight-bold" style="width: 40%;">Assignment ID:</td>
                      <td class="font-family-monospace">{{ selectedAssignment.id }}</td>
                    </tr>
                    <tr>
                      <td class="font-weight-bold">Provider Reference:</td>
                      <td class="font-family-monospace">{{ selectedAssignment.providerReference || 'N/A' }}</td>
                    </tr>
                    <tr v-if="selectedAssignment.eventId">
                      <td class="font-weight-bold">Event ID:</td>
                      <td class="font-family-monospace">{{ selectedAssignment.eventId }}</td>
                    </tr>
                    <tr v-if="selectedAssignment.metadata && Object.keys(selectedAssignment.metadata).length > 0">
                      <td class="font-weight-bold">Metadata:</td>
                      <td>
                        <pre class="text-caption font-family-monospace">{{ JSON.stringify(selectedAssignment.metadata, null, 2) }}</pre>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="selectedAssignment.status === 0"
            color="error"
            variant="outlined"
            @click="revokeAssignment(selectedAssignment)"
          >
            <v-icon start>{{ mdiCancel }}</v-icon>
            Revoke Assignment
          </v-btn>
          <v-btn color="primary" @click="detailsDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000" location="top">
      <v-icon v-if="snackbarColor === 'success'" start>{{ mdiCheckCircle }}</v-icon>
      <v-icon v-if="snackbarColor === 'error'" start>{{ mdiAlert }}</v-icon>
      <v-icon v-if="snackbarColor === 'warning'" start>{{ mdiAlertCircle }}</v-icon>
      <v-icon v-if="snackbarColor === 'info'" start>{{ mdiInformation }}</v-icon>
      {{ snackbarText }}
      <template v-slot:actions="{ isActive }">
        <v-btn variant="text" v-bind="isActive" @click="snackbar = false">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, getCurrentInstance } from "vue";
import { useOauthStore } from "@/store/oauth/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import AdminService from "@/services/admin/AdminService";
import { RewardAssignment, RewardStatus, Reward, PaginatedAssignments } from "@/store/admin/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import {
  mdiMagnify, mdiDotsVertical, mdiEye, mdiCancel,
  mdiPatreon, mdiHandHeart, mdiCog, mdiRefresh,
  mdiAccountMultiple, mdiAccount, mdiGift, mdiCheckCircle,
  mdiClockOutline, mdiFilterRemove, mdiDatabaseSearch,
  mdiClipboardText, mdiClose, mdiTimeline, mdiPlus,
  mdiClock, mdiClockAlert, mdiAlert, mdiAlertCircle,
  mdiInformation
} from "@mdi/js";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminAssignments",
  components: {
    PlayerSearch,
  },
  setup() {
    const instance = getCurrentInstance();
    const oauthStore = useOauthStore();
    const playerSearchStore = usePlayerSearchStore();
    const assignments = ref<RewardAssignment[]>([]);
    const rewards = ref<Reward[]>([]);
    const selectedPlayer = ref<string>("");
    const statusFilter = ref<RewardStatus | null>(null);
    const playerSearchComponent = ref<InstanceType<typeof PlayerSearch> | null>(null);
    const providerFilter = ref<string | null>(null);
    const loading = ref(false);
    const detailsDialog = ref(false);
    const selectedAssignment = ref<RewardAssignment | null>(null);
    const snackbar = ref(false);
    const snackbarText = ref("");
    const snackbarColor = ref("success");
    const quickFilter = ref(null);
    const detailsExpansionPanel = ref(null);

    // Pagination state for 'By User' tab
    const paginationData = ref<PaginatedAssignments | null>(null);
    const currentPage = ref(1);
    const pageSize = ref(50);

    const token = computed(() => oauthStore.token);

    const headers: DataTableHeader[] = [
      { title: "User", value: "userId", sortable: true, width: "200px" },
      { title: "Reward", value: "rewardId", sortable: false, width: "250px" },
      { title: "Provider", value: "providerId", sortable: true, width: "120px" },
      { title: "Status", value: "status", sortable: true, width: "120px" },
      { title: "Assigned", value: "assignedAt", sortable: true, width: "150px" },
      { title: "Expires", value: "expiresAt", sortable: true, width: "150px" },
      { title: "Actions", value: "actions", sortable: false, width: "100px" },
    ];

    const statusFilterOptions = ref<{ title: string; value: RewardStatus }[]>([
      { title: "Active", value: RewardStatus.Active },
      { title: "Expired", value: RewardStatus.Expired },
      { title: "Revoked", value: RewardStatus.Revoked },
    ]);

    const providerFilterOptions = ref<{ title: string; value: string }[]>([
      { title: "Patreon", value: "patreon" },
      { title: "Ko-Fi", value: "kofi" },
    ]);

    const loadRewards = async () => {
      try {
        rewards.value = await AdminService.getRewards(token.value);
      } catch (error) {
        console.error("Error loading rewards:", error);
      }
    };

    const searchAssignments = async () => {
      if (!selectedPlayer.value.trim()) {
        showSnackbar("Please select a player to search", "warning");
        return;
      }

      loading.value = true;
      try {
        const result = await AdminService.getUserAssignments(selectedPlayer.value.trim(), token.value);

        // Apply filters
        let filteredResults = result;
        if (statusFilter.value !== null) {
          filteredResults = filteredResults.filter((a) => a.status === statusFilter.value);
        }
        if (providerFilter.value) {
          filteredResults = filteredResults.filter((a) => a.providerId === providerFilter.value);
        }

        assignments.value = filteredResults;
        paginationData.value = null; // Clear pagination for user-specific search

        if (result.length === 0) {
          showSnackbar("No assignments found for this user", "info");
        } else {
          showSnackbar(`Found ${filteredResults.length} assignments`);
        }
      } catch (error) {
        showSnackbar("Failed to search assignments", "error");
        console.error("Error searching assignments:", error);
      } finally {
        loading.value = false;
      }
    };

    const clearSearch = () => {
      selectedPlayer.value = "";
      statusFilter.value = null;
      providerFilter.value = null;
      quickFilter.value = null;
      assignments.value = [];
      paginationData.value = null;
      currentPage.value = 1;
      // Clear the player search component
      playerSearchStore.clearPlayerSearch();
      showSnackbar("All filters cleared", "info");
    };

    const onPlayerFound = (battleTag: string) => {
      selectedPlayer.value = battleTag;
      // Automatically search when player is selected
      searchAssignments();
    };

    const onPlayerSearchCleared = () => {
      selectedPlayer.value = "";
      assignments.value = [];
      paginationData.value = null;
    };

    const clearPlayerSelection = () => {
      selectedPlayer.value = "";
      assignments.value = [];
      paginationData.value = null;
      playerSearchStore.clearPlayerSearch();
    };

    // Translation helper function
    function getRewardTranslatedName(displayId: string): string {
      const key = `rewards.${displayId}.name`;
      const translated = instance?.proxy?.$t(key) as string;
      return translated !== key ? translated : displayId;
    }

    const getRewardName = (rewardId: string): string => {
      const reward = rewards.value.find((r) => r.id === rewardId);
      return reward ? getRewardTranslatedName(reward.displayId) : "Unknown Reward";
    };

    const getStatusName = (status: RewardStatus): string => {
      return RewardStatus[status] || "Unknown";
    };

    const getStatusColor = (status: RewardStatus): string => {
      const colors: Record<RewardStatus, string> = {
        [RewardStatus.Pending]: "grey",
        [RewardStatus.Active]: "success",
        [RewardStatus.Expired]: "warning",
        [RewardStatus.Revoked]: "error",
        [RewardStatus.Failed]: "grey",
      };
      return colors[status] || "grey";
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

    const isExpiringSoon = (expiresAt: string): boolean => {
      const expiration = new Date(expiresAt);
      const now = new Date();
      const daysUntilExpiration = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
    };

    const getExpirationClass = (expiresAt: string): string => {
      if (isExpired(expiresAt)) return "error--text";
      if (isExpiringSoon(expiresAt)) return "warning--text";
      return "text--primary";
    };

    const getStatusIcon = (status: RewardStatus): string => {
      const icons: Record<RewardStatus, string> = {
        [RewardStatus.Pending]: mdiCog,
        [RewardStatus.Active]: mdiCheckCircle,
        [RewardStatus.Expired]: mdiClockAlert,
        [RewardStatus.Revoked]: mdiCancel,
        [RewardStatus.Failed]: mdiCog,
      };
      return icons[status] || mdiCog;
    };

    const getProviderColor = (providerId: string): string => {
      const colors: Record<string, string> = {
        patreon: "orange",
        kofi: "blue",
      };
      return colors[providerId.toLowerCase()] || "primary";
    };

    const formatProviderName = (providerId: string): string => {
      const names: Record<string, string> = {
        patreon: "Patreon",
        kofi: "Ko-Fi",
      };
      return names[providerId.toLowerCase()] || providerId;
    };

    // Statistics methods
    const getTotalCount = (): number => {
      return paginationData.value?.totalCount || assignments.value.length;
    };

    const getActiveCount = (): number => {
      const allAssignments = paginationData.value ? [] : assignments.value;
      return allAssignments.filter((a) => a.status === RewardStatus.Active).length;
    };

    const getExpiredCount = (): number => {
      const allAssignments = paginationData.value ? [] : assignments.value;
      return allAssignments.filter((a) => a.status === RewardStatus.Expired).length;
    };

    const getRevokedCount = (): number => {
      const allAssignments = paginationData.value ? [] : assignments.value;
      return allAssignments.filter((a) => a.status === RewardStatus.Revoked).length;
    };

    const applyQuickFilter = (filterType: string) => {
      switch (filterType) {
        case "active":
          statusFilter.value = RewardStatus.Active;
          providerFilter.value = null;
          break;
        case "expired":
          statusFilter.value = RewardStatus.Expired;
          providerFilter.value = null;
          break;
        case "revoked":
          statusFilter.value = RewardStatus.Revoked;
          providerFilter.value = null;
          break;
        case "patreon":
          providerFilter.value = "patreon";
          statusFilter.value = null;
          break;
        case "kofi":
          providerFilter.value = "kofi";
          statusFilter.value = null;
          break;
      }

      if (selectedPlayer.value.trim()) {
        searchAssignments();
      } else {
        loadAllAssignments();
      }
    };

    const viewDetails = (assignment: RewardAssignment) => {
      selectedAssignment.value = assignment;
      detailsDialog.value = true;
    };

    const revokeAssignment = async (assignment: RewardAssignment) => {
      if (assignment.status !== RewardStatus.Active) {
        showSnackbar("Can only revoke active assignments", "warning");
        return;
      }

      const reason = prompt("Please enter a reason for revoking this assignment:");
      if (!reason) return;

      try {
        // Note: This would need a backend endpoint to revoke assignments
        // For now, show that it's not implemented
        showSnackbar("Assignment revocation not implemented yet", "warning");
      } catch (error) {
        showSnackbar("Failed to revoke assignment", "error");
        console.error("Error revoking assignment:", error);
      }
    };

    const showSnackbar = (message: string, color = "success") => {
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
          filteredResults = filteredResults.filter((a) => a.status === statusFilter.value);
        }
        if (providerFilter.value) {
          filteredResults = filteredResults.filter((a) => a.providerId === providerFilter.value);
        }

        assignments.value = filteredResults;
        paginationData.value = assignmentsData;

        showSnackbar(
          `Loaded ${filteredResults.length} assignments (page ${assignmentsData.page} of ${assignmentsData.totalPages})`
        );
      } catch (error) {
        showSnackbar("Failed to load assignments", "error");
        console.error("Error loading assignments:", error);
      } finally {
        loading.value = false;
      }
    };

    // Pagination handlers
    const onPageChange = (page: number) => {
      currentPage.value = page;
      if (selectedPlayer.value.trim()) {
        searchAssignments();
      } else {
        loadAllAssignments();
      }
    };

    const onPageSizeChange = () => {
      currentPage.value = 1;
      if (selectedPlayer.value.trim()) {
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
      selectedPlayer,
      playerSearchComponent,
      statusFilter,
      providerFilter,
      loading,
      detailsDialog,
      selectedAssignment,
      snackbar,
      snackbarText,
      snackbarColor,
      quickFilter,
      detailsExpansionPanel,
      headers,
      statusFilterOptions,
      providerFilterOptions,

      // Pagination for 'By User' tab
      paginationData,
      currentPage,
      pageSize,

      // Methods
      searchAssignments,
      clearSearch,
      clearPlayerSelection,
      onPlayerFound,
      onPlayerSearchCleared,
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
      isExpiringSoon,
      getExpirationClass,
      getStatusIcon,
      getProviderColor,
      formatProviderName,
      getTotalCount,
      getActiveCount,
      getExpiredCount,
      getRevokedCount,
      applyQuickFilter,
      viewDetails,
      revokeAssignment,

      // Icons
      mdiMagnify,
      mdiDotsVertical,
      mdiEye,
      mdiCancel,
      mdiRefresh,
      mdiAccountMultiple,
      mdiAccount,
      mdiGift,
      mdiCheckCircle,
      mdiClockOutline,
      mdiFilterRemove,
      mdiDatabaseSearch,
      mdiClipboardText,
      mdiClose,
      mdiTimeline,
      mdiPlus,
      mdiClock,
      mdiClockAlert,
      mdiAlert,
      mdiAlertCircle,
      mdiInformation,
      mdiPatreon,
      mdiHandHeart,
      mdiCog,
    };
  },
});
</script>

<style lang="scss" scoped>
.font-family-monospace {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
  font-size: 0.875rem;
}
</style>
