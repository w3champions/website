<template>
  <v-card-text>
    <v-row class="justify-center">
      <v-col class="text-center">
        <v-card-subtitle>
          {{ $t("components_clans_clancreationpanel.noclanmsg") }}
        </v-card-subtitle>
      </v-col>
    </v-row>

    <v-row class="justify-center">
      <v-col cols="6">
        <v-text-field
          :v-model="clanNameToCreate"
          @change="changeInsertedClanName"
          :rules="[mustBeBetween(3, 30, ' ')]"
          :label="$t(`components_clans_clancreationpanel.clanname`)"
          :hint="$t(`components_clans_clancreationpanel.enterclanname`)"
        />
        <v-text-field
          :v-model="clanAbbreviationToCreate"
          @change="changeInsertedClanAbbreviation"
          :rules="[mustBeBetween(2, 5, '')]"
          :label="$t(`components_clans_clancreationpanel.clanabbrev`)"
          :hint="$t(`components_clans_clancreationpanel.enterclanabbrev`)"
        />
      </v-col>
    </v-row>
    <v-row class="justify-center">
      <v-col class="text-center">
        <v-btn @click="createClan">
          {{ $t("components_clans_clancreationpanel.createclan") }}
        </v-btn>
      </v-col>
    </v-row>
    <v-alert
      v-model="isValidationError"
      type="warning"
      dense
      class="ml-4 mr-4"
      dismissible
    >
      {{ clanValidationError }}
    </v-alert>
  </v-card-text>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { TranslateResult, useI18n } from "vue-i18n-bridge";
import { useClanStore } from "@/store/clan/store";

export default defineComponent({
  name: "ClanCreationPanel",
  components: {},
  setup() {
    const { t } = useI18n();
    const clanStore = useClanStore();
    const clanNameToCreate = ref<string>("");
    const clanAbbreviationToCreate = ref<string>("");

    const clanValidationError = computed(() => clanStore.clanValidationError);
    const isValidationError = computed(() => clanStore.clanValidationError !== "");

    function mustBeBetween(min: number, max: number, space: string): (v: string) => TranslateResult {
      return (v: string): TranslateResult => {
        if (!v)
          return t("components_clans_clancreationpanel.fieldismandatory");
        if (!v.match(`^[a-zA-Z0-9${space}]{${min},${max}}$`))
          return t("components_clans_clancreationpanel.minmaxchars", {
            min,
            max,
          });
        return "";
      };
    }

    function changeInsertedClanName(newName: string): void {
      clanNameToCreate.value = newName;
    }

    function changeInsertedClanAbbreviation(newName: string): void {
      clanAbbreviationToCreate.value = newName;
    }

    async function createClan(): Promise<void> {
      await clanStore.createClan({
        clanName: clanNameToCreate.value.trim(),
        abbreviation: clanAbbreviationToCreate.value,
      });
      await clanStore.retrievePlayersClan();
    }

    return {
      clanNameToCreate,
      clanAbbreviationToCreate,
      clanValidationError,
      isValidationError,
      mustBeBetween,
      changeInsertedClanName,
      changeInsertedClanAbbreviation,
      createClan,
    };
  },
});
</script>
