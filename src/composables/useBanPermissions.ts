import { computed, type ComputedRef } from "vue";
import { EPermission } from "@/store/admin/permission/types";
import { useOauthStore } from "@/store/oauth/store";

export interface BanPermissions {
  /** EPermission.Moderation: may read and write bans. */
  canModerate: ComputedRef<boolean>;
  /** EPermission.AdminModeration: may see and change the machine IDs of a machine ban. */
  hasMachineAccess: ComputedRef<boolean>;
  /** Permissions arrive with the profile; an empty list means not loaded yet (as in AdminNavigation). */
  permissionsKnown: ComputedRef<boolean>;
}

/** Gate shared by the bans pages. */
export function useBanPermissions(): BanPermissions {
  const oauthStore = useOauthStore();
  return {
    canModerate: computed(() => oauthStore.permissions.includes(EPermission[EPermission.Moderation])),
    hasMachineAccess: computed(() => oauthStore.permissions.includes(EPermission[EPermission.AdminModeration])),
    permissionsKnown: computed(() => oauthStore.permissions.length > 0),
  };
}
