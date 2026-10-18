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
            <v-card-actions class="ma-3 pa-3">
              <v-textarea v-model="newMotd" variant="outlined" :counter="MOTD_MAX_LENGTH" :counter-value="() => linkedMotd.length" label="New Motd:" :rules="rules" hint="HTTP(S) URLs become clickable links when saved. The character count includes link markup." persistent-hint />
            </v-card-actions>
            <v-card-text class="px-6">
              <h3 class="mb-3">Preview</h3>
              <iframe class="motd-preview" title="Message of the Day preview" sandbox="" referrerpolicy="no-referrer" :srcdoc="motdPreview"></iframe>
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
import type { ValidationRule } from "vuetify";
import { linkifyMotd, MOTD_MAX_LENGTH } from "@/helpers/motdLinks";

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
    const linkedMotd = computed(() => linkifyMotd(newMotd.value));
    const motdPreview = computed(() => `<!doctype html>
<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<style>
  body { margin: 20px; color: #fff; background: #111; font: 18px/1.4 Georgia, serif; overflow-wrap: anywhere; }
  h1, h2, h3, a { color: #ffd428; }
  a { pointer-events: none; }
</style></head><body>${linkedMotd.value}</body></html>`);

    const rules = computed<ValidationRule[]>(() => {
      return [
        () => linkedMotd.value.length <= MOTD_MAX_LENGTH || `Max ${MOTD_MAX_LENGTH} characters, including generated links`,
      ];
    });

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
      motdPreview,
      linkedMotd,
      MOTD_MAX_LENGTH,
      rules,
      newMotd,
      confirmNewMotd,
      form,
      isFormValid,
    };
  },
});
</script>

<style scoped>
.motd-preview {
  display: block;
  width: 100%;
  height: 260px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 4px;
  background: #111;
}
</style>
