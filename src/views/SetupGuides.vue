<template>
  <v-row class="justify-center">
    <v-col>
      <v-container>
        <v-card tile>
          <v-card-title class="text-center">
            {{ $t("views_setupguides.title") }}
          </v-card-title>
          <v-row no-gutters>
            <v-col cols="3">
              <v-tabs v-model="tabsModel.self" vertical class="ml-5">
                <v-tabs-slider></v-tabs-slider>
                <v-tab 
                  class="profileTab" 
                  :to="{ name: ESetupGuidesRouteName.LAUNCHER_SETUP }"
                  :value="ESetupGuidesRouteName.LAUNCHER_SETUP">
                  {{ $t("views_setupguides.launcher_setup") }}
                </v-tab>
                <v-tab 
                  class="profileTab" 
                  :to="{ name: ESetupGuidesRouteName.INSTALLING_WAR3 }"
                  :value="ESetupGuidesRouteName.INSTALLING_WAR3">
                  {{ $t("views_setupguides.installing_war3") }}
                </v-tab>
              </v-tabs>
            </v-col>
            <v-col cols="9">
              <v-card-text>
                <keep-alive>
                  <router-view></router-view>
                </keep-alive>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useRoute } from "vue-router/composables";
import { ESetupGuidesRouteName } from "@/router/types";

export default defineComponent({
  name: "SetupGuides",
  setup() {
    const route = useRoute();
    const tabsModel = ref({ self: ESetupGuidesRouteName.LAUNCHER_SETUP });

    // Sync tab selection with current route
    watch(() => route.name, (newRouteName) => {
      if (newRouteName === ESetupGuidesRouteName.LAUNCHER_SETUP) {
        tabsModel.value.self = ESetupGuidesRouteName.LAUNCHER_SETUP;
      } else if (newRouteName === ESetupGuidesRouteName.INSTALLING_WAR3) {
        tabsModel.value.self = ESetupGuidesRouteName.INSTALLING_WAR3;
      }
    }, { immediate: true });

    return {
      tabsModel,
      ESetupGuidesRouteName
    };
  },
});
</script>

<style lang="scss" scoped>
.v-card {
  border-radius: 8px;
}

.launcher-screenshot {
  width: 100%;
  margin-bottom: 10px;
}
</style>