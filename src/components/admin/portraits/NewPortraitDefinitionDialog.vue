<template>
  <v-row>
    <v-col>
      <v-dialog max-width="700">
        <template v-slot:activator="{ on }">
          <v-row class="justify-center ma-0 pa-0">
            <v-btn class="primary w3-race-bg--text" v-on="on">Create New PortraitDefinition (For Now!)</v-btn>
          </v-row>
        </template>
        <template>
          <v-card>
            <v-container>
              <v-row>
                <v-col>
                  <v-card-title class="justify-center">Add New PortraitDefinition</v-card-title>
                </v-col>

                <v-btn icon @click="vacant = false">
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
            <v-row>
              <v-container>
                <v-row class="justify-end">
                  <v-btn class="primary w3-race-bg--text">Confirm</v-btn>
                </v-row>
              </v-container>
            </v-row>
          </v-card>
        </template>
      </v-dialog>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { PortraitDefinition } from "@/store/admin/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import PortraitGroupCombobox from "./PortraitGroupCombobox.vue";

@Component({ components: { PortraitGroupCombobox } })
export default class NewPortraitDefinitionDialog extends Vue {
  portraitId = 0;

  get allSpecialPortraits(): PortraitDefinition[] {
    return this.$store.direct.state.admin.playerManagement.allSpecialPortraits;
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

  async init(): Promise<void> {
    const allSpecialPortraits = this.$store.direct.state.admin.playerManagement.allSpecialPortraits;
    if (!(allSpecialPortraits.length > 0)) {
      await this.$store.direct.dispatch.admin.playerManagement.loadAllSpecialPortraits();
    }
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
