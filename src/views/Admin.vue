<template>
  <v-container fluid class="pa-3">
    <admin-check-jwt-lifetime />
    <div v-if="isAdmin">
      <admin-navigation />
      <v-card class="overflow-x-auto" tile>
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
