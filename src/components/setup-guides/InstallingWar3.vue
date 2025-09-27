<template>
  <v-card-text class="px-4">
    <v-card-text class="">
      {{ $t("views_gettingstarted.installwar3intro") }}
      <ol>
        <li>{{ $t("views_gettingstarted.installwar3step1") }}</li>
        <li>{{ $t("views_gettingstarted.installwar3step2") }}</li>
        <img class="launcher-screenshot" src="/assets/installingWar3/log_out.png" />
        <li>{{ $t("views_gettingstarted.installwar3step3") }}</li>
        <li>{{ $t("views_gettingstarted.installwar3step4") }}</li>
        <img class="launcher-screenshot" src="/assets/installingWar3/continue_without_logging_in.png" />
        <li>{{ $t("views_gettingstarted.installwar3step5") }}</li>
        <li>{{ $t("views_gettingstarted.installwar3step6") }}</li>
        <li>{{ $t("views_gettingstarted.installwar3step7") }}</li>
      </ol>
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
  margin-bottom: 10px;
}
</style>