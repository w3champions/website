<template>
  <sign-in-dialog v-model="showSignInDialog" :isAdminPanel="true"></sign-in-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted } from "vue";
import { useAdminStore } from "@/store/admin/store";
import SignInDialog from "@/components/common/SignInDialog.vue";

export default defineComponent({
  name: "AdminCheckJwtLifetime",
  components: {
    SignInDialog,
  },
  setup() {
    const adminStore = useAdminStore();
    const checkJwtLifetimeInterval = 1000 * 60 * 5; // Check if jwt has expired every 5 minutes.
    let _intervalRefreshHandle: NodeJS.Timeout;

    const showSignInDialog = computed<boolean>({
      get(): boolean {
        if (adminStore.showJwtExpiredDialog) {
          clearInterval(_intervalRefreshHandle);
        }
        return adminStore.showJwtExpiredDialog;
      },
      set(val: boolean): void {
        adminStore.showJwtExpiredDialog = val;
      },
    });

     onMounted(async (): Promise<void> => {
      _intervalRefreshHandle = setInterval(async () => {
        await adminStore.checkJwtLifetime();
      }, checkJwtLifetimeInterval);
      await adminStore.checkJwtLifetime();
     });

    onUnmounted((): void => {
      clearInterval(_intervalRefreshHandle);
    });

    return {
      showSignInDialog,
    };
  },
});
</script>
