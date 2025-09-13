<template>
  <v-card-text class="px-16">
    <v-card-text>
      {{ $t("views_gettingstarted.introinstallwar3") }}
      <ul>
        <li>
          {{ $t("views_gettingstarted.logoutinstall1") }}
        </li>
        <li>
          {{ $t("views_gettingstarted.logoutinstall2") }}
        </li>
      </ul>
      <br />
      <img class="launcher-screenshot" src="/assets/installingWar3/install_unlogged.png" />
      <br />
      {{ $t("views_gettingstarted.loginbnet") }}
      <br />
      {{ $t("views_gettingstarted.playwar3") }}
      <br />
      <br />
      <img class="launcher-screenshot" src="/assets/installingWar3/play_logged.png" />
    </v-card-text>
  </v-card-text>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "InstallingWar3",
  setup() {
    return {};
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