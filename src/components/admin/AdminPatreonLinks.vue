<template>
  <div>
    <v-card-title>
      Patreon Account Links
    </v-card-title>

    <v-card flat>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchBattleTag"
              label="Search by BattleTag"
              :prepend-icon="mdiMagnify"
              clearable
              @update:model-value="filterLinks"
            ></v-text-field>
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

    <v-data-table
      :headers="headers"
      :items="filteredLinks"
      :items-per-page="25"
      :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
      sort-by="linkedAt"
      :sort-desc="true"
      :loading="loading"
      class="elevation-1"
    >
      <template v-slot:item.battleTag="{ item }">
        <div class="font-weight-medium">{{ item.battleTag }}</div>
      </template>

      <template v-slot:item.patreonUserId="{ item }">
        <div class="text-caption">{{ item.patreonUserId }}</div>
      </template>

      <template v-slot:item.linkedAt="{ item }">
        <div>
          <div>{{ formatDate(item.linkedAt) }}</div>
          <div class="text-caption text--secondary">{{ formatTime(item.linkedAt) }}</div>
        </div>
      </template>

      <template v-slot:item.lastSyncAt="{ item }">
        <div>
          <div>{{ formatDate(item.lastSyncAt) }}</div>
          <div class="text-caption text--secondary">{{ formatTime(item.lastSyncAt) }}</div>
        </div>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          icon
          small
          color="error"
          @click="confirmDelete(item)"
          :disabled="deletingLinks.includes(item.battleTag)"
        >
          <v-icon small>{{ mdiDelete }}</v-icon>
        </v-btn>
      </template>
    </v-data-table>

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
import { computed, defineComponent, onMounted, ref } from "vue";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/admin/AdminService";
import { PatreonAccountLink } from "@/store/admin/types";
import { mdiMagnify, mdiRefresh, mdiDelete } from "@mdi/js";
import { formatTimestampString } from "@/helpers/date-functions";

export default defineComponent({
  name: "AdminPatreonLinks",
  setup() {
    const oauthStore = useOauthStore();
    
    // Data
    const patreonLinks = ref<PatreonAccountLink[]>([]);
    const filteredLinks = ref<PatreonAccountLink[]>([]);
    const loading = ref(false);
    const searchBattleTag = ref("");
    
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
        patreonLinks.value = links;
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
      if (!searchBattleTag.value) {
        filteredLinks.value = [...patreonLinks.value];
      } else {
        filteredLinks.value = patreonLinks.value.filter(link =>
          link.battleTag.toLowerCase().includes(searchBattleTag.value.toLowerCase())
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
          patreonLinks.value = patreonLinks.value.filter(link => link.battleTag !== battleTag);
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
        deletingLinks.value = deletingLinks.value.filter(bt => bt !== battleTag);
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

    // Lifecycle
    onMounted(() => {
      loadPatreonLinks();
    });

    return {
      // Data
      filteredLinks,
      loading,
      searchBattleTag,
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
      confirmDelete,
      deletePatreonLink,
      formatDate,
      formatTime,
      
      // Icons
      mdiMagnify,
      mdiRefresh,
      mdiDelete,
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