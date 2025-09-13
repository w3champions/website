<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span>{{ $t("views_setupguides.title") }}</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider />
            <v-tab class="profileTab" exact :to="{ name: ESetupGuidesRouteName.LAUNCHER_SETUP }">
              {{ $t("views_setupguides.launcher_setup") }}
            </v-tab>
            <v-tab class="profileTab" :to="{ name: ESetupGuidesRouteName.INSTALLING_WAR3 }">
              {{ $t("views_setupguides.installing_war3") }}
            </v-tab>
          </v-tabs>
          <v-card-text>
            <keep-alive>
              <router-view />
            </keep-alive>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ESetupGuidesRouteName } from "@/router/types";

export default defineComponent({
  name: "SetupGuides",
  setup() {
    return {
      ESetupGuidesRouteName
    };
  },
});
</script>

<style lang="scss" scoped>
.v-stepper {
  box-shadow: none;
}

.v-card {
  border-radius: 8px;
}

.v-expansion-panel-content {
  padding: 16px 24px;
}

h3 {
  margin-bottom: 16px;
  color: var(--v-primary-base);
}

h4 {
  margin-bottom: 12px;
  font-weight: 600;
}

code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
}

ul, ol {
  margin: 12px 0;
  padding-left: 24px;
}

li {
  margin-bottom: 8px;
}

.launcher-screenshot {
  width: 100%;
  margin-bottom: 10px;
}
</style>