import { computed, type ComputedRef } from "vue";
import { EPermission } from "@/store/admin/permission/types";
import { useOauthStore } from "@/store/oauth/store";

export interface CommercialLicensePermission {
  hasPermission: ComputedRef<boolean>;
  /** Permissions arrive with the profile; an empty list means not loaded yet (as in AdminNavigation). */
  permissionsKnown: ComputedRef<boolean>;
}

/** Gate shared by the Commercial Events admin pages (EPermission.CommercialLicense). */
export function useCommercialLicensePermission(): CommercialLicensePermission {
  const oauthStore = useOauthStore();
  return {
    hasPermission: computed(() => oauthStore.permissions.includes(EPermission[EPermission.CommercialLicense])),
    permissionsKnown: computed(() => oauthStore.permissions.length > 0),
  };
}
