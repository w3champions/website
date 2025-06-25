<template>
  <v-card-text class="px-16">
    <h3>{{ $t("views_gettingstarted.downloadw3ctitle") }}</h3>
    <br />
    <v-card-text>
      <v-btn
        :href="launcherEUrl"
        target="_blank"
        class="join-button mt-0 mb-4"
      >
        <v-icon>{{ mdiDownload }}</v-icon>
        <span class="mr-2 hidden-xs-only">Windows</span>
      </v-btn>
      <v-btn
        :href="launcherUrlMac"
        target="_blank"
        class="join-button mt-0 mb-4 ml-8"
      >
        <v-icon>{{ mdiDownload }}</v-icon>
        <span class="mr-2 hidden-xs-only">Mac</span>
      </v-btn>
    </v-card-text>
    <h3>{{ $t("views_gettingstarted.launchertitle") }}</h3>
    <br />
    <img class="launcher-screenshot" src="/assets/gettingStarted/launcher1.jpg">
    <img class="launcher-screenshot" src="/assets/gettingStarted/launcher2.jpg">
    <img class="launcher-screenshot" src="/assets/gettingStarted/launcher3.jpg">
    <v-card-text>
      {{ $t("views_gettingstarted.launcherfeaturestitle") }}
      <ul>
        <li>
          {{ $t("views_gettingstarted.launcherfeaturesbody1") }}
        </li>
        <li>
          {{ $t("views_gettingstarted.launcherfeaturesbody2") }}
        </li>
        <li>
          {{ $t("views_gettingstarted.launcherfeaturesbody3") }}
        </li>
        <li>
          {{ $t("views_gettingstarted.launcherfeaturesbody4") }}
        </li>
        <li>
          {{ $t("views_gettingstarted.launcherfeaturesbody5") }}
        </li>
      </ul>
    </v-card-text>
  </v-card-text>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { LAUNCHER_UPDATE_URL } from "@/main";
import { mdiDownload } from "@mdi/js";

export default defineComponent({
  name: "LauncherSetup",
  setup() {
    const launcherUrlMac = ref<string>(LAUNCHER_UPDATE_URL + "launcher/mac");
    const launcherEUrl = ref<string>(LAUNCHER_UPDATE_URL + "launcher-e");

    return {
      launcherUrlMac,
      launcherEUrl,
      mdiDownload
    };
  },
});
</script>

<style lang="scss" scoped>
.launcher-screenshot {
  width: 100%;
  margin-bottom: 10px;
}
</style>