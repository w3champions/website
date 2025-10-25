<template>
  <div>
    <v-card-title>
      Message Of The Day
    </v-card-title>
    <v-container>
      <div v-if="!loaded">
        <v-alert class="ma-4 pa-4" density="compact" variant="outlined" type="error">Could not load the Message of the Day</v-alert>
      </div>
      <v-card v-else>
        <div v-if="!loading">
          <v-card-title class="justify-center">Current Message of the Day:</v-card-title>
          <v-card-text class="text-center text-body-1">
            <v-divider class="mb-4" />
            {{ motd }}
            <v-divider class="mt-4" />
          </v-card-text>
          <v-form ref="form" v-model="isFormValid">
            <v-card-actions class="ma-3 pa-3">
              <v-textarea v-model="newMotd" variant="outlined" counter label="New Motd:" :rules="rules" />
            </v-card-actions>
            <v-card-actions class="pa-3 ma-3 justify-end">
              <v-btn class="bg-primary w3-race-bg--text" :disabled="!isFormValid" @click="confirmNewMotd">Set New Motd</v-btn>
            </v-card-actions>
          </v-form>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { MessageOfTheDay } from "@/store/admin/infoMessages/types";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";
import { ValidationRule } from "vuetify";

export default defineComponent({
  name: "AdminMotd",
  components: {},
  setup() {
    const infoMessagesStore = useInfoMessagesStore();

    const loading = ref<boolean>(true);
    const loaded = ref<boolean>(false);
    const newMotd = ref<string>("");
    const form = ref();
    const isFormValid = ref(false);

    const motd = computed<string>(() => infoMessagesStore.messageOfTheDay.motd);

    const rules = computed<ValidationRule[]>(() => {
      return [
        (value: string) => value.length <= 400 || "Max 400 characters",
      ];
    });

    async function confirmNewMotd(): Promise<void> {
      await setMotd(newMotd.value);
      await infoMessagesStore.loadMotd();
    }

    async function setMotd(value: string): Promise<boolean> {
      return await infoMessagesStore.setMotd({ motd: value } as MessageOfTheDay);
    }

    onMounted(async (): Promise<void> => {
      loaded.value = await infoMessagesStore.loadMotd();
      if (motd.value === "" || motd.value === undefined) {
        loaded.value = false;
      }
      loading.value = false;
      newMotd.value = motd.value;
    });

    return {
      loaded,
      loading,
      motd,
      rules,
      newMotd,
      confirmNewMotd,
      form,
      isFormValid,
    };
  },
});
</script>
