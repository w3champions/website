<template>
  <div>
    <v-card-title class="py-3">
      <v-icon start class="mr-3">{{ mdiAccountHeart }}</v-icon>
      Patreon Account Links
    </v-card-title>

    <!-- Statistics Summary Cards -->
    <v-row v-if="patreonLinks.length > 0" class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card border class="text-center pa-4">
          <div class="text-h4 text-primary mb-1">{{ getTotalLinks() }}</div>
          <div class="w3-gray-text">Total Links</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card border class="text-center pa-4">
          <div class="text-h4 text-success mb-1">{{ getRecentLinks() }}</div>
          <div class="w3-gray-text">Recent (30 days)</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card border class="text-center pa-4">
          <div class="text-h4 text-warning mb-1">{{ getStaleLinks() }}</div>
          <div class="w3-gray-text">Not Synced (7+ days)</div>
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
            <v-btn
              variant="outlined"
              @click="clearFilters"
            >
              <v-icon start>{{ mdiFilterRemove }}</v-icon>
              Clear Filters
            </v-btn>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              :loading="loading"
              @click="loadPatreonLinks"
            >
              <v-icon start>{{ mdiRefresh }}</v-icon>
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Enhanced Data Table -->
    <v-card class="elevation-2">
      <v-card-text v-if="loading && patreonLinks.length === 0" class="text-center py-8">
        <v-skeleton-loader type="table" />
        <div class="mt-4 text-subtitle-1">Loading Patreon links...</div>
      </v-card-text>

      <v-data-table
        v-else
        :headers="headers"
        :items="filteredLinks"
        :items-per-page="25"
        :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
        :sort-by="[{ key: 'linkedAt', order: 'desc' }]"
        :loading="loading && patreonLinks.length > 0"
        :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
      >
        <template v-slot:item.battleTag="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-3" color="primary">
              <v-icon size="small" color="white">{{ mdiAccount }}</v-icon>
            </v-avatar>
            <div class="font-weight-medium">{{ item.battleTag }}</div>
          </div>
        </template>

        <template v-slot:item.patreonUserId="{ item }">
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="orange" size="small">{{ mdiPatreon }}</v-icon>
            <div class="text-caption font-family-monospace">{{ item.patreonUserId }}</div>
          </div>
        </template>

        <template v-slot:item.linkedAt="{ item }">
          <div>
            <div class="font-weight-medium">{{ formatDate(item.linkedAt) }}</div>
            <div class="text-caption w3-gray-text">{{ formatTime(item.linkedAt) }}</div>
          </div>
        </template>

        <template v-slot:item.lastSyncAt="{ item }">
          <div>
            <div class="font-weight-medium" :class="getSyncStatusClass(item.lastSyncAt)">{{ formatDate(item.lastSyncAt) }}</div>
            <div class="text-caption w3-gray-text">{{ formatTime(item.lastSyncAt) }}</div>
            <v-chip v-if="isStaleSync(item.lastSyncAt)" size="x-small" color="orange" class="mt-1">
              Stale Sync
            </v-chip>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-tooltip location="bottom" content-class="w3-tooltip elevation-1">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  size="large"
                  color="info"
                  variant="plain"
                  :disabled="loadingMemberDetails"
                  :loading="loadingMemberDetails && selectedMemberBattleTag === item.battleTag"
                  v-bind="props"
                  @click="viewMemberDetails(item)"
                >
                  <v-icon size="small">{{ mdiMagnify }}</v-icon>
                </v-btn>
              </template>
              <span>View details</span>
            </v-tooltip>
            <v-tooltip location="bottom" content-class="w3-tooltip elevation-1">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  size="large"
                  color="error"
                  variant="plain"
                  :disabled="deletingLinks.includes(item.battleTag)"
                  :loading="deletingLinks.includes(item.battleTag)"
                  v-bind="props"
                  @click="confirmDelete(item)"
                >
                  <v-icon size="small">{{ mdiDelete }}</v-icon>
                </v-btn>
              </template>
              <span>Delete link</span>
            </v-tooltip>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-2" class="mb-4">{{ mdiAccountSearch }}</v-icon>
            <div class="text-h6 w3-gray-text mb-2">No Patreon links found</div>
            <div class="text-body-2 w3-gray-text mb-4">
              {{ selectedPlayer ? 'No Patreon account linked for this user' : 'No Patreon account links exist or try adjusting your search' }}
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title>
          <span class="text-h5">Confirm Delete</span>
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete the Patreon link for <strong>{{ selectedLink?.battleTag }}</strong>?
          <br />
          <v-alert type="warning" density="compact">
            This will revoke all active Patreon rewards for this user and cannot be undone.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deletePatreonLink"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Member Details Dialog -->
    <v-dialog v-model="memberDetailsDialog" max-width="700">
      <v-card>
        <v-card-title>
          <span class="text-h5">
            <v-icon start>{{ mdiAccountDetails }}</v-icon>
            Patreon Member Details
          </span>
        </v-card-title>
        <v-card-text v-if="memberDetails">
          <!-- User Info -->
          <v-row class="mb-4">
            <v-col cols="12">
              <div class="w3-gray-text mb-1">BattleTag</div>
              <div class="text-body-1 font-weight-medium">{{ memberDetails.battleTag }}</div>
            </v-col>
          </v-row>

          <!-- Patreon Status -->
          <v-divider class="mb-4" />
          <div class="text-subtitle-1 w3-gray-text font-weight-bold mb-3">Patreon Status</div>

          <v-row v-if="memberDetails.found">
            <v-col cols="12" md="6">
              <v-card border class="pa-3">
                <div class="text-caption w3-gray-text">Patron Status</div>
                <v-chip
                  :color="memberDetails.isActivePatron ? 'success' : 'error'"
                  size="small"
                  class="mt-1"
                >
                  {{ memberDetails.patronStatus || 'Unknown' }}
                </v-chip>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card border class="pa-3">
                <div class="text-caption w3-gray-text">Last Charge</div>
                <div class="text-body-2 mt-1">
                  <v-chip
                    :color="memberDetails.lastChargeStatus === 'Paid' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ memberDetails.lastChargeStatus || 'N/A' }}
                  </v-chip>
                </div>
                <div v-if="memberDetails.lastChargeDate" class="text-caption mt-1">
                  {{ formatDate(memberDetails.lastChargeDate) }}
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-alert v-else type="warning" prominent class="mt-3">
            {{ memberDetails.message || memberDetails.error }}
          </v-alert>

          <!-- Member Info -->
          <div v-if="memberDetails.found" class="mt-4">
            <v-divider class="mb-4" />
            <div class="text-subtitle-1 w3-gray-text font-weight-bold mb-3">Member Information</div>

            <v-table density="compact">
              <tbody>
                <tr>
                  <td class="w3-gray-text">Patreon User ID</td>
                  <td class="font-family-monospace">{{ memberDetails.patreonUserId }}</td>
                </tr>
                <tr>
                  <td class="w3-gray-text">Member ID</td>
                  <td class="font-family-monospace">{{ memberDetails.patreonMemberId }}</td>
                </tr>
                <tr v-if="memberDetails.email">
                  <td class="w3-gray-text">Email</td>
                  <td>{{ memberDetails.email }}</td>
                </tr>
                <tr v-if="memberDetails.pledgeRelationshipStart">
                  <td class="w3-gray-text">Member Since</td>
                  <td>{{ formatDate(memberDetails.pledgeRelationshipStart) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <!-- Tier Information -->
          <div v-if="memberDetails.found && memberDetails.entitledTierIds" class="mt-4">
            <v-divider class="mb-4" />
            <div class="text-subtitle-1 w3-gray-text font-weight-bold mb-3">Tier Information</div>

            <v-row>
              <v-col cols="12" md="6">
                <v-card border class="pa-3">
                  <div class="text-caption w3-gray-text mb-2">Patreon Entitled Tiers</div>
                  <v-chip
                    v-for="tier in memberDetails.entitledTierIds"
                    :key="tier"
                    size="small"
                    color="orange"
                    class="mr-1 mb-1"
                  >
                    {{ tier }}
                  </v-chip>
                  <div v-if="!memberDetails.entitledTierIds.length" class="text-caption">No tiers</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card border class="pa-3">
                  <div class="text-caption w3-gray-text mb-2">Internal Associations</div>
                  <div class="text-body-2">
                    <strong>{{ memberDetails.activeAssociationCount }}</strong> active association(s)
                  </div>
                  <v-chip
                    v-for="tier in memberDetails.activeAssociationTiers"
                    :key="tier"
                    size="small"
                    color="primary"
                    class="mr-1 mb-1 mt-2"
                  >
                    {{ tier }}
                  </v-chip>
                  <div v-if="!memberDetails.activeAssociationTiers || !memberDetails.activeAssociationTiers.length" class="text-caption mt-2">No associations</div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-text v-else class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
          <div class="mt-3">Loading member details...</div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="memberDetailsDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success/Error Snackbar -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="5000"
    >
      {{ snackbarMessage }}
      <template v-slot:actions="{ isActive }">
        <v-btn variant="text" v-bind="isActive" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { useOauthStore } from "@/store/oauth/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import AdminService from "@/services/admin/AdminService";
import { PatreonAccountLink } from "@/store/admin/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import {
  mdiMagnify, mdiRefresh, mdiDelete, mdiAccountHeart, mdiAccount,
  mdiPatreon, mdiFilterRemove, mdiClose, mdiCheckCircle,
  mdiAlert, mdiAlertCircle, mdiInformation, mdiAccountSearch, mdiAccountDetails
} from "@mdi/js";
import { formatTimestampString } from "@/helpers/date-functions";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminPatreonLinks",
  components: {
    PlayerSearch,
  },
  setup() {
    const oauthStore = useOauthStore();
    const playerSearchStore = usePlayerSearchStore();

    // Data
    const patreonLinks = ref<PatreonAccountLink[]>([]);
    const filteredLinks = ref<PatreonAccountLink[]>([]);
    const loading = ref(false);
    const selectedPlayer = ref<string>("");
    const playerSearchComponent = ref<InstanceType<typeof PlayerSearch> | null>(null);

    // Delete functionality
    const deleteDialog = ref(false);
    const selectedLink = ref<PatreonAccountLink | null>(null);
    const deleting = ref(false);
    const deletingLinks = ref<string[]>([]);

    // Member details functionality
    const memberDetailsDialog = ref(false);

    // eslint-disable-next-line
    const memberDetails = ref<any>(null);

    const loadingMemberDetails = ref(false);
    const selectedMemberBattleTag = ref<string>("");

    // Snackbar
    const snackbar = ref(false);
    const snackbarMessage = ref("");
    const snackbarColor = ref("success");

    // Table headers
    const headers: DataTableHeader[] = [
      { title: "BattleTag", value: "battleTag", width: "25%", sortable: true },
      { title: "Patreon User ID", value: "patreonUserId", width: "30%", sortable: true },
      { title: "Linked At", value: "linkedAt", width: "20%", sortable: true },
      { title: "Last Sync", value: "lastSyncAt", width: "20%", sortable: true },
      { title: "Actions", value: "actions", width: "5%", sortable: false }
    ];

    // Methods
    const loadPatreonLinks = async () => {
      loading.value = true;
      try {
        const response = await AdminService.getAllPatreonLinks(oauthStore.token);
        patreonLinks.value = response.links;
        filterLinks();

        showSnackbar(`Loaded ${response.totalLinks} Patreon links`, "success");
      } catch (error) {
        console.error("Error loading Patreon links:", error);
        showSnackbar("Failed to load Patreon links", "error");
      } finally {
        loading.value = false;
      }
    };

    const filterLinks = (): void => {
      if (!selectedPlayer.value) {
        filteredLinks.value = [...patreonLinks.value];
      } else {
        filteredLinks.value = patreonLinks.value.filter((link) =>
          link.battleTag.toLowerCase().includes(selectedPlayer.value.toLowerCase())
        );
      }
    };

    const confirmDelete = (link: PatreonAccountLink): void => {
      selectedLink.value = link;
      deleteDialog.value = true;
    };

    const deletePatreonLink = async (): Promise<void> => {
      if (!selectedLink.value) return;

      const battleTag = selectedLink.value.battleTag;
      deleting.value = true;
      deletingLinks.value.push(battleTag);

      try {
        const success = await AdminService.deletePatreonLink(battleTag, oauthStore.token);

        if (success) {
          // Remove from local data
          patreonLinks.value = patreonLinks.value.filter((link) => link.battleTag !== battleTag);
          filterLinks();

          showSnackbar(`Successfully deleted Patreon link for ${battleTag}`, "success");
        } else {
          showSnackbar("Failed to delete Patreon link", "error");
        }
      } catch (error) {
        console.error("Error deleting Patreon link:", error);
        showSnackbar("Failed to delete Patreon link", "error");
      } finally {
        deleting.value = false;
        deletingLinks.value = deletingLinks.value.filter((bt) => bt !== battleTag);
        deleteDialog.value = false;
        selectedLink.value = null;
      }
    };

    const viewMemberDetails = async (link: PatreonAccountLink): Promise<void> => {
      const battleTag = link.battleTag;
      selectedMemberBattleTag.value = battleTag;
      loadingMemberDetails.value = true;
      memberDetails.value = null;
      memberDetailsDialog.value = true;

      try {
        const details = await AdminService.getPatreonMemberDetails(battleTag, oauthStore.token);
        memberDetails.value = details;
      } catch (error) {
        console.error("Error fetching member details:", error);
        memberDetails.value = {
          found: false,
          battleTag: battleTag,
          error: `Failed to fetch member details: ${error}`
        };
        showSnackbar(`Failed to fetch member details: ${error}`, "error");
      } finally {
        loadingMemberDetails.value = false;
      }
    };

    const showSnackbar = (message: string, color: string): void => {
      snackbarMessage.value = message;
      snackbarColor.value = color;
      snackbar.value = true;
    };

    const formatDate = (dateString: string | null): string => {
      if (!dateString) return "—";
      return formatTimestampString(dateString, "yyyy-MM-dd");
    };

    const formatTime = (dateString: string | null): string => {
      if (!dateString) return "—";
      return formatTimestampString(dateString, "HH:mm:ss");
    };

    // New utility functions that we added in template but didn't implement
    const clearFilters = () => {
      selectedPlayer.value = "";
      playerSearchStore.clearPlayerSearch();
      filterLinks();
      showSnackbar("Filters cleared", "info");
    };

    const onPlayerFound = (battleTag: string) => {
      selectedPlayer.value = battleTag;
      filterLinks();
    };

    const onPlayerSearchCleared = () => {
      selectedPlayer.value = "";
      filterLinks();
    };

    const clearPlayerSelection = () => {
      selectedPlayer.value = "";
      playerSearchStore.clearPlayerSearch();
      filterLinks();
    };

    // Statistics functions
    const getTotalLinks = (): number => {
      return patreonLinks.value.length;
    };

    const getRecentLinks = (): number => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return patreonLinks.value.filter((link) =>
        new Date(link.linkedAt) >= thirtyDaysAgo
      ).length;
    };

    const getStaleLinks = (): number => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return patreonLinks.value.filter((link) => {
        if (!link.lastSyncAt) return true;
        return new Date(link.lastSyncAt) < sevenDaysAgo;
      }).length;
    };

    const isStaleSync = (lastSyncAt: string): boolean => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(lastSyncAt) < sevenDaysAgo;
    };

    const getSyncStatusClass = (lastSyncAt: string): string => {
      if (isStaleSync(lastSyncAt)) {
        return "text-warning";
      }
      return "text-primary";
    };

    // Lifecycle
    onMounted(() => {
      loadPatreonLinks();
    });

    return {
      // Data
      patreonLinks,
      filteredLinks,
      loading,
      selectedPlayer,
      playerSearchComponent,
      deleteDialog,
      selectedLink,
      deleting,
      deletingLinks,
      memberDetailsDialog,
      memberDetails,
      loadingMemberDetails,
      selectedMemberBattleTag,
      snackbar,
      snackbarMessage,
      snackbarColor,
      headers,

      // Methods
      loadPatreonLinks,
      filterLinks,
      clearFilters,
      onPlayerFound,
      onPlayerSearchCleared,
      clearPlayerSelection,
      getTotalLinks,
      getRecentLinks,
      getStaleLinks,
      isStaleSync,
      getSyncStatusClass,
      confirmDelete,
      deletePatreonLink,
      viewMemberDetails,
      formatDate,
      formatTime,

      // Icons
      mdiMagnify,
      mdiRefresh,
      mdiDelete,
      mdiAccountHeart,
      mdiAccount,
      mdiPatreon,
      mdiFilterRemove,
      mdiClose,
      mdiCheckCircle,
      mdiAlert,
      mdiAlertCircle,
      mdiInformation,
      mdiAccountSearch,
      mdiAccountDetails,
    };
  },
});
</script>

<style lang="scss" scoped>
.v-data-table {
  margin-top: 16px;
}

.text-caption {
  font-size: 0.75rem;
}
</style>
