<template>
  <v-container fluid v-if="isAdmin" style="height: 100%">
    <admin-check-jwt-lifetime />
    <div class="admin-page-wrapper">
      <admin-navigation></admin-navigation>
      <v-card tile>
        <router-view></router-view>
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent } from "vue";
import AdminNavigation from "@/components/admin/AdminNavigation.vue";
import AdminCheckJwtLifetime from "@/components/admin/AdminCheckJwtLifetime.vue";
import { useOauthStore } from "@/store/oauth/store";

export default defineComponent({
  name: "AdminView",
  components: {
    AdminNavigation,
    AdminCheckJwtLifetime,
  },
  props: {},
  setup() {
    const oauthStore = useOauthStore();
    const isAdmin: ComputedRef<boolean> = computed((): boolean => oauthStore.isAdmin);

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
