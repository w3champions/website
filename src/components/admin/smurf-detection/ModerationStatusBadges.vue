<template>
  <div v-if="hasModerationPermission" class="d-inline-flex align-center">
    <!-- Ban badge -->
    <v-tooltip v-if="moderationStatus?.ban" location="top">
      <template v-slot:activator="{ props }">
        <v-chip
          :size="compact ? 'x-small' : 'small'"
          :color="isBanExpired(moderationStatus.ban.endDate) ? 'grey' : 'error'"
          class="px-3"
          :class="{ 'mr-1': !compact || hasMultipleBadges }"
          v-bind="props"
          variant="flat"
        >
          <v-icon size="default" :start="!compact">{{ mdiCancel }}</v-icon>
          <span v-if="!compact" class="ml-1">
            Banned{{ isBanExpired(moderationStatus.ban.endDate) ? ' (Expired)' : '' }}
          </span>
        </v-chip>
      </template>
      <div>
        <div><strong>Reason:</strong> {{ moderationStatus.ban.banReason }}</div>
        <div><strong>Until:</strong> {{ moderationStatus.ban.endDate }}</div>
        <div><strong>By:</strong> {{ moderationStatus.ban.author }}</div>
        <div v-if="isBanExpired(moderationStatus.ban.endDate)" class="text-warning">
          <strong>Status:</strong> Expired
        </div>
      </div>
    </v-tooltip>

    <!-- Global mute badge -->
    <v-tooltip v-if="moderationStatus?.globalMute" location="top">
      <template v-slot:activator="{ props }">
        <v-chip
          :size="compact ? 'x-small' : 'small'"
          :color="isMuteExpired(moderationStatus.globalMute.expiresAt) ? 'grey' : 'warning'"
          class="px-3"
          :class="{ 'mr-1': !compact || hasMultipleBadges }"
          v-bind="props"
          variant="flat"
        >
          <v-icon size="default" :start="!compact">{{ mdiVolumeOff }}</v-icon>
          <span v-if="!compact" class="ml-1">
            Global Mute{{ isMuteExpired(moderationStatus.globalMute.expiresAt) ? ' (Expired)' : '' }}
          </span>
        </v-chip>
      </template>
      <div>
        <div><strong>Expires:</strong> {{ moderationStatus.globalMute.expiresAt || 'Never' }}</div>
        <div><strong>By:</strong> {{ moderationStatus.globalMute.author }}</div>
        <div v-if="isMuteExpired(moderationStatus.globalMute.expiresAt)" class="text-warning">
          <strong>Status:</strong> Expired
        </div>
      </div>
    </v-tooltip>

    <!-- Lounge mute badge -->
    <v-tooltip v-if="moderationStatus?.loungeMute" location="top">
      <template v-slot:activator="{ props }">
        <v-chip
          :size="compact ? 'x-small' : 'small'"
          :color="isMuteExpired(moderationStatus.loungeMute.endDate) ? 'grey' : 'orange'"
          class="px-3"
          v-bind="props"
          variant="flat"
        >
          <v-icon size="default" :start="!compact">{{ mdiMessageOff }}</v-icon>
          <span v-if="!compact" class="ml-1">
            Lounge{{ moderationStatus.loungeMute.isShadowBan ? ' Shadow' : '' }}{{ isMuteExpired(moderationStatus.loungeMute.endDate) ? ' (Expired)' : '' }}
          </span>
        </v-chip>
      </template>
      <div>
        <div><strong>Reason:</strong> {{ moderationStatus.loungeMute.reason }}</div>
        <div><strong>Until:</strong> {{ moderationStatus.loungeMute.endDate }}</div>
        <div><strong>By:</strong> {{ moderationStatus.loungeMute.author }}</div>
        <div v-if="isMuteExpired(moderationStatus.loungeMute.endDate)" class="text-warning">
          <strong>Status:</strong> Expired
        </div>
      </div>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useAdminStore } from "@/store/admin/store";
import { useOauthStore } from "@/store/oauth/store";
import { mdiCancel, mdiVolumeOff, mdiMessageOff } from "@mdi/js";
import { EPermission } from "@/store/admin/permission/types";

export default defineComponent({
  name: "ModerationStatusBadges",
  props: {
    battleTag: {
      type: String,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const adminStore = useAdminStore();
    const oauthStore = useOauthStore();

    const permissions = computed<string[]>(() => oauthStore.permissions);
    const hasModerationPermission = computed(() =>
      permissions.value.includes(EPermission[EPermission.Moderation])
    );

    const moderationStatus = computed(() => {
      return adminStore.battleTagModerationStatus[props.battleTag];
    });

    const hasMultipleBadges = computed(() => {
      if (!moderationStatus.value) return false;
      const count = [
        moderationStatus.value.ban,
        moderationStatus.value.globalMute,
        moderationStatus.value.loungeMute,
      ].filter(Boolean).length;
      return count > 1;
    });

    function isBanExpired(endDate: string): boolean {
      if (!endDate) return false;
      const endDateTime = new Date(endDate);
      return endDateTime < new Date();
    }

    function isMuteExpired(expiresAt: string | null | undefined): boolean {
      if (!expiresAt) return false; // If no expiry, it never expires
      const expiryDateTime = new Date(expiresAt);
      return expiryDateTime < new Date();
    }

    return {
      mdiCancel,
      mdiVolumeOff,
      mdiMessageOff,
      hasModerationPermission,
      moderationStatus,
      hasMultipleBadges,
      isBanExpired,
      isMuteExpired,
    };
  },
});
</script>
