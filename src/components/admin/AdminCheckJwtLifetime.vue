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
import { Component, Vue } from "vue-facing-decorator";
import { useAdminStore } from "@/store/admin/store";

@Component({})
export default class AdminCheckJwtLifetime extends Vue {
  private adminStore = useAdminStore();
  private _intervalRefreshHandle?: number = undefined;
  private checkJwtLifetimeInterval = 1000 * 60 * 5; // Check if jwt has expired every 5 minutes.

  get showJwtExpiredDialog(): boolean {
    if (this.adminStore.showJwtExpiredDialog) {
      clearInterval(this._intervalRefreshHandle);
    }
    return this.adminStore.showJwtExpiredDialog;
  }

  public hideDialog() {
    this.adminStore.hideJwtExpiredDialog();
  }

  async mounted(): Promise<void> {
    this._intervalRefreshHandle = setInterval(async () => {
      await this.adminStore.checkJwtLifetime();
    }, this.checkJwtLifetimeInterval);
    await this.adminStore.checkJwtLifetime();
  }

  destroyed(): void {
    clearInterval(this._intervalRefreshHandle);
  }
}
</script>

<style lang="scss">
</style>
