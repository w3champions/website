<template>
  <div class="pt-4">
    <div class="px-0">
      <v-tabs
        direction="vertical"
        v-model="activeTab"
        class="ml-md-4"
      >
        <v-tab @click="navigateToLauncher">
          {{ $t("views_setupguides.launcher_setup") }}
        </v-tab>
        <v-tab @click="navigateToInstalling">
          {{ $t("views_setupguides.installing_war3") }}
        </v-tab>
      </v-tabs>
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ESetupGuideRouteName } from "@/router/types";

export default defineComponent({
  name: "SetupGuidesContainer",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const activeTab = ref(0);

    const updateActiveTab = () => {
      if (route.name === ESetupGuideRouteName.INSTALLING_WAR3) {
        activeTab.value = 1;
      } else {
        activeTab.value = 0;
      }
    };

    // Set initial tab based on route
    updateActiveTab();

    // Watch for route changes
    watch(() => route.path, updateActiveTab);

    const navigateToLauncher = () => {
      router.push({ name: ESetupGuideRouteName.LAUNCHER_SETUP });
    };

    const navigateToInstalling = () => {
      router.push({ name: ESetupGuideRouteName.INSTALLING_WAR3 });
    };

    return {
      activeTab,
      navigateToLauncher,
      navigateToInstalling,
    };
  }
});
</script>
