import { computed, type ComputedRef } from "vue";
import { EPermission } from "@/store/admin/permission/types";
import { useOauthStore } from "@/store/oauth/store";

export interface ReplayStoreAccess {
  /** For now only admins with the Replays permission, as the backend checks. */
  hasAccess: ComputedRef<boolean>;
  /** The profile with the permissions is loading. */
  checking: ComputedRef<boolean>;
  /** Signed in, but the profile did not load (the server did not answer): the access is not known. */
  profileMissing: ComputedRef<boolean>;
}

/**
 * The replay store (/replays) is not open to all users yet. For the public launch, give every user access
 * here and remove OnlyWithPermission from ReplayStoreController in website-backend.
 */
export function useReplayStoreAccess(): ReplayStoreAccess {
  const oauthStore = useOauthStore();
  return {
    hasAccess: computed(() => oauthStore.isAdmin && oauthStore.permissions.includes(EPermission[EPermission.Replays])),
    checking: computed(() => oauthStore.isLoadingBlizzardBtag),
    profileMissing: computed(() => !!oauthStore.token && !oauthStore.blizzardVerifiedBtag && !oauthStore.isLoadingBlizzardBtag),
  };
}
