<template>
  <div>
    <v-card-title class="text-h4 mb-4">
      <v-icon left class="mr-3">{{ mdiAccountHeart }}</v-icon>
      Patreon Account Links
    </v-card-title>

    <!-- Statistics Summary Cards -->
    <v-row class="mb-6" v-if="patreonLinks.length > 0">
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="text-center pa-4">
          <div class="text-h4 primary--text mb-1">{{ getTotalLinks() }}</div>
          <div class="text-subtitle2 text--secondary">Total Links</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="text-center pa-4">
          <div class="text-h4 success--text mb-1">{{ getRecentLinks() }}</div>
          <div class="text-subtitle2 text--secondary">Recent (30 days)</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card outlined class="text-center pa-4">
          <div class="text-h4 warning--text mb-1">{{ getStaleLinks() }}</div>
          <div class="text-subtitle2 text--secondary">Not Synced (7+ days)</div>
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
                <v-icon small color="white">{{ mdiAccount }}</v-icon>
              </v-avatar>
              <span class="font-weight-medium">{{ selectedPlayer }}</span>
              <v-btn icon x-small class="ml-2" @click="clearPlayerSelection">
                <v-icon x-small>{{ mdiClose }}</v-icon>
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              outlined
              @click="clearFilters"
            >
              <v-icon left>{{ mdiFilterRemove }}</v-icon>
              Clear Filters
            </v-btn>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              @click="loadPatreonLinks"
              :loading="loading"
            >
              <v-icon left>{{ mdiRefresh }}</v-icon>
              Refresh
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Enhanced Data Table -->
    <v-card class="elevation-2">
      <v-card-text v-if="loading && patreonLinks.length === 0" class="text-center py-8">
        <v-skeleton-loader type="table"></v-skeleton-loader>
        <div class="mt-4 text-subtitle1">Loading Patreon links...</div>
      </v-card-text>

      <v-data-table
        v-else
        :headers="headers"
        :items="filteredLinks"
        :items-per-page="25"
        :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
        sort-by="linkedAt"
        :sort-desc="true"
        :loading="loading && patreonLinks.length > 0"
        class="modern-table"
      >
        <template v-slot:item.battleTag="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-3" color="primary">
              <v-icon small color="white">{{ mdiAccount }}</v-icon>
            </v-avatar>
            <div class="font-weight-medium">{{ item.battleTag }}</div>
          </div>
        </template>

        <template v-slot:item.patreonUserId="{ item }">
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="orange" small>{{ mdiPatreon }}</v-icon>
            <div class="text-caption font-family-monospace">{{ item.patreonUserId }}</div>
          </div>
        </template>

        <template v-slot:item.linkedAt="{ item }">
          <div>
            <div class="font-weight-medium">{{ formatDate(item.linkedAt) }}</div>
            <div class="text-caption text--secondary">{{ formatTime(item.linkedAt) }}</div>
          </div>
        </template>

        <template v-slot:item.lastSyncAt="{ item }">
          <div>
            <div class="font-weight-medium" :class="getSyncStatusClass(item.lastSyncAt)">{{ formatDate(item.lastSyncAt) }}</div>
            <div class="text-caption text--secondary">{{ formatTime(item.lastSyncAt) }}</div>
            <v-chip v-if="isStaleSync(item.lastSyncAt)" x-small color="orange" class="mt-1">
              Stale Sync
            </v-chip>
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn
              icon
              small
              color="error"
              @click="confirmDelete(item)"
              :disabled="deletingLinks.includes(item.battleTag)"
              :loading="deletingLinks.includes(item.battleTag)"
            >
              <v-icon small>{{ mdiDelete }}</v-icon>
            </v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey lighten-2" class="mb-4">{{ mdiAccountSearch }}</v-icon>
            <div class="text-h6 text--secondary mb-2">No Patreon links found</div>
            <div class="text-body-2 text--secondary mb-4">
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
          <br><br>
          <v-alert type="warning" dense>
            This will revoke all active Patreon rewards for this user and cannot be undone.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false">
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

    <!-- Success/Error Snackbar -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      timeout="5000"
    >
      {{ snackbarMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">
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
  mdiAlert, mdiAlertCircle, mdiInformation, mdiAccountSearch
} from "@mdi/js";
import { formatTimestampString } from "@/helpers/date-functions";

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

    // Snackbar
    const snackbar = ref(false);
    const snackbarMessage = ref("");
    const snackbarColor = ref("success");

    // Table headers
    const headers = [
      { text: "BattleTag", value: "battleTag", width: "25%" },
      { text: "Patreon User ID", value: "patreonUserId", width: "30%" },
      { text: "Linked At", value: "linkedAt", width: "20%" },
      { text: "Last Sync", value: "lastSyncAt", width: "20%" },
      { text: "Actions", value: "actions", sortable: false, width: "5%" }
    ];

    // Methods
    const loadPatreonLinks = async () => {
      loading.value = true;
      try {
        const links = await AdminService.getAllPatreonLinks(oauthStore.token);
        patreonLinks.value = links.links;
        filterLinks();

        showSnackbar(`Loaded ${links.length} Patreon links`, "success");
      } catch (error) {
        console.error("Error loading Patreon links:", error);
        showSnackbar("Failed to load Patreon links", "error");
      } finally {
        loading.value = false;
      }
    };

    const filterLinks = () => {
      if (!selectedPlayer.value) {
        filteredLinks.value = [...patreonLinks.value];
      } else {
        filteredLinks.value = patreonLinks.value.filter((link) =>
          link.battleTag.toLowerCase().includes(selectedPlayer.value.toLowerCase())
        );
      }
    };

    const confirmDelete = (link: PatreonAccountLink) => {
      selectedLink.value = link;
      deleteDialog.value = true;
    };

    const deletePatreonLink = async () => {
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

    const showSnackbar = (message: string, color: string) => {
      snackbarMessage.value = message;
      snackbarColor.value = color;
      snackbar.value = true;
    };

    const formatDate = (dateString: string | null) => {
      if (!dateString) return "—";
      return formatTimestampString(dateString, "yyyy-MM-dd");
    };

    const formatTime = (dateString: string | null) => {
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
      return patreonLinks.value.filter((link) =>
        new Date(link.lastSyncAt) < sevenDaysAgo
      ).length;
    };

    const isStaleSync = (lastSyncAt: string): boolean => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(lastSyncAt) < sevenDaysAgo;
    };

    const getSyncStatusClass = (lastSyncAt: string): string => {
      if (isStaleSync(lastSyncAt)) {
        return "warning--text";
      }
      return "text--primary";
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
    };
  },
});
</script>

<style scoped>
.v-data-table {
  margin-top: 16px;
}

.text-caption {
  font-size: 0.75rem;
}
</style>