J<template>
  <div>
    <v-card-title>
      Drift Detection Dashboard
    </v-card-title>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-h6">
            <v-icon left>{{ mdiPatreon }}</v-icon>
            Patreon Drift Detection
          </v-card-title>
          <v-card-text>
            <div v-if="!lastResult">
              <p class="text--secondary">No drift detection has been run yet.</p>
            </div>
            <div v-else>
              <v-row>
                <v-col cols="6">
                  <v-card outlined>
                    <v-card-text class="text-center">
                      <div class="text-h4 success--text">{{ lastResult.summary.totalPatreonMembers }}</div>
                      <div class="text-caption">Total Patreon Members</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card outlined>
                    <v-card-text class="text-center">
                      <div class="text-h4 info--text">{{ lastResult.summary.activePatreonMembers }}</div>
                      <div class="text-caption">Active Members</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="6">
                  <v-card outlined>
                    <v-card-text class="text-center">
                      <div class="text-h4 warning--text">{{ lastResult.summary.totalInternalAssignments }}</div>
                      <div class="text-caption">Internal Assignments</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card outlined>
                    <v-card-text class="text-center">
                      <div class="text-h4 primary--text">{{ lastResult.summary.uniqueInternalUsers }}</div>
                      <div class="text-caption">Unique Users</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-alert
                :type="lastResult.hasDrift ? 'warning' : 'success'"
                :icon="lastResult.hasDrift ? mdiAlert : mdiCheckCircle"
                class="mt-4"
              >
                <div class="font-weight-bold">
                  {{ lastResult.hasDrift ? 'Drift Detected!' : 'No Drift Detected' }}
                </div>
                <div class="text-caption">
                  Last checked: {{ formatDateTime(lastResult.timestamp) }}
                </div>
              </v-alert>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="detecting"
              @click="runDriftDetection"
            >
              <v-icon left>{{ mdiRefresh }}</v-icon>
              Run Detection
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-h6">
            <v-icon left>{{ mdiCog }}</v-icon>
            Product Mapping Reconciliation
          </v-card-title>
          <v-card-text>
            <div v-if="!reconciliationResult">
              <p class="text--secondary">No reconciliation has been run yet.</p>
            </div>
            <div v-else>
              <v-row>
                <v-col cols="6">
                  <v-card outlined>
                    <v-card-text class="text-center">
                      <div class="text-h4" :class="reconciliationResult.totalUsersAffected > 0 ? 'warning--text' : 'success--text'">
                        {{ reconciliationResult.totalUsersAffected }}
                      </div>
                      <div class="text-caption">Users Affected</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card outlined>
                    <v-card-text class="text-center">
                      <div class="text-h4 info--text">{{ reconciliationResult.rewardsAdded + reconciliationResult.rewardsRevoked }}</div>
                      <div class="text-caption">Total Changes</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-alert
                :type="reconciliationResult.totalUsersAffected > 0 ? 'warning' : 'success'"
                :icon="reconciliationResult.totalUsersAffected > 0 ? mdiAlert : mdiCheckCircle"
                class="mt-4"
              >
                <div class="font-weight-bold">
                  {{ reconciliationResult.totalUsersAffected > 0 ? 'Reconciliation Needed!' : 'Everything In Sync' }}
                </div>
                <div class="text-caption">
                  {{ reconciliationResult.wasDryRun ? 'Preview Mode' : 'Last executed' }}
                </div>
                <div v-if="reconciliationResult.totalUsersAffected > 0" class="mt-2">
                  <div class="text-caption">
                    <strong>Actions:</strong>
                    <span v-if="reconciliationResult.rewardsAdded > 0">{{ reconciliationResult.rewardsAdded }} rewards to add</span>
                    <span v-if="reconciliationResult.rewardsAdded > 0 && reconciliationResult.rewardsRevoked > 0">, </span>
                    <span v-if="reconciliationResult.rewardsRevoked > 0">{{ reconciliationResult.rewardsRevoked }} rewards to remove</span>
                  </div>
                  <v-btn
                    small
                    text
                    color="primary"
                    class="mt-2"
                    @click="showReconciliationDetails = true"
                  >
                    <v-icon left small>{{ mdiInformationOutline }}</v-icon>
                    View Details
                  </v-btn>
                </div>
              </v-alert>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="info"
              :loading="reconciling"
              @click="runReconciliationPreview"
            >
              <v-icon left>{{ mdiMagnify }}</v-icon>
              Preview
            </v-btn>
            <v-btn
              color="primary"
              :loading="reconciling"
              :disabled="!reconciliationResult || reconciliationResult.totalUsersAffected === 0"
              @click="runReconciliation"
            >
              <v-icon left>{{ mdiSync }}</v-icon>
              Execute
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Drift Summary Row -->
    <v-row v-if="lastResult && lastResult.hasDrift">
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h6">
            <v-icon left color="warning">{{ mdiAlert }}</v-icon>
            Drift Summary
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="4">
                <v-card outlined color="error">
                  <v-card-text class="text-center">
                    <div class="text-h4 error--text">{{ lastResult.summary.missingMembers }}</div>
                    <div class="text-caption">Missing Members</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="4">
                <v-card outlined color="warning">
                  <v-card-text class="text-center">
                    <div class="text-h4 warning--text">{{ lastResult.summary.extraAssignments }}</div>
                    <div class="text-caption">Extra Assignments</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="4">
                <v-card outlined color="orange">
                  <v-card-text class="text-center">
                    <div class="text-h4 orange--text">{{ lastResult.summary.mismatchedTiers }}</div>
                    <div class="text-caption">Mismatched Tiers</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-alert
              type="info"
              class="mt-4"
              dense
            >
              <strong>Note:</strong> Drift detection compares Patreon member data with internal reward assignments.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Drift Details -->
    <v-row v-if="lastResult && lastResult.hasDrift">
      <v-col cols="12">
        <v-expansion-panels multiple>
          <v-expansion-panel v-if="lastResult.details.missingMembers.length > 0">
            <v-expansion-panel-header>
              <div>
                <v-icon class="mr-2" color="error">{{ mdiAccountMinus }}</v-icon>
                Missing Members ({{ lastResult.details.missingMembers.length }})
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                :headers="missingMembersHeaders"
                :items="lastResult.details.missingMembers"
                :items-per-page="10"
                class="elevation-0"
              >
                <template v-slot:item.entitledTierIds="{ item }">
                  <v-chip
                    v-for="tierId in item.entitledTierIds"
                    :key="tierId"
                    small
                    class="mr-1"
                  >
                    {{ tierId }}
                  </v-chip>
                </template>
              </v-data-table>
            </v-expansion-panel-content>
          </v-expansion-panel>

          <v-expansion-panel v-if="lastResult.details.extraAssignments.length > 0">
            <v-expansion-panel-header>
              <div>
                <v-icon class="mr-2" color="warning">{{ mdiAccountPlus }}</v-icon>
                Extra Assignments ({{ lastResult.details.extraAssignments.length }})
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                :headers="extraAssignmentsHeaders"
                :items="lastResult.details.extraAssignments"
                :items-per-page="10"
                class="elevation-0"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>

          <v-expansion-panel v-if="lastResult.details.mismatchedTiers.length > 0">
            <v-expansion-panel-header>
              <div>
                <v-icon class="mr-2" color="orange">{{ mdiAccountAlert }}</v-icon>
                Mismatched Tiers ({{ lastResult.details.mismatchedTiers.length }})
              </div>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-data-table
                :headers="mismatchedTiersHeaders"
                :items="lastResult.details.mismatchedTiers"
                :items-per-page="10"
                class="elevation-0"
              />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarText }}
    </v-snackbar>

    <!-- Reconciliation Details Dialog -->
    <v-dialog v-model="showReconciliationDetails" max-width="800px">
      <v-card>
        <v-card-title>
          <v-icon left>{{ mdiCog }}</v-icon>
          Reconciliation Details
          <v-spacer></v-spacer>
          <v-btn icon @click="showReconciliationDetails = false">
            <v-icon>{{ mdiClose }}</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div v-if="reconciliationResult && reconciliationResult.totalUsersAffected > 0">
            <v-alert
              type="info"
              class="mb-4"
              dense
            >
              This shows all the specific reward changes that would be made during reconciliation.
            </v-alert>
            
            <v-data-table
              :headers="reconciliationDetailsHeaders"
              :items="reconciliationDetailsItems"
              :items-per-page="10"
              class="elevation-0"
            >
              <template v-slot:item.action="{ item }">
                <v-chip
                  small
                  :color="item.action === 'Add' ? 'success' : 'warning'"
                  :text-color="item.action === 'Add' ? 'white' : 'black'"
                >
                  <v-icon left small>
                    {{ item.action === 'Add' ? mdiPlus : mdiMinus }}
                  </v-icon>
                  {{ item.action }}
                </v-chip>
              </template>
              <template v-slot:item.userId="{ item }">
                <code class="text-caption">{{ item.userId }}</code>
              </template>
              <template v-slot:item.rewardId="{ item }">
                <code class="text-caption">{{ item.rewardId }}</code>
              </template>
            </v-data-table>
          </div>
          <div v-else>
            <v-alert type="success" class="mb-4">
              No reconciliation actions needed. All product mappings are in sync.
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showReconciliationDetails = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useOauthStore } from '@/store/oauth/store';
import AdminService from '@/services/admin/AdminService';
import { DriftDetectionResult, ReconciliationResult } from '@/store/admin/types';
import { 
  mdiPatreon, mdiAlert, mdiCheckCircle, mdiRefresh, 
  mdiAccountMinus, mdiAccountPlus, mdiAccountAlert,
  mdiCog, mdiMagnify, mdiSync, mdiInformationOutline,
  mdiClose, mdiPlus, mdiMinus
} from '@mdi/js';

export default defineComponent({
  name: 'AdminDriftDetection',
  setup() {
    const oauthStore = useOauthStore();
    const lastResult = ref<DriftDetectionResult | null>(null);
    const detecting = ref(false);
    const reconciliationResult = ref<ReconciliationResult | null>(null);
    const reconciling = ref(false);
    const showReconciliationDetails = ref(false);
    const snackbar = ref(false);
    const snackbarText = ref('');
    const snackbarColor = ref('success');

    const token = computed(() => oauthStore.token);

    const missingMembersHeaders = [
      { text: 'Patreon Member ID', value: 'patreonMemberId', sortable: true },
      { text: 'Email', value: 'email', sortable: true },
      { text: 'Patron Status', value: 'patronStatus', sortable: true },
      { text: 'Entitled Tiers', value: 'entitledTierIds', sortable: false },
      { text: 'Reason', value: 'reason', sortable: false },
    ];

    const extraAssignmentsHeaders = [
      { text: 'User ID', value: 'userId', sortable: true },
      { text: 'Reward ID', value: 'rewardId', sortable: true },
      { text: 'Provider', value: 'providerId', sortable: true },
      { text: 'Status', value: 'status', sortable: true },
    ];

    const mismatchedTiersHeaders = [
      { text: 'User ID', value: 'userId', sortable: true },
      { text: 'Expected Tiers', value: 'expectedTiers', sortable: false },
      { text: 'Actual Tiers', value: 'actualTiers', sortable: false },
      { text: 'Issue', value: 'issue', sortable: false },
    ];

    const reconciliationDetailsHeaders = [
      { text: 'Action', value: 'action', sortable: true },
      { text: 'User ID', value: 'userId', sortable: true },
      { text: 'Reward ID', value: 'rewardId', sortable: true },
      { text: 'Product Mapping', value: 'productMapping', sortable: true },
    ];

    const reconciliationDetailsItems = computed(() => {
      if (!reconciliationResult.value?.userReconciliations) return [];
      
      const items: any[] = [];
      
      reconciliationResult.value.userReconciliations.forEach(userRecon => {
        userRecon.actions.forEach(action => {
          items.push({
            action: action.type,
            userId: userRecon.userId,
            rewardId: action.rewardId,
            productMapping: userRecon.productMappingName,
            success: action.success,
            error: action.errorMessage
          });
        });
      });
      
      return items;
    });

    const runDriftDetection = async () => {
      detecting.value = true;
      try {
        const result = await AdminService.detectPatreonDrift(token.value);
        lastResult.value = result;
        
        if (result.success) {
          if (result.hasDrift) {
            showSnackbar('Drift detection completed - Issues found!', 'warning');
          } else {
            showSnackbar('Drift detection completed - No issues found!', 'success');
          }
        } else {
          showSnackbar('Drift detection failed', 'error');
        }
      } catch (error) {
        showSnackbar('Failed to run drift detection', 'error');
        console.error('Error running drift detection:', error);
      } finally {
        detecting.value = false;
      }
    };

    const loadStatus = async () => {
      try {
        const status = await AdminService.getDriftDetectionStatus(token.value);
        // You could store and display the status if needed
        console.log('Drift detection status:', status);
      } catch (error) {
        console.error('Error loading drift detection status:', error);
      }
    };

    const formatDateTime = (dateString: string): string => {
      return new Date(dateString).toLocaleString();
    };

    const showSnackbar = (message: string, color = 'success') => {
      snackbarText.value = message;
      snackbarColor.value = color;
      snackbar.value = true;
    };

    const runReconciliationPreview = async () => {
      reconciling.value = true;
      try {
        const result = await AdminService.reconcileAllProductMappings(token.value, true);
        reconciliationResult.value = result;
        
        if (result.success) {
          showSnackbar(`Preview complete - ${result.totalUsersAffected} users would be affected`, 'info');
        } else {
          showSnackbar('Preview failed', 'error');
        }
      } catch (error) {
        showSnackbar('Failed to run reconciliation preview', 'error');
        console.error('Error running reconciliation preview:', error);
      } finally {
        reconciling.value = false;
      }
    };

    const runReconciliation = async () => {
      reconciling.value = true;
      try {
        const result = await AdminService.reconcileAllProductMappings(token.value, false);
        reconciliationResult.value = result;
        
        if (result.success) {
          showSnackbar(`Reconciliation complete - ${result.totalUsersAffected} users affected`, 'success');
        } else {
          showSnackbar('Reconciliation failed', 'error');
        }
      } catch (error) {
        showSnackbar('Failed to run reconciliation', 'error');
        console.error('Error running reconciliation:', error);
      } finally {
        reconciling.value = false;
      }
    };

    onMounted(() => {
      loadStatus();
    });

    return {
      lastResult,
      detecting,
      reconciliationResult,
      reconciling,
      showReconciliationDetails,
      snackbar,
      snackbarText,
      snackbarColor,
      missingMembersHeaders,
      extraAssignmentsHeaders,
      mismatchedTiersHeaders,
      reconciliationDetailsHeaders,
      reconciliationDetailsItems,
      runDriftDetection,
      runReconciliationPreview,
      runReconciliation,
      formatDateTime,
      mdiPatreon,
      mdiAlert,
      mdiCheckCircle,
      mdiRefresh,
      mdiAccountMinus,
      mdiAccountPlus,
      mdiAccountAlert,
      mdiCog,
      mdiMagnify,
      mdiSync,
      mdiInformationOutline,
      mdiClose,
      mdiPlus,
      mdiMinus,
    };
  },
});
</script>