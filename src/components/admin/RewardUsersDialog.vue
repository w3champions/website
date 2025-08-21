<template>
  <v-dialog :value="visible" @input="$emit('update:visible', $event)" max-width="800px">
    <v-card>
      <v-card-title>
        <span class="text-h5">{{ title }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="close">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-2">Loading users...</div>
        </div>
        
        <div v-else-if="error" class="error--text text-center pa-4">
          <v-icon color="error" class="mb-2">{{ mdiAlert }}</v-icon>
          <div>{{ error }}</div>
          <v-btn @click="$emit('retry')" color="primary" class="mt-2">Retry</v-btn>
        </div>

        <div v-else-if="users && users.length > 0">
          <v-row class="mb-4">
            <v-col cols="4">
              <v-card outlined>
                <v-card-text class="text-center">
                  <div class="text-h4 primary--text">{{ users.length }}</div>
                  <div class="text-subtitle1">Total Users</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="4">
              <v-card outlined>
                <v-card-text class="text-center">
                  <div class="text-h4 success--text">{{ activeUsersCount }}</div>
                  <div class="text-subtitle1">Active</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="4">
              <v-card outlined>
                <v-card-text class="text-center">
                  <div class="text-h4 error--text">{{ expiredUsersCount }}</div>
                  <div class="text-subtitle1">Expired/Revoked</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-data-table
            :headers="headers"
            :items="users"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:item.userId="{ item }">
              <div class="font-weight-medium">{{ item.userId }}</div>
            </template>

            <template v-slot:item.providerId="{ item }">
              <v-chip
                small
                :color="getProviderColor(item.providerId)"
              >
                <v-icon small left>{{ getProviderIcon(item.providerId) }}</v-icon>
                {{ item.providerId }}
              </v-chip>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip
                small
                :color="getStatusColor(item.status)"
              >
                {{ getStatusName(item.status) }}
              </v-chip>
            </template>

            <template v-slot:item.assignedAt="{ item }">
              <div>{{ formatDate(item.assignedAt) }}</div>
            </template>

            <template v-slot:item.expiresAt="{ item }">
              <div v-if="item.expiresAt">{{ formatDate(item.expiresAt) }}</div>
              <div v-else class="text--secondary">Permanent</div>
            </template>
          </v-data-table>
        </div>

        <div v-else class="text-center pa-4 text--secondary">
          <v-icon color="grey" size="64" class="mb-2">{{ mdiAccountOff }}</v-icon>
          <div>No users found</div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { RewardAssignment, RewardStatus } from '@/store/admin/types';
import { mdiClose, mdiAlert, mdiAccountOff, mdiPatreon, mdiHandHeart, mdiCog } from '@mdi/js';

export default defineComponent({
  name: 'RewardUsersDialog',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    users: {
      type: Array as () => RewardAssignment[],
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: null,
    },
  },
  emits: ['update:visible', 'retry'],
  setup(props, { emit }) {
    const headers = [
      { text: 'User', value: 'userId', sortable: true },
      { text: 'Status', value: 'status', sortable: true },
      { text: 'Provider', value: 'providerId', sortable: true },
      { text: 'Assigned', value: 'assignedAt', sortable: true },
      { text: 'Expires', value: 'expiresAt', sortable: true },
    ];

    const activeUsersCount = computed(() => {
      return props.users.filter(user => user.status === RewardStatus.Active).length;
    });

    const expiredUsersCount = computed(() => {
      return props.users.filter(user => user.status === RewardStatus.Expired || user.status === RewardStatus.Revoked).length;
    });

    const close = () => {
      emit('update:visible', false);
    };

    const getProviderIcon = (providerId: string): string => {
      switch (providerId.toLowerCase()) {
        case 'patreon': return mdiPatreon;
        case 'kofi': return mdiHandHeart;
        default: return mdiCog;
      }
    };

    const getProviderColor = (providerId: string): string => {
      switch (providerId.toLowerCase()) {
        case 'patreon': return 'orange';
        case 'kofi': return 'blue';
        default: return 'grey';
      }
    };

    const getStatusColor = (status: RewardStatus | string): string => {
      const statusValue = typeof status === 'number' ? RewardStatus[status] : status;
      switch (statusValue?.toLowerCase()) {
        case 'active': return 'success';
        case 'expired': return 'warning';
        case 'revoked': return 'error';
        default: return 'grey';
      }
    };

    const getStatusName = (status: RewardStatus | string): string => {
      if (typeof status === 'number') {
        return RewardStatus[status] || 'Unknown';
      }
      return status || 'Unknown';
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString();
    };

    return {
      headers,
      activeUsersCount,
      expiredUsersCount,
      close,
      getProviderIcon,
      getProviderColor,
      getStatusColor,
      getStatusName,
      formatDate,
      mdiClose,
      mdiAlert,
      mdiAccountOff,
    };
  },
});
</script>