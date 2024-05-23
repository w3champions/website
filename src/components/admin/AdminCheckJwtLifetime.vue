<template>
  <v-dialog v-model="showJwtExpiredDialog" max-width="800px">
    <v-card>
      <v-card-title>
        <span class="text-h5">You've been logged out</span>
      </v-card-title>
      <v-card-actions>
        <p>Your token has expired. Please log in again.</p>
        <v-spacer></v-spacer>
        <v-btn color="primary" class="mb-2 w3-race-bg--text" @click="hideDialog">{{ $t(`views_admin.ok`) }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, onUnmounted } from "vue";
import { useAdminStore } from "@/store/admin/store";
import { useCookies } from "@/mixins/useCookies";

export default defineComponent({
  name: "AdminCheckJwtLifetime",
  components: {},
  setup() {
    const adminStore = useAdminStore();
    const checkJwtLifetimeInterval = 1000 * 60 * 5; // Check if jwt has expired every 5 minutes.
    let _intervalRefreshHandle: NodeJS.Timeout;
    const cookies = useCookies();

    const showJwtExpiredDialog: ComputedRef<boolean> = computed((): boolean => {
      if (adminStore.showJwtExpiredDialog) {
        clearInterval(_intervalRefreshHandle);
      }
      return adminStore.showJwtExpiredDialog;
    });

    function hideDialog() {
      adminStore.hideJwtExpiredDialog();
    }

     onMounted(async (): Promise<void> => {
      _intervalRefreshHandle = setInterval(async () => {
        await adminStore.checkJwtLifetime(cookies);
      }, checkJwtLifetimeInterval);
      await adminStore.checkJwtLifetime(cookies);
     });

    onUnmounted((): void => {
      clearInterval(_intervalRefreshHandle);
    });

    return {
      showJwtExpiredDialog,
      hideDialog,
    };
  },
});
</script>
