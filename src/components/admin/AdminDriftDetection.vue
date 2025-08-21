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

      <v-col cols="12" md="6" v-if="lastResult && lastResult.hasDrift">
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
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import { useOauthStore } from '@/store/oauth/store';
import AdminService from '@/services/admin/AdminService';
import { DriftDetectionResult } from '@/store/admin/types';
import { 
  mdiPatreon, mdiAlert, mdiCheckCircle, mdiRefresh, 
  mdiAccountMinus, mdiAccountPlus, mdiAccountAlert 
} from '@mdi/js';

export default defineComponent({
  name: 'AdminDriftDetection',
  setup() {
    const oauthStore = useOauthStore();
    const lastResult = ref<DriftDetectionResult | null>(null);
    const detecting = ref(false);
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

    onMounted(() => {
      loadStatus();
    });

    return {
      lastResult,
      detecting,
      snackbar,
      snackbarText,
      snackbarColor,
      missingMembersHeaders,
      extraAssignmentsHeaders,
      mismatchedTiersHeaders,
      runDriftDetection,
      formatDateTime,
      mdiPatreon,
      mdiAlert,
      mdiCheckCircle,
      mdiRefresh,
      mdiAccountMinus,
      mdiAccountPlus,
      mdiAccountAlert,
    };
  },
});
</script>