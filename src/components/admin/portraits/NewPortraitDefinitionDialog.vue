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
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </v-row>

                <v-row>
                  <v-container class="ml-3 mr-3">
                    <v-text-field
                      v-model="portraitId"
                      :rules="[rules.required, rules.min, rules.taken, rules.number, rules.notZero]"
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
import { PortraitDefinition, PortraitDefinitionDTO } from "@/store/admin/types";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import PortraitGroupCombobox from "./PortraitGroupCombobox.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";

@Component({ components: { PortraitGroupCombobox } })
export default class NewPortraitDefinitionDialog extends Vue {
  portraitId = 0;
  dialogOpen = false;
  valid = false;
  groups = [] as string[];
  private playerManagement = usePlayerManagementStore();

  get allSpecialPortraits(): PortraitDefinition[] {
    return this.playerManagement.allSpecialPortraits;
  }

  get rules(): unknown {
    return {
      required: (value: string) => !!value || "Required",
      min: (text: string) => text.length >= 1 || "Min 1 characters",
      taken: (id: string) => !this.allSpecialPortraits.map((x) => x.id).includes(id) || "Portrait already exists",
      number: (value: number) => {
        const pattern = /^[0-9]*$/;
        return pattern.test(value.toString()) || "Must be a number";
      },
      notZero: (value: number) => value != 0 || "Don't use zero",
    };
  }

  newPortraitDefinition(): PortraitDefinitionDTO {
    return {
      ids: [this.portraitId],
      groups: this.groups,
    } as PortraitDefinitionDTO;
  }

  confirmDialog(): void {
    if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
      this.dialogOpen = false;
      this.playerManagement.addNewPortraitDefinition(this.newPortraitDefinition());
    }
  }

  async init(): Promise<void> {
    const allSpecialPortraits = this.playerManagement.allSpecialPortraits;
    if (!(allSpecialPortraits.length > 0)) {
      await this.playerManagement.loadAllSpecialPortraits();
    }
    this.dialogOpen = false;
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
