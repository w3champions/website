<template>
  <v-card-text class="px-4">
    <v-card-text class="">
      {{ $t("views_gettingstarted.installwar3intro") }}
      <ol class="pl-6 mt-3">
        <li class="mb-2">{{ $t("views_gettingstarted.installwar3step1") }}</li>
        <li class="mb-2">{{ $t("views_gettingstarted.installwar3step2") }}</li>
        <img class="mb-3" src="/assets/installingWar3/log_out.png" />
        <li class="mb-2">{{ $t("views_gettingstarted.installwar3step3") }}</li>
        <li class="mb-2">{{ $t("views_gettingstarted.installwar3step4") }}</li>
        <img class="mb-3" src="/assets/installingWar3/continue_without_logging_in.png" />
        <li class="mb-2">{{ $t("views_gettingstarted.installwar3step5") }}</li>
        <li class="mb-2">{{ $t("views_gettingstarted.installwar3step6") }}</li>
        <li class="mb-2">{{ $t("views_gettingstarted.installwar3step7") }}</li>
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
