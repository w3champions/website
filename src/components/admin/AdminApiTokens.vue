<template>
  <div>
    <v-container>
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          API Token Management
          <v-btn color="primary" @click="showCreateDialog = true">
            <v-icon start>{{ mdiPlus }}</v-icon>
            Create Token
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-data-table
            :headers="headers"
            :items="tokens"
            :loading="loading"
            class="elevation-1"
          >
            <template v-slot:item.isActive="{ item }">
              <v-chip
                :color="item.isActive ? 'success' : 'error'"
                size="small"
                variant="flat"
              >
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </template>

            <template v-slot:item.token="{ item }">
              <div style="display: flex; align-items: center;">
                <code style="font-size: 0.8em;">{{ item.token.substring(0, 8) }}...</code>
                <v-btn icon size="small" variant="plain" @click="copyTokenValue(item.token)">
                  <v-icon>{{ mdiContentCopy }}</v-icon>
                </v-btn>
              </div>
            </template>

            <template v-slot:item.scopes="{ item }">
              <v-chip
                v-for="scope in Object.keys(item.scopes || {})"
                :key="scope"
                size="small"
                class="mr-1"
                :color="item.scopes[scope].isEnabled ? 'primary' : 'grey'"
                variant="flat"
              >
                {{ scope }}
              </v-chip>
            </template>

            <template v-slot:item.expiresAt="{ item }">
              {{ item.expiresAt ? formatDate(item.expiresAt) : 'Never' }}
            </template>

            <template v-slot:item.lastUsedAt="{ item }">
              {{ item.lastUsedAt ? formatDate(item.lastUsedAt) : 'Never' }}
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn icon size="small" variant="plain" @click="showTokenDetails(item)">
                <v-icon>{{ mdiEye }}</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="plain" @click="editToken(item)">
                <v-icon>{{ mdiPencil }}</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="plain" @click="toggleTokenStatus(item)">
                <v-icon>{{ item.isActive ? mdiPause : mdiPlay }}</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="plain" @click="regenerateToken(item)">
                <v-icon>{{ mdiRefresh }}</v-icon>
              </v-btn>
              <v-btn icon size="small" variant="plain" @click="deleteToken(item)">
                <v-icon>{{ mdiDelete }}</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="800px">
      <v-card>
        <v-card-title>
          {{ editingToken ? 'Edit API Token' : 'Create API Token' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="tokenForm.name"
            label="Name"
            variant="underlined"
            required
          />

          <v-textarea
            v-model="tokenForm.description"
            label="Description"
            variant="underlined"
            rows="2"
          />

          <v-text-field
            v-model="tokenForm.contactDetails"
            label="Contact Details"
            variant="underlined"
          />

          <v-combobox
            v-model="tokenForm.allowedIPs"
            label="Allowed IPs (leave empty for all)"
            multiple
            chips
            clearable
            hint="Enter IP addresses and press enter"
            persistent-hint
            variant="underlined"
          />

          <v-menu
            v-model="dateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
          >
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="tokenForm.expiresAt"
                label="Expires At (optional)"
                readonly
                clearable
                v-bind="props"
                variant="underlined"
              />
            </template>
            <v-date-picker
              v-model="tokenForm.expiresAt"
              first-day-of-week="1"
              hide-header
              show-adjacent-months
              @input="dateMenu = false"
            />
          </v-menu>

          <v-divider class="my-4" />

          <div class="text-h6 mb-3">
            Scopes & Rate Limits
            <v-btn
              color="primary"
              size="small"
              variant="outlined"
              class="ml-4"
              @click="addScope"
            >
              <v-icon start>{{ mdiPlus }}</v-icon>
              Add Scope
            </v-btn>
          </div>

          <v-alert type="info" density="compact" class="mb-3">
            Define scopes to allow different rate limits for different resource categories (e.g., "replay", "stats", "profile")
          </v-alert>

          <v-card v-for="(scope, scopeName, index) in tokenForm.scopes" :key="`scope-${index}`" class="mb-2 pa-3" border>
            <v-row align="center">
              <v-col cols="3">
                <v-text-field
                  :model-value="scopeName"
                  label="Scope Name"
                  density="compact"
                  :disabled="editingToken !== null"
                  hint="e.g., replay, stats"
                  @blur="(e) => renameScope(scopeName, e.target.value)"
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model.number="scope.hourlyLimit"
                  label="Hourly Limit"
                  type="number"
                  density="compact"
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model.number="scope.dailyLimit"
                  label="Daily Limit"
                  type="number"
                  density="compact"
                />
              </v-col>
              <v-col cols="2">
                <v-switch
                  v-model="scope.isEnabled"
                  label="Enabled"
                  density="compact"
                />
              </v-col>
              <v-col cols="1">
                <v-btn icon @click="removeScope(scopeName)">
                  <v-icon>{{ mdiDelete }}</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-card>

          <div v-if="Object.keys(tokenForm.scopes).length === 0" class="text-center py-3 text-grey">
            No scopes defined. Click "Add Scope" to create one.
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn class="bg-primary" @click="saveToken">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Token Display Dialog -->
    <v-dialog v-model="showTokenDialog" max-width="600px">
      <v-card>
        <v-card-title>API Token Details</v-card-title>
        <v-card-text>
          <v-text-field
            :model-value="newTokenValue"
            label="API Token"
            readonly
            :append-icon="mdiContentCopy"
            @click:append="copyToken"
          />
          <p class="mt-2">Use this token in the X-API-Token header when making requests.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showTokenDialog = false">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete the token "{{ tokenToDelete?.name }}"?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Regenerate Confirmation Dialog -->
    <v-dialog v-model="showRegenerateDialog" max-width="500px">
      <v-card>
        <v-card-title>Confirm Token Regeneration</v-card-title>
        <v-card-text>
          <v-alert type="warning" density="compact" class="mb-3">
            Regenerating this token will invalidate the current token value.
          </v-alert>
          <p class="text-body-1 w3-gray-text">Are you sure you want to regenerate the token "{{ tokenToRegenerate?.name }}"?</p>
          <p class="text-body-1 w3-gray-text">Any applications using the current token will stop working until updated with the new token.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showRegenerateDialog = false">Cancel</v-btn>
          <v-btn color="warning" @click="confirmRegenerate">Regenerate</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import { mdiPlus, mdiPencil, mdiDelete, mdiRefresh, mdiPause, mdiPlay, mdiContentCopy, mdiEye } from "@mdi/js";
import ApiTokenService from "@/services/admin/ApiTokenService";
import { ApiToken, CreateApiTokenRequest, UpdateApiTokenRequest } from "@/types/admin/ApiToken";
import { useOauthStore } from "@/store/oauth/store";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminApiTokens",
  setup() {
    const oauthStore = useOauthStore();
    const token = computed(() => oauthStore.token);

    const loading = ref(false);
    const tokens = ref<ApiToken[]>([]);
    const showCreateDialog = ref(false);
    const showTokenDialog = ref(false);
    const showDeleteDialog = ref(false);
    const showRegenerateDialog = ref(false);
    const editingToken = ref<ApiToken | null>(null);
    const tokenToDelete = ref<ApiToken | null>(null);
    const tokenToRegenerate = ref<ApiToken | null>(null);
    const newTokenValue = ref("");
    const dateMenu = ref(false);
    const scopeCounter = ref(1);

    const tokenForm = ref<CreateApiTokenRequest>({
      name: "",
      description: "",
      scopes: {},
      contactDetails: "",
      allowedIPs: [],
      expiresAt: null,
    });

    const headers: DataTableHeader[] = [
      { title: "Name", value: "name" },
      { title: "Token", value: "token", sortable: false },
      { title: "Status", value: "isActive" },
      { title: "Scopes", value: "scopes", sortable: false },
      { title: "Contact", value: "contactDetails" },
      { title: "Expires", value: "expiresAt" },
      { title: "Last Used", value: "lastUsedAt" },
      { title: "Actions", value: "actions", sortable: false },
    ];

    async function loadTokens() {
      loading.value = true;
      try {
        tokens.value = await ApiTokenService.getAllTokens(token.value);
      } catch (error) {
        console.error("Failed to load tokens:", error);
      } finally {
        loading.value = false;
      }
    }

    function addScope() {
      const scopeName = `scope${scopeCounter.value++}`;
      tokenForm.value.scopes = {
        ...tokenForm.value.scopes,
        [scopeName]: {
          hourlyLimit: 100,
          dailyLimit: 1000,
          isEnabled: true,
        },
      };
    }

    function removeScope(scopeName: string) {
      const newScopes = { ...tokenForm.value.scopes };
      delete newScopes[scopeName];
      tokenForm.value.scopes = newScopes;
    }

    function renameScope(oldName: string, newName: string) {
      if (!newName || newName === oldName) return;
      if (tokenForm.value.scopes[newName]) {
        // Name already exists
        return;
      }

      const newScopes = { ...tokenForm.value.scopes };
      const scope = newScopes[oldName];
      delete newScopes[oldName];
      newScopes[newName] = scope;
      tokenForm.value.scopes = newScopes;
    }

    function editToken(apiToken: ApiToken) {
      editingToken.value = apiToken;
      tokenForm.value = {
        name: apiToken.name,
        description: apiToken.description,
        scopes: apiToken.scopes || {},
        contactDetails: apiToken.contactDetails,
        allowedIPs: apiToken.allowedIPs || [],
        expiresAt: apiToken.expiresAt,
      };
      showCreateDialog.value = true;
    }

    async function saveToken() {
      try {
        if (editingToken.value) {
          // Update existing token
          const updateRequest: UpdateApiTokenRequest = {
            ...tokenForm.value,
            isActive: editingToken.value.isActive,
          };
          await ApiTokenService.updateToken(editingToken.value.id, updateRequest, token.value);
        } else {
          // Create new token
          const newToken = await ApiTokenService.createToken(tokenForm.value, token.value);
          newTokenValue.value = newToken.token;
          showTokenDialog.value = true;
        }
        await loadTokens();
        closeDialog();
      } catch (error) {
        console.error("Failed to save token:", error);
      }
    }

    async function toggleTokenStatus(apiToken: ApiToken) {
      try {
        if (apiToken.isActive) {
          await ApiTokenService.deactivateToken(apiToken.id, token.value);
        } else {
          await ApiTokenService.activateToken(apiToken.id, token.value);
        }
        await loadTokens();
      } catch (error) {
        console.error("Failed to toggle token status:", error);
      }
    }

    function regenerateToken(apiToken: ApiToken) {
      tokenToRegenerate.value = apiToken;
      showRegenerateDialog.value = true;
    }

    async function confirmRegenerate() {
      if (tokenToRegenerate.value) {
        try {
          const regenerated = await ApiTokenService.regenerateToken(tokenToRegenerate.value.id, token.value);
          newTokenValue.value = regenerated.token;
          showTokenDialog.value = true;
          await loadTokens();
        } catch (error) {
          console.error("Failed to regenerate token:", error);
        }
      }
      showRegenerateDialog.value = false;
      tokenToRegenerate.value = null;
    }

    function deleteToken(apiToken: ApiToken) {
      tokenToDelete.value = apiToken;
      showDeleteDialog.value = true;
    }

    async function confirmDelete() {
      if (tokenToDelete.value) {
        try {
          await ApiTokenService.deleteToken(tokenToDelete.value.id, token.value);
          await loadTokens();
        } catch (error) {
          console.error("Failed to delete token:", error);
        }
      }
      showDeleteDialog.value = false;
      tokenToDelete.value = null;
    }

    function closeDialog() {
      showCreateDialog.value = false;
      editingToken.value = null;
      tokenForm.value = {
        name: "",
        description: "",
        scopes: {},
        contactDetails: "",
        allowedIPs: [],
        expiresAt: null,
      };
      scopeCounter.value = 1;
    }

    function copyToken() {
      navigator.clipboard.writeText(newTokenValue.value);
    }

    function copyTokenValue(token: string) {
      navigator.clipboard.writeText(token);
    }

    function showTokenDetails(apiToken: ApiToken) {
      newTokenValue.value = apiToken.token;
      showTokenDialog.value = true;
    }

    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleString();
    }

    onMounted(() => {
      loadTokens();
    });

    return {
      loading,
      tokens,
      headers,
      showCreateDialog,
      showTokenDialog,
      showDeleteDialog,
      showRegenerateDialog,
      editingToken,
      tokenToDelete,
      tokenToRegenerate,
      tokenForm,
      newTokenValue,
      dateMenu,
      addScope,
      removeScope,
      renameScope,
      editToken,
      saveToken,
      toggleTokenStatus,
      regenerateToken,
      confirmRegenerate,
      deleteToken,
      confirmDelete,
      closeDialog,
      copyToken,
      copyTokenValue,
      showTokenDetails,
      formatDate,
      mdiPlus,
      mdiPencil,
      mdiDelete,
      mdiRefresh,
      mdiPause,
      mdiPlay,
      mdiContentCopy,
      mdiEye,
    };
  },
});
</script>
