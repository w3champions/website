<template>
  <v-card-text>
    <br />
    <br />
    <v-row class="justify-center">
      <v-col class="text-end">
        <v-dialog v-model="invitePlayerDialog" max-width="400px">
          <template v-slot:activator="{ props }">
            <v-btn :disabled="isChieftain" variant="outlined" color="error" v-bind="props">
              {{ $t("components_clans_leaveclanmodal.leaveclan") }}
              {{ clanName }}
            </v-btn>
            <v-card-subtitle v-if="isChieftain" class="pr-0 pt-2">
              {{ $t("components_clans_leaveclanmodal.promotefirst") }}
            </v-card-subtitle>
          </template>
          <v-card>
            <v-card-title class="text-center text-pre-wrap pt-3">
              {{ $t("components_clans_leaveclanmodal.areyousureleave") }}
              {{ clanName }}?
            </v-card-title>
            <v-card-actions>
              <v-spacer />
              <v-btn color="blue-darken-1" variant="text" @click="invitePlayerDialog = false">
                {{ $t("components_clans_leaveclanmodal.close") }}
              </v-btn>
              <v-btn color="blue-darken-1" variant="text" @click="leaveClan">
                {{ $t("components_clans_leaveclanmodal.leaveclan") }}
                {{ clanName }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-card-text>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useClanStore } from "@/store/clan/store";

export default defineComponent({
  name: "LeaveClanModal",
  components: {},
  props: {
    isChieftain: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const clanStore = useClanStore();
    const invitePlayerDialog = ref<boolean>(false);

    const clanName = computed<string>(() => clanStore.playersClan.clanName);

    async function leaveClan(): Promise<void> {
      await clanStore.leaveClan();
      invitePlayerDialog.value = false;
      await clanStore.retrievePlayersClan();
      await clanStore.retrievePlayersMembership();
    }

    return {
      invitePlayerDialog,
      clanName,
      leaveClan,
    };
  },
});
</script>
