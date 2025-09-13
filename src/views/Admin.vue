<template>
  <v-container fluid style="height: 100%">
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
.admin-page-wrapper {
  height: 100%;
  display: grid;
  grid-template-columns: 256px auto;
}
</style>
