<template>
  <v-row>
    <v-col>
      <v-dialog v-model="dialogOpen" max-width="700">
        <template v-slot:activator="{ on }">
          <v-row class="justify-center ma-0 pa-0">
            <v-btn class="primary w3-race-bg--text" v-on="on">Create New PortraitDefinition (For Now)</v-btn>
          </v-row>
        </template>

        <template>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-card>
              <v-container>
                <v-row>
                  <v-col>
                    <v-card-title class="justify-center">Add New PortraitDefinition</v-card-title>
                  </v-col>

                  <v-btn icon @click="dialogOpen = false">
                    <v-icon>{{ mdiClose }}</v-icon>
                  </v-btn>
                </v-row>

                <v-row>
                  <v-container class="ml-3 mr-3">
                    <v-text-field
                      v-model="portraitId"
                      :rules="[ruleRequired, ruleMin, ruleTaken, ruleNumber, ruleNotZero]"
                      label="Portrait Id"
                    ></v-text-field>
                  </v-container>
                </v-row>

                <v-row>
                  <v-container class="ml-3 mr-3">
                    <portrait-group-combobox :portraitId="portraitId" />
                  </v-container>
                </v-row>
              </v-container>
              <v-row class="mb-5">
                <v-container>
                  <v-row class="justify-center">
                    <v-btn class="primary w3-race-bg--text" @click="confirmDialog" :disabled="!valid">Confirm</v-btn>
                  </v-row>
                </v-container>
              </v-row>
            </v-card>
          </v-form>
        </template>
      </v-dialog>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, ref } from "vue";
import { PortraitDefinition, PortraitDefinitionDTO } from "@/store/admin/types";
import PortraitGroupCombobox from "./PortraitGroupCombobox.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { mdiClose } from "@mdi/js";

export default defineComponent({
  name: "NewPortraitDefinitionDialog",
  components: {
    PortraitGroupCombobox,
  },
  props: {},
  setup() {
    const playerManagement = usePlayerManagementStore();
    const portraitId = ref<number>(0);
    const dialogOpen = ref<boolean>(false);
    const valid = ref<boolean>(false);
    const groups = ref<string[]>([]);

    const allSpecialPortraits: ComputedRef<PortraitDefinition[]> = computed((): PortraitDefinition[] => playerManagement.allSpecialPortraits);

    // Input validation rules
    const ruleRequired = computed(() => !!portraitId.value || "Required");
    const ruleMin = computed(() => portraitId.value.toString().length >= 1 || "Min 1 characters");
    const ruleTaken = computed(() => !allSpecialPortraits.value.map((x) => x.id).includes(portraitId.value.toString()) || "Portrait already exists");
    const ruleNumber = computed(() => {
      const pattern = /^[0-9]*$/;
      return pattern.test(portraitId.value.toString()) || "Must be a number";
    });
    const ruleNotZero = computed(() => !portraitId.value.toString().startsWith("0") || "Leading zero not allowed");

    const checkRules = computed(() => {
      return (
        !!portraitId.value &&
        portraitId.value.toString().length >= 1 &&
        !allSpecialPortraits.value.map((x) => x.id).includes(portraitId.value.toString()) &&
        /^[0-9]*$/.test(portraitId.value.toString()) &&
        !portraitId.value.toString().startsWith("0")
      );
    });

    const newPortraitDefinition: ComputedRef<PortraitDefinitionDTO> = computed((): PortraitDefinitionDTO => {
      return {
        ids: [portraitId.value],
        groups: groups.value,
      } as PortraitDefinitionDTO;
    });

    function confirmDialog(): void {
      if (!checkRules.value) return;
      dialogOpen.value = false;
      playerManagement.addNewPortraitDefinition(newPortraitDefinition.value);
    }

    async function init(): Promise<void> {
      const allSpecialPortraits = playerManagement.allSpecialPortraits;
      if (!(allSpecialPortraits.length > 0)) {
        await playerManagement.loadAllSpecialPortraits();
      }
      dialogOpen.value = false;
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      mdiClose,
      dialogOpen,
      valid,
      portraitId,
      confirmDialog,
      ruleRequired,
      ruleMin,
      ruleTaken,
      ruleNumber,
      ruleNotZero,
    };
  },
});
</script>
