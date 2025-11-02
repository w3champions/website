<template>
  <v-card-text>
    <v-row class="justify-center">
      <v-col class="text-end">
        <v-dialog v-model="dialog" max-width="400px">
          <template v-slot:activator="{ props }">
            <v-btn variant="outlined" color="error" v-bind="props">
              {{ $t("components_clans_deleteclanmodal.delete") }} {{ clanName }}
            </v-btn>
          </template>
          <v-card>
            <v-card-title class="text-center text-pre-wrap pt-3">
              {{ $t("components_clans_deleteclanmodal.areyousuredelete") }}
              {{ clanName }}?
            </v-card-title>
            <v-card-actions>
              <v-spacer />
              <v-btn color="blue-darken-1" variant="text" @click="dialog = false">
                {{ $t("components_clans_deleteclanmodal.close") }}
              </v-btn>
              <v-btn color="blue-darken-1" variant="text" @click="deleteClan">
                {{ $t("components_clans_deleteclanmodal.delete") }}
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
  name: "DeleteClanModal",
  components: {},
  setup() {
    const clanStore = useClanStore();
    const dialog = ref<boolean>(false);
    const clanName = computed<string>(() => clanStore.playersClan.clanName);

    async function deleteClan(): Promise<void> {
      await clanStore.deleteClan();
      dialog.value = false;
      await clanStore.retrievePlayersClan();
      await clanStore.retrievePlayersMembership();
    }

    return {
      dialog,
      clanName,
      deleteClan,
    };
  },
});
</script>
