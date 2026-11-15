<template>
  <div v-if="hasModerationPermission" class="d-inline-flex align-center">
    <!-- Ban badge -->
    <v-tooltip v-if="banBadge" location="top" content-class="w3-tooltip elevation-1">
      <template v-slot:activator="{ props }">
        <span class="d-inline-flex" v-bind="props">
          <v-chip
            :size="compact ? 'x-small' : 'small'"
            :color="banBadge.inEffect ? 'error' : 'grey'"
            class="px-3"
            :class="{ 'mr-1': !compact || hasMultipleBadges }"
            variant="flat"
          >
            <v-icon size="default" :start="!compact">{{ mdiCancel }}</v-icon>
            <span v-if="!compact" class="ml-1">{{ banBadge.label }}</span>
          </v-chip>
          <v-chip
            v-if="banBadge.machine"
            :size="compact ? 'x-small' : 'small'"
            color="error"
            variant="outlined"
            class="px-3"
            :class="{ 'mr-1': !compact || hasMultipleBadges }"
          >
            {{ t(key("badge_machine")) }}
          </v-chip>
        </span>
      </template>
      <div>
        <div><strong>{{ t(key("badge_reason")) }}:</strong> {{ banBadge.reason }}</div>
        <div><strong>{{ t(key("badge_until")) }}:</strong> {{ banBadge.until }}</div>
        <div><strong>{{ t(key("badge_by")) }}:</strong> {{ banBadge.by }}</div>
        <div><strong>{{ t(key("badge_modes")) }}:</strong> {{ banBadge.modes }}</div>
        <div><strong>{{ t(key("badge_status")) }}:</strong> {{ banBadge.status }}</div>
        <div v-if="banBadge.machine"><strong>{{ t(key("badge_machine_line")) }}</strong></div>
      </div>
    </v-tooltip>

    <!-- Global mute badge -->
    <v-tooltip v-if="moderationStatus?.globalMute" location="top" content-class="w3-tooltip elevation-1">
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
    <v-tooltip v-if="moderationStatus?.loungeMute" location="top" content-class="w3-tooltip elevation-1">
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
import { useI18n } from "vue-i18n";
import { useBanPermissions } from "@/composables/useBanPermissions";
import { useBanStatusStore } from "@/store/admin/bans/statusStore";
import { banBadgeOf } from "@/store/admin/bans/badge";
import { key } from "@/store/admin/bans/translate";
import { EGameMode } from "@/store/types";

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
    const { t } = useI18n();
    const adminStore = useAdminStore();
    const banStatusStore = useBanStatusStore();
    const oauthStore = useOauthStore();
    const { hasMachineAccess } = useBanPermissions();

    const permissions = computed<string[]>(() => oauthStore.permissions);
    const hasModerationPermission = computed(() =>
      permissions.value.includes(EPermission[EPermission.Moderation])
    );

    const moderationStatus = computed(() => {
      return adminStore.battleTagModerationStatus[props.battleTag];
    });

    const banBadge = computed(() =>
      banBadgeOf(banStatusStore.statuses[props.battleTag], {
        t,
        modeName: (m) => t(`gameModes.${EGameMode[m]}`),
        hasMachineAccess: hasMachineAccess.value,
      })
    );

    const hasMultipleBadges = computed(() => {
      if (!moderationStatus.value) return false;
      const count = [
        banBadge.value,
        moderationStatus.value.globalMute,
        moderationStatus.value.loungeMute,
      ].filter(Boolean).length;
      return count > 1;
    });

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
      banBadge,
      t,
      key,
      hasMultipleBadges,
      isMuteExpired,
    };
  },
});
</script>
