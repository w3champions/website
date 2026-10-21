<template>
  <div>
    <v-card-title class="pt-3">
      Message Of The Day
    </v-card-title>
    <v-container class="w3-container-width">
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
            <v-card-text class="px-6">
              <AdminRichTextEditor v-model="newMotd" label="Message of the Day" :max-length="MOTD_MAX_LENGTH" />
            </v-card-text>
            <v-card-actions class="pa-3 ma-3 justify-end">
              <v-btn class="bg-primary text-w3-race-bg" :disabled="!isFormValid" @click="confirmNewMotd">Set New Motd</v-btn>
            </v-card-actions>
          </v-form>
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";
import AdminRichTextEditor from "./editor/AdminRichTextEditor.vue";
import { linkifyAnnouncementHtml, MOTD_MAX_LENGTH } from "@/helpers/announcementHtml";

export default defineComponent({
  name: "AdminMotd",
  components: { AdminRichTextEditor },
  setup() {
    const infoMessagesStore = useInfoMessagesStore();

    const loading = ref<boolean>(true);
    const loaded = ref<boolean>(false);
    const newMotd = ref<string>("");
    const form = ref();
    const isFormValid = ref(false);

    const motd = computed<string>(() => infoMessagesStore.messageOfTheDay.motd);
    const linkedMotd = computed(() => linkifyAnnouncementHtml(newMotd.value));
    async function confirmNewMotd(): Promise<void> {
      if (!(await form.value.validate()).valid) return;
      await setMotd(linkedMotd.value);
      await infoMessagesStore.loadMotd();
    }

    async function setMotd(value: string): Promise<boolean> {
      return await infoMessagesStore.setMotd({ motd: value });
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
      linkedMotd,
      MOTD_MAX_LENGTH,
      newMotd,
      confirmNewMotd,
      form,
      isFormValid,
    };
  },
});
</script>
