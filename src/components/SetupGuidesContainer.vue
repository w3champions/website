<template>
  <div class="pt-4">
    <div class="px-0">
      <v-tabs>
        <v-tabs-slider />
        <v-tab class="profileTab" @click="navigateToLauncher">
          {{ $t("views_setupguides.launcher_setup") }}
        </v-tab>
        <v-tab class="profileTab" @click="navigateToInstalling">
          {{ $t("views_setupguides.installing_war3") }}
        </v-tab>
      </v-tabs>
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "SetupGuidesContainer",
  methods: {
    navigateToLauncher() {
      this.$router.push('/faq/setup-guides/launcher-setup');
    },
    navigateToInstalling() {
      this.$router.push('/faq/setup-guides/installing-war3');
    }
  }
});
</script>
