<template>
  <v-container fluid class="pb-3 pr-3">
    <admin-check-jwt-lifetime />
    <div v-if="isAdmin" class="admin-page-wrapper">
      <admin-navigation />
      <v-card tile>
        <router-view />
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import AdminNavigation from "@/components/admin/AdminNavigation.vue";
import AdminCheckJwtLifetime from "@/components/admin/AdminCheckJwtLifetime.vue";
import { useOauthStore } from "@/store/oauth/store";

export default defineComponent({
  name: "AdminView",
  components: {
    AdminNavigation,
    AdminCheckJwtLifetime,
  },
  setup() {
    const oauthStore = useOauthStore();
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    return {
      isAdmin,
    };
  },
});
</script>

<style lang="scss" scoped>
// Added 'NOT-USED' to remove this styling for now, because it looks better without it, but it still doesn't look good.
.admin-page-wrapper-NOT-USED {
  height: 100%;
  display: grid;
  grid-template-columns: 256px auto;
}
</style>
