<template>
  <!-- No outer padding below 960px so the content can use the full screen width. -->
  <v-container fluid class="admin-view pa-0 pa-md-3">
    <admin-check-jwt-lifetime />
    <div v-if="isAdmin">
      <admin-navigation v-model="isNavigationOpen" />
      <!-- The drawer is an overlay on small screens, so it needs its own toggle. -->
      <v-toolbar v-if="smAndDown" density="compact" class="admin-mobile-bar w3-glass">
        <v-app-bar-nav-icon
          :aria-label="$t('views_admin.adminpage')"
          @click="isNavigationOpen = true"
        />
        <v-toolbar-title class="text-subtitle-1">
          {{ $t("views_admin.adminpage") }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card class="overflow-x-auto" tile :flat="smAndDown">
        <router-view />
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import AdminNavigation from "@/components/admin/AdminNavigation.vue";
import AdminCheckJwtLifetime from "@/components/admin/AdminCheckJwtLifetime.vue";
import { useOauthStore } from "@/store/oauth/store";
import { useDisplay } from "vuetify";

export default defineComponent({
  name: "AdminView",
  components: {
    AdminNavigation,
    AdminCheckJwtLifetime,
  },
  setup() {
    const oauthStore = useOauthStore();
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);
    // Matches the drawer's "md" mobile-breakpoint: below 960px it overlays.
    const { smAndDown } = useDisplay();
    // Vuetify only opens a drawer by itself when its model is uncontrolled
    // (`modelValue == null`), and binding v-model makes it controlled - so the
    // initial state is ours to set. Without this the drawer stays hidden on
    // desktop until a resize crosses the breakpoint and Vuetify's own watcher
    // corrects it.
    const isNavigationOpen = ref<boolean>(!smAndDown.value);

    return {
      isAdmin,
      smAndDown,
      isNavigationOpen,
    };
  },
});
</script>

<style lang="scss" scoped>
// Keep the menu reachable while scrolling long admin pages.
.admin-mobile-bar {
  position: sticky;
  top: var(--v-layout-top, 64px);
  z-index: 3;
}

// Reclaim the horizontal padding admin pages add around their own content.
@media (max-width: 959px) {
  .admin-view {
    :deep(.v-container) {
      padding-left: 8px;
      padding-right: 8px;
    }

    :deep(.px-4) {
      padding-left: 8px !important;
      padding-right: 8px !important;
    }

    :deep(.v-card-title) {
      padding-left: 12px;
      padding-right: 12px;
    }

    // Admin pages lay their filter/action bars out as flex rows of fractional
    // widths, which collapse into unusable slivers on a phone. Stack them instead.
    :deep(.v-card > .d-flex),
    :deep(.v-card-text > .d-flex),
    :deep(.v-data-table .d-flex),
    :deep(.v-card > div > .d-flex) {
      flex-wrap: wrap;
    }

    :deep(.w-25),
    :deep(.w-33),
    :deep(.w-50),
    :deep(.w-66),
    :deep(.w-75) {
      width: 100% !important;
    }
  }
}
</style>
